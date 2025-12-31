import http from 'http';
const server = http.createServer((req, res)=>{
    res.write("This server is alive");
    res.end();
});
const PORT = 3000;
server.listen(PORT, 'localhost', ()=> {
    console.log(`Server running at http://localhost:${PORT}/`);
});