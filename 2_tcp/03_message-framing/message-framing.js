import net from 'net';
const server = net.createServer((socket)=>{
    console.log('Client connected');
    let buffer = Buffer.alloc(0);
    const MAX_ALLOWED = 65536;
    socket.on('data', (chunk)=>{
        buffer = Buffer.concat([buffer, chunk]);
        // start the loop to keep processing data 
        while(true){
            if(buffer.length < 4){
                // no length prefix yet -> wait for more data
                break;
            }
            const lengthBytes = buffer.slice(0, 4);
            const length = lengthBytes.readUInt32BE(0);
            if(Number.isNaN(length) || length < 1 || length > MAX_ALLOWED){
                console.log('Invalid length prefix:', length);
                socket.destroy();
                return;
            }
            if(buffer.length < 4 + length){
                // Complete message is not in the buffer yet -> wait for more data
                break;
            }
            const msg_ID = buffer.readUInt8(4);
            const payloadStart = 5;
            const payloadEnd = 4 + length;
            const payload = buffer.slice(payloadStart, payloadEnd);
            console.log('Message ID:', msg_ID, 'Payload length:', payload.length);
            const echo = Buffer.alloc(4 + 1 + payload.length);
            echo.writeUInt32BE(length, 0);
            echo.writeUint8(msg_ID, 4);
            payload.copy(echo, 5);
            socket.write(echo);
            // remove the processed message
            buffer = buffer.slice(4+length);
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
