import net from 'net';
const server = net.createServer((socket)=>{
    console.log('Client Connected');
    let buffer = Buffer.alloc(0);
    const MAX_ALLOWED = 65536;
    socket.on('data', (chunk)=>{
        buffer = Buffer.concat([buffer,chunk]);
        while(true){
            if(buffer.length < 4) break;
            const lengthBytes = buffer.slice(0,4);
            const length = lengthBytes.readUInt32BE(0);
            if(Number.isNaN(length) || length < 1 || MAX_ALLOWED < length){
                console.log('Invalid Length prefix:', length);
                socket.destroy();
                return;
            }
            if(buffer.length < 4 + length) break;
            const msg_ID = buffer.readUInt8(4);
            const payloadStart = 5;
            const payloadEnd = 4 + length;
            const payload = buffer.slice(payloadStart, payloadEnd);
            switch (msg_ID) {
                case 1:
                    console.log('PONG: Response of the ping by the server ');
                    const pong_length = 1 ;
                    const response = Buffer.alloc(4 + pong_length);
                    response.writeUInt32BE(pong_length, 0);
                    response.writeUint8(2,4);
                    socket.write(response);
                    break;
                
                case 3:
                    console.log('Echo Payload');
                    const echoLength = 1 + payload.length;
                    const echo = Buffer.alloc(4 + echoLength);
                    echo.writeUInt32BE(echoLength, 0);
                    echo.writeUInt8(3,4);
                    payload.copy(echo, 5);
                    socket.write(echo);
                    break;
                
                case 4:
                    console.log('Convert payload to uppercase');
                    const text = payload.toString('utf-8');
                    const upper = text.toUpperCase();
                    const upperBuf = Buffer.from(upper, 'utf-8');
                    const upperBuf_res_length = 1 + upperBuf.length;
                    const reply = Buffer.alloc(4 + upperBuf_res_length);
                    reply.writeUInt32BE(upperBuf_res_length, 0);
                    reply.writeUInt8(4, 4);
                    upperBuf.copy(reply, 5);
                    socket.write(reply);
                    break;
                case 5:
                    console.log('Reverse the payload');
                    const reverse = Buffer.from(payload).reverse();
                    const rev_res_length = 1 + reverse.length;
                    const rev = Buffer.alloc(4 + rev_res_length);
                    rev.writeUInt32BE(rev_res_length, 0);
                    rev.writeUInt8(5,4);
                    reverse.copy(rev, 5);
                    socket.write(rev);
                    break;
                case 6:
                    console.log('Close the payload');
                    socket.end();
                    return;
                default:
                    console.log('Unknown msgID');
                    socket.end();
                    break;
                }
            buffer = buffer.slice(4+length);
        }
    });
})