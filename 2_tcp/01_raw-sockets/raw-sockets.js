import net from 'net';
let activeConnections = 0;
const tcpServer = net.createServer((socket)=>{
    activeConnections++;
    console.log('Client connected');
    console.log('Active connections:', activeConnections);
    // data received
    socket.on('data', (chunk)=>{
        const msg = chunk.toString();
        console.log('Received data:', msg.trim());
        socket.write(msg);
    });
    
    socket.on('end', ()=>{
        activeConnections--;
        console.log('Client disconnected');
        console.log('Active connections:', activeConnections);
    });
    socket.on('close', ()=>{
        console.log('Socket is closed');
    })
    socket.on('error', (err)=>{
        console.error('Socket error:', err.message);
    });
});
tcpServer.listen(3000, ()=>{
    console.log('TCP server listening on port 3000');
});