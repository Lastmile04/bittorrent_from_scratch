import dgram from 'dgram';
import crypto from 'crypto';
import dns from 'dns/promises';
import { Buffer } from 'buffer';
import { parseCompactPeers } from '../peers/peerParser.js';

// helper custom error classes
// use super keyword to 
class TrackerTimeoutError extends Error{
    constructor(message = 'Tracker request timed out') {
        // use super keyword as we're inheriting from built-in Error class making it a child class
        super(message);
        this.name = "TrackerTimeoutError";
        this.code = "ERR_TRACKER_TIMEOUT";
    }
}

class TrackerResponseError extends Error{
        constructor(message = 'Tracker returned error response'){
            super(message);
            this.name = "TrackerResponseError";
            this.code = "ERR_TRACKER_RESPONSE";
        }
}

// cause is there to keep the original reason error happend
class RetryExhaustedError extends Error{
    constructor(message = 'Retry limit exhausted', cause = null){
        super(message);
        this.name = "RetryExhaustedError";
        this.code = "ERR_RETRY_EXHAUSTED";
        this.cause = cause;
    }
}


export async function udpPeer(trackerHost, trackerPort, infoHash, peerId, currPort, uploaded, downloaded, left, event, numwant) {
    // take a dual stack approch to detemine which client to use UDP4 or UDP6 

    // dns loolkup gives {address:, family:} , use dns/promises in particular to remove the use of promisify, as now dns lookup just returns promise instead of callback
    // all: true returns all available ips associated with that particualr hostname
    const addresses = await dns.lookup(trackerHost, {all: true});
    if(addresses.length === 0) throw new Error('Empty tracker list!');
    // try 6 first if doesn't work fallback to ipv4
    // sort addresses keep 6 first
    addresses.sort((a,b)=> b.family - a.family);
    // set a limit of addresses to lookup: right now the limit is 3 addresses from the list
    let addressLimit = Math.min(addresses.length, 3);


    for (let i = 0; i < addressLimit; i++){
        let addr = addresses[i];
        // one socket per resolved address
        let socket;
        try {
            socket = dgram.createSocket(addr.family === 6 ? "udp6" : "udp4" );
            // send connect packet
            const connectionId = await connect(socket, addr.address, trackerPort);
            console.log('CONNECT packet received!');
            // send announce packet
            const peerINFO = await announce(addr.family, socket, connectionId, addr.address, trackerPort, infoHash, peerId, currPort,downloaded, left, uploaded, event, numwant);
            console.log('ANNOUNCE packet received');

            return parsePeers(peerINFO, addr.family);

        } catch (error) {
            if(error instanceof RetryExhaustedError){
                console.log('address attempt failed, trying next address');
                continue;
            }
            if(error instanceof TrackerResponseError){
                console.error('tracker explicitly rejectd request');
                throw error;
            }
            
            throw error;

        } finally{          // to close the each socket  after it's task is done, no matter the result
            if(socket) socket.close();  // if socket exists then close it
        }
    }
    throw new Error('All tracker addresses failed!');
}

//  transformValid is 
function requestAttempt(socket, host, port, attemptNum, packetInfo, classifier, transformValid = (msg) => msg) {
    const { packet, txId } = packetInfo;
    const timeout = 15000 * 2 ** attemptNum;

    return new Promise((resolve, reject) => {
        let timer;
        let settled = false;

        const cleanup = () => {
            clearTimeout(timer);
            socket.off("message", msgListener);
            socket.off("error", errListener);
        };

        const doneResolve = (value) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        };

        const doneReject = (err) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(err);
        };

        const msgListener = (msg, rinfo) => {
            if (rinfo.address !== host || rinfo.port !== port) return;

            const type = classifier(msg, txId);

            switch (type) {
                case "error": {
                    let trackerMessage = "Tracker returned error response";
                    if (msg.length >= 8) trackerMessage = msg.subarray(8).toString("utf8");
                    return doneReject(new TrackerResponseError(trackerMessage));
                }
                case "ignore":
                    return;
                case "valid":
                    return doneResolve(transformValid(msg));
                default:
                    return;
            }
        };

        const errListener = (err) => doneReject(err);

        socket.on("message", msgListener);
        socket.on("error", errListener);

        timer = setTimeout(() => {
            doneReject(new TrackerTimeoutError());
        }, timeout);

        socket.send(packet, port, host, (err) => {
            if (err) doneReject(err);
        });
    });
}




// connect retry controller
async function connect(socket, host, port) {

    let lastError;
    const attemptLimit = 8;
    for (let attemptNum = 0; attemptNum < attemptLimit; attemptNum++){
        try {
            const packetInfo = buildConnect();
            const connectionId = await requestAttempt(
                                        socket,
                                        host,
                                        port,
                                        attemptNum,
                                        packetInfo,
                                        classifyConnectResponse,
                                        (msg) => msg.readBigUInt64BE(8)
                                    );
            return connectionId;
        } catch (error) {
            lastError = error;
            if(error instanceof TrackerTimeoutError)  continue; // retry
            if(error instanceof TrackerResponseError) throw error; // tracker failure (eg. action = 3)
            throw error; // unknown/ no need to retry
        }
    }
    
    throw new RetryExhaustedError('Connect retry exhausted', lastError);
}

 

