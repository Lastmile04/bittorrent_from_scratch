import { percentEncode } from "./encode.js";
import http from 'http';
import https from 'https';
import { Buffer } from 'buffer';
import { decode } from "../codec/bencode.js";
import zlib from 'zlib';
import { parseCompactPeers } from "../peers/peerParser.js";
import { parseNonCompactPeers } from "../peers/peerParser.js";
import { validateBencode } from "../codec/validator.js";

// Imports needed for response test
// import { parseTorrentFile } from "../app/torrent-loader.js";
// import { generatePeerId } from "../identity/peerId.js";
// import { bytesLeft } from "./bytesLeft.js";

// decode from bencode.js
export async function httpPeers(trackerUrl, infoHash, peerId, port, uploaded, downloaded, left, numwant, event) {
    const paramsObj = { infoHash, peerId, port, uploaded, downloaded, left, numwant, event };
    const url    = buildAnnounce(trackerUrl, paramsObj);
    const buffer = await fetchTracker(url);

    // validate raw buffer first, then decode
    validateBencode(buffer);
    const decoded = decode(buffer, 0);
    if (decoded.value.type !== 'Dictionary') throw new Error('Response is not a dictionary');

    return normalizeTracker(decoded.value.value);
}


function buildAnnounce(baseUrl, urlObj){
    let params = [];

    params.push(`info_hash=${percentEncode(urlObj.infoHash)}`);
    params.push(`peer_id=${percentEncode(urlObj.peerId)}`);
    params.push(`port=${urlObj.port}`);
    params.push(`uploaded=${urlObj.uploaded ?? 0}`);
    params.push(`downloaded=${urlObj.downloaded ?? 0}`);
    params.push(`left=${urlObj.left}`);
    params.push(`compact=1`);
    params.push(`numwant=${urlObj.numwant ?? 50}`);

    if(urlObj.event) params.push(`event=${urlObj.event}`);
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${params.join('&')}`;
}


async function fetchTracker(url) {
    return new Promise((resolve, reject)=>{
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        // Since this support gzip handling
        const req = client.get(urlObj, {headers: { 'Accept-Encoding': 'gzip' } }, (res)=>{
            
            const encoding = res.headers['content-encoding'];
            
            if(res.statusCode !== 200 ){
                reject(new Error(`Tracker returned: ${res.statusCode}`));
                res.resume();
                return
            }
            let chunks = [];

            res.on('data', chunk => chunks.push(chunk));

            res.on('end', () => {
              const rawBuffer = Buffer.concat(chunks);
              let finalBuffer = rawBuffer;  // Default: uncompressed

            //   Just in case node lowercases header keys and HTTP is case sensitive the safe option is to include toLowerCase
              if (encoding && encoding.toLowerCase().includes('gzip')) {
                // since gzip can throw, use try and catch
                try {
                    finalBuffer = zlib.gunzipSync(rawBuffer);
                } catch (error) {
                    reject(new Error('Invalid gzip response from tracker'));
                    return;
                }
              }

              resolve(finalBuffer);  // Always resolves the right buffer
            });
            
        });

        req.setTimeout(10000, ()=>{
            req.destroy();
            reject(new Error(`Tracker timeout`));
        });

        req.on('error', reject);
        req.end();
    })
}



function normalizeTracker(response){

    // Phase 2: Extract fields
    let interval = 0;
    let compact4  = null;   // peers  → IPv4 compact binary
    let compact6  = null;   // peers6 → IPv6 compact binary
    let nonCompact = null;  // peers  → non-compact list of dicts
    let seeders = 0;
    let leechers = 0;  

    for(const [keyBuffer, valueIR] of response){
        
        const key = keyBuffer.toString('utf8');
        const type = valueIR.type;
        const value = valueIR.value;

        switch (key) {
            // phase 1: throw error first thing after checking for failure reason key
            case 'failure reason':
                throw new Error(`Tracker failure: ${value.toString('utf-8')}`);  // ← first case, throws immediately

            case 'interval':
                if ( type !== 'Integer' ) throw new Error('interval must be Integer');
                interval = value;
                break;

            case 'peers':
                
                if (type !== 'String' && type !== 'List') throw new Error(`Malformed peers do not match correct type:${type}`);
                if (type === 'String') compact4 = value; // compact IPv4
                if (type === 'List') nonCompact = value; // non-compact contains both IPv4 and IPv6
                break;

            case 'peers6':
                if ( type !== 'String' ) throw new Error(`Malformed peers do not match correct type:${valueIR.value}`);
                else compact6 = value; // compact IPv6
                break;

            case 'complete':
                if (type !== 'Integer') throw new Error('complete must be Integer');
                seeders = value;
                break;

            case 'incomplete':
                if (type !== 'Integer') throw new Error('incomplete must be Integer');
                leechers = value;
                break;

            default: break;
        }
    }

    // Phase 3: Validate required fields
    if(!interval || interval <=0) throw new Error('Invalid or missing interval');
    
    let peers = [];
    // length check just to make sure that some string exists in the buffer since for js empty buffer is still a truthy and valid value
    if (compact4 && compact4.length > 0) peers.push(...parseCompactPeers(4, compact4));
    if (compact6 && compact6.length > 0) peers.push(...parseCompactPeers(6, compact6));
    if (nonCompact && nonCompact.length > 0) peers.push(...parseNonCompactPeers(nonCompact));

    
    return { interval, seeders, leechers, peers, peerNum:peers.length }
}



// function parsePeers(compact4, compact6, nonCompact){

//     const seen = new Set();
//     let peers = []

//     // non-compact peers are in bencoded dictionart format
//     if(nonCompact){
//         for (const peerIR of nonCompact){

//             if(peerIR.type !== 'Dictionary') throw new Error("Non-Compact list does not contain dictionary inside it!");
//             let ip = null;
//             let port = null;
//             for(const[keyBuffer, valueIR] of peerIR.value){
//                 const key = keyBuffer.toString('utf-8');

//                 switch (key) {
//                     case "ip":
//                         if(valueIR.type === 'String'){
//                             ip = valueIR.value.toString("utf-8");
//                         }
//                     break;

//                     case "port":
//                         if(valueIR.type === 'Integer'){
//                             port = valueIR.value;
//                             if(port === 0) throw new Error("Port is 0, it shouldn't be")
//                         }
//                     break;
//                 }
//             }
//             if (ip === null || port === null) throw new Error(`Either ip or port missing: ip=${ip}, port=${port}`);
//             const key = `${ip}:${port}`;
//             if(!seen.has(key)){
//                 seen.add(key);
//                 peers.push({ip, port});
//             }
//         }
//     }

//     // compact4 peers are simply binary string, there are no delimiters just fixed size of 6 bytes (IP(4) + Port(2)Big-endian) for each peer
//     if (!nonCompact && compact4){
//         if (compact4.length % 6 !== 0) throw new Error('Tracker response for compact IPv4 addressed is malformed');

//         let offset = 0
//         while (offset<compact4.length){
//             let ip = [];
//             let port = 0;
            
//             for (let j = 0; j<4; j++){
//                 ip.push(compact4.readUInt8(offset + j));
//             }
//             port = compact4.readUInt16BE(offset+4);
//             // readUint16 always guarantees the returned value to be between 0-65535, still thorw error for strict parser
//             if (port === 0) throw new Error('Invalid Port Number:', port);
//             // push to key to the set for deduplication
//             const ipStr = ip.join(".");
//             const key = `${ipStr}:${port}`;
//             if (!seen.has(key)) {
//                 seen.add(key);
//                 peers.push({ ip: ipStr, port });
//             }
//             offset+=6;
//         }
        
//     } 
    
//     // comapct6 peers are 18 bytes binary with 16bytes ip + 2bytes port
//     if(compact6){
//         if (compact6.length % 18 !== 0) throw new Error('Tracker response for compact IPv6 addressed is malformed');

//         let offset = 0
//         while (offset<compact6.length){
//             let ip = [];
//             let port = 0;
//             // since ipv6 uses 16 bit groups(2bytes each)
//             for (let j = 0; j<16; j+=2){
//                 let group = compact6.readUInt16BE(offset+j);
//                 // since ipv6 uses hex we can convert each byte to hex then later join
//                 ip.push(group.toString(16).padStart(4, '0'));
//             }
//             port = compact6.readUInt16BE(offset+16);
//             // readUint16 always guarantees the returned value to be between 0-65535, still thorw error for strict parser
//             if (port === 0) throw new Error('Invalid Port Number:', port);
//             // push to key to the set for deduplication
//             const ipStr = ip.join(":");
//             const key = `${ipStr}:${port}`;
//             if (!seen.has(key)) {
//                 seen.add(key);
//                 peers.push({ ip: ipStr, port });
//             }
//             offset+=18;
//         }
//     }
//     return peers;
// }

// function compressIPv6(ipParts) {
//     // Convert to full format first
//     const fullParts = ipParts.map(part => part.padStart(4, '0'));
//     let ip = fullParts.join(':');
    
//     // Replace longest sequence of consecutive zeros with ::
//     ip = ip.replace(/\b:?(?:0+:?){2,}\b/g, '::');
    
//     return ip;
// }

// // Decode test
// const torrentPath = 'Just put the path to your torrent';
// const torrentPath = 'C:\\Users\\thaku\\code\\Github_projects\\bittorrent_from_scratch\\3_bittorrent\\samples\\debian.torrent';


// async function testHttpTracker() {
//     const { buffer, torrentAnnounceList, infoSection, infoHash, infoHashHex, valid } = parseTorrentFile(torrentPath);
    
//     const peerId = generatePeerId('PC', '0001');
//     const left = bytesLeft(infoSection.raw);
    
//     console.log('trackers:', torrentAnnounceList);
//     console.log('infoHash:', infoHash.toString('hex'));
//     console.log('peerId:', peerId.toString('hex'));
//     console.log('left:', left);
    
//     // Use FIRST tracker from announce list
//     const trackerUrl = torrentAnnounceList[0][0]; // First tier, first tracker
//     console.log('Using tracker:', trackerUrl);
    
//     try {
//         const result = await httpPeers(trackerUrl, infoHash, peerId, 4000, left);
//         console.log(' Tracker SUCCESS:', result);
//     } catch (error) {
//         console.error(' Tracker error:', error.message);
//     }
// }

// testHttpTracker();