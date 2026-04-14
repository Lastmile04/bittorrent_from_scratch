// This class can work normally for a proper bittorrent protocl but for MVP i need to expose the parseHandshake result
// handle the connect and peer object and onError() bugs resolve reject multiple times and no timeout for connect()
export class BitTorrentPeer{
    constructor(socket, infoHash, peerId, protocolStr, peer, timeout = 10_000){
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
                    this.fail(new Error(`Handshake timeout for peer ${this.ip}:${this.port}`));
                }, this.timeout);

                this.socket.connect(this.port, this.ip);
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
        clearTimeout(this.connectTimeout);
        this.connectTimeout = null;
        this.detachTransportHandlers();
    }

    succeed(value){
        if(this.finished) return;
        this.finished = true;
        this.cleanup();
        this.resolve(value);
    }

    fail(err){
        if(this.finished) return;
        this.finished = true;
        this.cleanup();
        this.socket.destroy();
        this.reject(err);
    }

    onConnect(){
        console.log(`Connection with peer ${this.ip}:${this.port} established`);
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
        } catch (err) {
            console.error('[Peer] Failed to send handshake:', err.message);
            this.socket.destroy();
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
            throw new Error('Protocol length mismatch');
        } 

        const handshakeStart = 0;
        const handshakeEnd = receivedPstrlen + 49;
        const handshake = this.buffer.slice(handshakeStart,handshakeEnd);

        const protocolStart = 1
        const protocolEnd = 1+receivedPstrlen;
        const protocol = handshake.slice(protocolStart, protocolEnd);

        // check protocol string
        if (!protocol.equals(this.protocolStr)) {
            throw new Error('Protocol mismatch');
            
        }

        const reservedStart = protocolEnd;
        const reservedEnd = reservedStart + 8;
        const infoHashStart = reservedEnd;
        const infoHashEnd = infoHashStart + 20;
        const peerIdStart = infoHashEnd;
        const peerIdEnd = peerIdStart + 20;
        const totalHandshakeLength = peerIdEnd;

        const remoteInfoHash = handshake.slice(infoHashStart , infoHashEnd );
        const remotePeerId = handshake.slice(peerIdStart, peerIdEnd);
        

        // check infoHash
        if (!remoteInfoHash.equals(this.infoHash)){
            throw new Error('InfoHash mismatch');
        }

        this.remotePeerId = Buffer.from(remotePeerId);

        console.log(`[Peer]: ${this.ip}:${this.port} Handshake verified with:`, remotePeerId.toString('hex'));
        

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
            this.fail(new Error(`Peer ended stream before handshake: ${this.ip}:${this.port}`));
            return;
        };
        console.log('[Peer] read side closed');
    }

    onClose() {
        if (!this.handshakeComplete && !this.finished) {
            this.fail(new Error(`Socket closed before handshake: ${this.ip}:${this.port}`));
            return;
        }
        console.log('[Peer] socket closed');
    }

    onError(err) {
        this.fail(err);
    }
}
