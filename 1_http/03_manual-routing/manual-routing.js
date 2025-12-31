import http, { createServer } from 'http';
const server = createServer((req, res)=>{
    if(req.method === 'GET' && req.url === '/'){
        res.writeHead(200, {"content-type": "text/plain"});
        res.end('Is this the end');
    }
    else if(req.method === 'GET' && req.url === '/about'){
        res.writeHead(200, {"content-type": "text/plain"});
        res.end('Your friendly neighbourhood noob coder');
    }
    else if(req.method === 'GET' && req.url === '/contact'){
        res.writeHead(200, {"content-type": "text/plain"});
        res.end("Contact me at your nearest coding sweatshop");
    }
    else{
        res.writeHead(404, {"content-type": "text/plain"});
        res.end("Page not found");
    }
});

const PORT = 3000;
server.listen(PORT, 'localhost', ()=>{
    console.log(`Server starting at http://localhost:${PORT}/`);
});