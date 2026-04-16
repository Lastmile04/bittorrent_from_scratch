import EventEmitter from 'node:events';
// This class can work normally for a proper bittorrent protocl but for MVP i need to expose the parseHandshake result
// handle the connect and peer object and onError() bugs resolve reject multiple times and no timeout for connect()
export class BitTorrentPeer extends EventEmitter{
    constructor(socket, infoHash, peerId, protocolStr, peer, timeout = 10_000){
        super();
        this.socket = socket;
        this.infoHash = infoHash;
        this.peerId = peerId;
        this.timeout = timeout;
        this.peer = peer;
        this.protocolStr = protocolStr;


        this.ip = peer.ip;
        this.port = peer.port;
        

        // protocol state
        this.choked = true;
        this.interested = false;
        this.peerChoking = true;
        this.peerInterested = false;
        this.bitfield = null;
        this.buffer = Buffer.alloc(0);
        this.handshakeComplete = false;

        // task specific instances 
        this.remotePeerId = null;
        this.connectTimeout = null;
        this.resolve = null;
        this.reject = null;
        this.finished = false;
        this.connectStarted = false;

        // attach transport handlers
        this.handleData = this.onData.bind(this);
        this.handleEnd = this.onEnd.bind(this);
        this.handleClose = this.onClose.bind(this);
        this.handleError = this.onError.bind(this);
        this.handleConnect = this.onConnect.bind(this);

        this.socket.on('error', (err) => {
            // prevent crash
            this.fail({
                type: "SOCKET_ERROR",
                message: err.message
            });
        
        });

        this.socket.on('close', () => {
            if (!this.finished) {
                this.fail({
                    type: "SOCKET_CLOSED",
                    message: "Socket closed unexpectedly"
                });
            }
        });

    }

    // to expose the result of peerHandshake
    connect(){
        if(this.connectStarted === true) throw new Error('The reuse of connect() instance is not allowed!');

        return new Promise((res, rej)=>{
                this.connectStarted = true;
                this.resolve = res;
                this.reject = rej;
                this.finished = false;

                this.attachTransportHandlers();

                this.connectTimeout = setTimeout(()=>{
                    const err = new Error(`Handshake timeout for peer ${this.ip}:${this.port}`);
                    err.type = 'PEER_TIMEOUT';
                    this.fail(err);
                }, this.timeout);

                this.socket.connect(this.port, this.ip);
                this.emit("CONNECTING", { peer: `${this.ip}:${this.port}` });
        });
    }

    // attack listeners inside one function
    attachTransportHandlers(){
        
        this.socket.on('data', this.handleData);
        this.socket.once('end', this.handleEnd);
        this.socket.once('close', this.handleClose);
        this.socket.once('error', this.handleError);
        this.socket.once('connect', this.handleConnect);

    }

    // detach listener inside a single function
    detachTransportHandlers(){

        this.socket.off('data', this.handleData);
        this.socket.off('end', this.handleEnd);
        this.socket.off('close', this.handleClose);
        this.socket.off('error', this.handleError);
        this.socket.off('connect', this.handleConnect);

    }

