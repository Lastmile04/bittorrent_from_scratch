import net from 'net';
// Component 1: Connection State
const ConnectionState = {
    CONNECTED : 'CONNECTED',    //Just connected, no connections yet
    READY : 'READY',            // Accepted first valid message, ready for regular operations
    CLOSING : 'CLOSING',        //Received close command, shutting down
    CLOSED : 'CLOSED'           //Socket ended/disconnected
}
// Component 2: State Validator
const STATE_RULES = {
    CONNECTED : [1],
    READY : [1, 3, 4, 5, 6],
    CLOSING : [],
    CLOSED : []
}
// Component 3: State Transition
const STATE_TRANSITION = {
    1 : ConnectionState.READY,
    3 : ConnectionState.READY,
    4 : ConnectionState.READY,
    5 : ConnectionState.READY,
    6 : ConnectionState.CLOSING
}
const server = net.createServer((socket)=>{
    console.log('Client Connected');
    const state = {
        current : ConnectionState.CONNECTED,
        connectedAt : Date.now(),
        lastActivityAt : Date.now(),
        messageHandled : 0,
        lastMsgID : null
    };
    socket.state = state // Attaching socket to state for easy access
    const MAX_ALLOWED = 65536;
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk)=>{
        state.lastActivityAt = Date.now();
        if(state.current === ConnectionState.CLOSED) return; //Ignore data if closed
        buffer = Buffer.concat([buffer, chunk]);
        while(true){
            if(buffer.length < 4) break;
            const lengthBytes = buffer.slice(0, 4);
            const length = lengthBytes.readUInt32BE(0);
            if(Number.isNaN(length) || length < 1 || length > MAX_ALLOWED){
                console.log(`Invalid length from socket state ${state.current}`);
                socket.destroy();
                state.current = ConnectionState.CLOSED;
                return;
            }
            if(buffer.length < 4+length) break;
            const msg_ID = buffer.readUInt8(4);
            const payloadStart = 5;
            const payloadEnd = 4 + length;
            const payload = buffer.slice(payloadStart, payloadEnd);
            state.messageHandled++;
            state.lastMsgID = msg_ID;
            // Feature 1 & 2: Validate Message 
            if(!isMessageAllowed(msg_ID, state.current)){
                console.log(`🚫 PROTOCOL VIOLATION: msg_ID ${msg_ID} not allowed in state ${state.current}`);
                state.current = ConnectionState.CLOSING;
                buffer = Buffer.alloc(0);
                socket.end();
                return;
            }
            console.log(`✅ ${state.current} Allowed msg_ID: ${msg_ID}`);
            // Feature 3 : Process Message
            handleMessage(socket, state, msg_ID, payload);
            if(state.current === ConnectionState.CLOSING || state.current === ConnectionState.CLOSED) return;
            buffer = buffer.slice(4 + length);
        }
    });
    socket.on('end', ()=>{
        console.log(`[Read side closed] Socket ended in state ${state.current}`);
        state.current = ConnectionState.CLOSED;
    });
    socket.on('close', ()=>{
        console.log(`[Write side closed] Socket closed. Final state: ${state.current}`);
        state.current = ConnectionState.CLOSED;
    });
    socket.on('error', (error)=>{
        console.error(`Socket error in state ${state.current}: ${error.message}`);
        state.current = ConnectionState.CLOSED;
    });
});
// Component 2: State Validator Function
function isMessageAllowed(msgID, currentState){
    const allowedIDs = STATE_RULES[currentState];
    return allowedIDs && allowedIDs.includes(msgID);
}
// Message Handler
function handleMessage(socket, state, msgID, payload){
    console.log(`[${state.current}] Handling msgID ${msgID}`);
    switch (msgID) {
        case 1: {//PING
            console.log('PING received')
            const pongLen = 1;
            const res = Buffer.alloc(4 + pongLen);
            res.writeUInt32BE(pongLen, 0);
            res.writeUInt8(2, 4);
            socket.write(res);
            break;
        }case 3: { //ECHO
            console.log('ECHO received')
            const echoLen = 1 + payload.length;
            const res = Buffer.alloc(4 + echoLen);
            res.writeUInt32BE(echoLen, 0);
            res.writeUInt8(3, 4);
            payload.copy(res, 5);
            socket.write(res);
            break;
        }case 4: { //Uppercase
            console.log('Uppercase received')
            const upper = payload.toString('utf8').toUpperCase();
            const upperBuf = Buffer.from(upper, 'utf8');
            const upperLen = 1 + upperBuf.length;
            const res = Buffer.alloc(4 + upperLen);
            res.writeUInt32BE(upperLen, 0);
            res.writeUInt8(4, 4);
            upperBuf.copy(res, 5);
            socket.write(res);
            break;
        }case 5: { //Reverse
            console.log('Reverse received')
            const reverseBuf = Buffer.from(payload).reverse();
            const reverseLen = 1 + reverseBuf.length;
            const res = Buffer.alloc(4 + reverseLen);
            res.writeUInt32BE(reverseLen, 0);
            res.writeUInt8(5, 4);
            reverseBuf.copy(res, 5);
            socket.write(res);
            break;
        }case 6: { //Close 
            console.log('Close received - ending connection');
            socket.end();
            break;
        }
    }
    // Component 3: Update State transition processing
    if(STATE_TRANSITION[msgID]){
        const newState = STATE_TRANSITION[msgID];
        console.log(`State transition: ${state.current} -> ${newState}`);
        state.current = newState;
    }
}
server.listen(4000, () => {
    console.log('TCP Server with state machine listening on 4000');
});