function buildConnect(){
    // requires: protocolId(8), actionId(4), transactionId(4) -> 16 bytes
    // have to first create a buffer of 16 bytes and then fill the buffer with info cannot append like normal array
    const txId = crypto.randomBytes(4).readUInt32BE(0);
    const packet = Buffer.alloc(16);
    packet.writeBigUInt64BE( 0x41727101980n, 0);
    packet.writeUInt32BE(0, 8)
    packet.writeUInt32BE(txId, 12);
    return {packet, txId};
}

// classify response in: ignore, error & valid
// check length first -> then transaction id -> then finally action to see if error or valid
function classifyConnectResponse(msg, txId){

 if (msg.length < 8) return 'ignore';

  const action = msg.readUInt32BE(0);
  const transaction = msg.readUInt32BE(4);

  if (transaction !== txId) return 'ignore';
  if (action === 3) return 'error';
  if (action === 0 && msg.length >= 16) return 'valid';

  return 'ignore';
}



//--------annouce------------

async function announce(family, socket, connectionId, trackerHost, trackerPort, infoHash, peerId, port, downloaded, left, uploaded, event, numwant) {
    // attempt -> (build packet, setup listeners and other features, attach listeners, send packet, handle errors, receive and verify response )

    let lastError;
    const attemptLimit = 8;
    for (let attemptNum = 0; attemptNum < attemptLimit; attemptNum++){
        try {
            const packetInfo = buildAnnounce(connectionId, infoHash, peerId, downloaded, left, uploaded, event, numwant, port);
            const classifier = (msg, txId) => classifyAnnounceResponse(msg, txId, family);
                    
            const announceResponse = await requestAttempt(
                                            socket,
                                            trackerHost,
                                            trackerPort,
                                            attemptNum,
                                            packetInfo,
                                            classifier
                                        );

            return announceResponse;
        } catch (error) {
            lastError = error;
            if(error instanceof TrackerTimeoutError)  continue; // retry
            
            throw error; // unknown/ no need to retry
        }
    }
    
    throw new RetryExhaustedError('Announce retry exhausted', lastError);

}

// numwant lore:
    // want to use special value -1 for letting tracker decide how many peers to return
    // since in the packet structure packet field is unsigned that means the range goes from 0-4294967295
    // so no -ive values in packet, but -1 is still valid semantic value
    // -1 to binary then hex is 0xFFFFFFFF
    // to maintain protocol correctness the field has to remain unsigned
function buildAnnounce(connectionId, infoHash, peerId, downloaded, left, uploaded, event, numwant, port){
    const key = crypto.randomBytes(4);
    const txId = crypto.randomBytes(4).readUInt32BE(0);
    
    // packet size 98 bytes (8+4+4+20+20+8+8+8+4+4+4+4+2)
    let packet = Buffer.alloc(98);
    packet.writeBigUInt64BE(connectionId, 0); //connection ID
    packet.writeUInt32BE(1, 8); // action ID --> action : 1 for announce
    packet.writeUInt32BE(txId, 12); // randomly generted transaction ID
    infoHash.copy(packet, 16); // infoHash 
    peerId.copy(packet, 36); // peerId
    packet.writeBigUInt64BE(BigInt(downloaded), 56); //downloaded
    packet.writeBigUInt64BE(BigInt(left), 64); // left
    packet.writeBigUInt64BE(BigInt(uploaded), 72); // uploaded
    packet.writeUInt32BE(event, 80); // event 
    packet.writeUInt32BE(0, 84); // IPaddress
    key.copy(packet, 88); // random key bytes
    packet.writeUInt32BE(numwant === -1 ? 0xFFFFFFFF : numwant, 92); // numwant
    packet.writeUInt16BE(port, 96); // my port
    
    return {packet, txId};
}


function classifyAnnounceResponse(msg, txId, family){
    if(msg.length < 8) return "ignore";

    const action = msg.readUInt32BE(0);
    const transactionId = msg.readUInt32BE(4);

    if(transactionId !== txId) return "ignore"
    if(action === 3) return "error";
    if(action === 1){
        // length check for valid
        if(msg.length < 20) return "ignore";

        const peerBytes = msg.length - 20;

        //validate based on family
        if (family === 4 && peerBytes % 6 === 0) return "valid";
        if (family === 6 && peerBytes % 18 === 0) return "valid";   

        }  
        return "ignore";
    } 

// family 4 -> step 6
// family 6 -> step 18
function parsePeers(res, family){
    const interval = res.readUInt32BE(8);
    const leechers = res.readUInt32BE(12);
    const seeders = res.readUInt32BE(16);
    const peers = parseCompactPeers(family, res.slice(20));

    return { interval, seeders, leechers, peers, peerNum: peers.length };
}