import http from 'http';

const server = http.createServer((req, res)=>{
    res.write("I'll just observe\n");
    console.log(req.method);
    console.log(req.url);
    console.log(req.headers);
    res.end('Request inspected!');
});
const PORT = 3000;
server.listen(PORT, 'localhost', ()=>{
    console.log(`Server running at http://localhost:${PORT}/`);
});