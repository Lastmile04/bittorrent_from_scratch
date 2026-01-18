import net from 'net';
import { decode, encode } from './bencode.js';
const server = net.createServer((socket)=>{
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk)=>{
        let offset = 0;
        buffer = Buffer.concat([buffer, chunk]);
        while( offset < buffer.length){
            try {
                const result = decode(buffer, offset);
                // 3. If incomplete, STOP and wait for more data
                if (result.incomplete) {
                    break;
                }
                // 4. If successful, "Consume" the data
                console.log("Decoded Message:", result.value);
                // Move the offset to the end of the successfully parsed object
                offset = result.nextOffset;

                const encoded_data = encode(result.value);
            } catch (err) {
                console.error("Protocol Error:", err.message);
                socket.destroy(); // Close connection on malicious/bad data
                return;
            }
        }
        //TRUNCATE: Remove the processed bytes from the buffer
        // keep the buffer small and efficient
        if (offset > 0) {
            buffer = buffer.slice(offset);
        }
    });
    socket.on('end', ()=>{
        console.log(`[Read side closed] Socket ended `);

    });
    socket.on('close', ()=>{
        console.log(`[Write side closed] Socket closed.`);

    });
    socket.on('error', (error)=>{
        console.error(`Socket error `);

    });
});

server.listen(4000, () => {
    console.log('TCP Server with state machine listening on 4000');
});