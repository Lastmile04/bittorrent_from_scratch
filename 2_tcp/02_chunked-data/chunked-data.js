import net from 'net';
const server = net.createServer((socket)=>{
    console.log('Client Connected');
    // Per Socket buffer
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk)=>{
        // append incoming chunk to pre-socket buffer
        buffer = Buffer.concat([buffer,chunk]);
        // repeatedly try to extract the complete messages
        while(true){
            const colonPos = buffer.indexOf(58);
            if(colonPos === -1){
                // no length prefix yet -> wait for more data
                break;
            }
            const lengthBytes = buffer.slice(0,colonPos);
            const lengthStr = lengthBytes.toString().trim();
            const expectedLength = parseInt(lengthStr, 10);
            if(Number.isNaN(expectedLength) || expectedLength < 0){
                console.log('Invalid length prefix:', lengthStr);
                socket.destroy();
                return;
            }
            const payloadStart = colonPos + 1;
            // we already have the start index and the expected length to get the end index just add the length in the start index
            const payloadEnd = expectedLength + payloadStart;
            // check if we have full payload in buffer
            if(buffer.length < payloadEnd){
                // not enough bytes yet->wait for next data event
                break;
            }
            // Extract full message
            const payloadBytes = buffer.slice(payloadStart, payloadEnd);
            const payload = payloadBytes.toString();
            // process message (log+ echo back with the same framing)
            console.log('Complete message:', payload);
            const echo = `${expectedLength}:${payload}`;
            socket.write(echo);
            // remove the processed message from buffer
            buffer = buffer.slice(payloadEnd);
        }
    });
    socket.on('end', ()=>{
        console.log('Client disconnected');
    });
    socket.on('close', ()=>{
        console.log('Socket is closed');
    });
    socket.on('error', (error)=>{
        console.error('Socket error:', error.message);
    });
});
server.listen(4000, () => {
  console.log('Length‑prefixed TCP server on port 4000');
});