    cleanup(){
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }
            this.socket.setTimeout(0);
            this.detachTransportHandlers();
    }

    succeed(value){
        if(this.finished) return;
        this.finished = true;
        this.cleanup();
        this.emit("HANDSHAKE_SUCCESS", value);
        this.resolve(value);
    }

    fail(err){
        if(this.finished) return;
        this.finished = true;
        this.emit("ERROR", {
            peer: `${this.ip}:${this.port}`,
            type: err.type || "UNKNOWN",
            message: err.message || "Unknown error"
        });
        this.cleanup();
        this.socket.destroy();
        this.reject(err);
    }


    onConnect(){
        this.emit("CONNECT_SUCCESS", { peer: `${this.ip}:${this.port}` });
        this.sendHandshake();
    }


    // Bittorrent handshake format:
    // <pstrlen><pstr><reserved><infoHash><peerId>
    sendHandshake(){
        const pstr = this.protocolStr;
        const pstrlen = Buffer.from([pstr.length]);
        const reserved = Buffer.alloc(8);

        try {
            const handshake_msg = Buffer.concat([pstrlen, pstr, reserved, this.infoHash, this.peerId]);
            this.socket.write(handshake_msg);
            this.emit("HANDSHAKE_SENT", { peer: `${this.ip}:${this.port}` });
        } catch (err) {

            this.fail(err);
            
        }
    }

    onData(chunk) {

        try {
            // Accumulate incoming bytes
            this.buffer = Buffer.concat([this.buffer, chunk]);

            // We only care about the Handshake phase
            if (!this.handshakeComplete) {
                if (this.buffer.length < 1) return;

                const receivedPstrlen = this.buffer[0];
                const handshakeLen = receivedPstrlen + 49;

                // Wait until the full handshake is in the buffer
                if (this.buffer.length < handshakeLen) return;

                // Parse and verify
                const parsed = this.parseHandshake();
                this.handshakeComplete = true;

                // Consume ONLY the handshake bytes
                this.buffer = this.buffer.slice(parsed.bytesConsumed);

                
                // We resolve with the parsed data AND the remaining buffer.
                // This is crucial if a Bitfield was sent in the same packet!
                this.succeed({
                    ...parsed,
                    leftoverBuffer: this.buffer 
                });

                // We stop here. cleanup() will run via succeed(), 
                // detaching this listener and making the class a "zombie."
            }
        } catch (err) {
                this.fail(err);
            }
    }

    // parese the response handshake
    parseHandshake(){
        
        const expectedPstrLen = this.protocolStr.length;
        const receivedPstrlen = this.buffer[0];

        // check protocol string length
        if(receivedPstrlen !== expectedPstrLen){
            const err = new Error('Protocol length mismatch');
            err.type = "PROTOCOL_MISMATCH";
            throw err;
        } 

        const handshakeStart = 0;
        const handshakeEnd = expectedPstrLen + 49;
        const handshake = this.buffer.subarray(handshakeStart,handshakeEnd);

        const protocolStart = 1
        const protocolEnd = 1+expectedPstrLen;
        const protocol = handshake.subarray(protocolStart, protocolEnd);

        // check protocol string
        if (!protocol.equals(this.protocolStr)) {
            const err = new Error('Protocol mismatch');
            err.type = "PROTOCOL_MISMATCH";
            throw err;
            
        }

        const reservedStart = protocolEnd;
        const reservedEnd = reservedStart + 8;
        const infoHashStart = reservedEnd;
        const infoHashEnd = infoHashStart + 20;
        const peerIdStart = infoHashEnd;
        const peerIdEnd = peerIdStart + 20;
        const totalHandshakeLength = peerIdEnd;

        const remoteInfoHash = handshake.subarray(infoHashStart , infoHashEnd );
        const remotePeerId = handshake.subarray(peerIdStart, peerIdEnd);
        

        // check infoHash
        if (!remoteInfoHash.equals(this.infoHash)){
            const err =  new Error('InfoHash mismatch');
            err.type = "INFOHASH_MISMATCH";
            throw err;
        }

        this.remotePeerId = Buffer.from(remotePeerId);

         return {
            peer: this.peer,
            ip: this.ip,
            port: this.port,
            remotePeerId,
            remotePeerIdHex: remotePeerId.toString('hex'),
            handshake,
            bytesConsumed: totalHandshakeLength,
        };
    }

    onEnd() {
        if(!this.handshakeComplete){
            const err = new Error(`Peer ended stream before handshake: ${this.ip}:${this.port}`);
            err.type = "PEER_ERROR";
            this.fail(err);
            return;
        };
        this.emit("CONNECTION_CLOSED", {
            peer: `${this.ip}:${this.port}`
        });
    }

    onClose() {
        if (!this.handshakeComplete && !this.finished) {
            const err = new Error(`Socket closed before handshake: ${this.ip}:${this.port}`);
            err.type = "SOCKET_ERROR";
            this.fail(err);
            return;
        }
        this.emit("SOCKET_CLOSED", {
            peer: `${this.ip}:${this.port}`
        });
    }

    onError(err) {
        this.fail(err);
    }
}
