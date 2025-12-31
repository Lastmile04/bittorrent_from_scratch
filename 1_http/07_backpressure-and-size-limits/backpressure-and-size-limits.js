import http from 'http';
import fsp from 'fs/promises';
import path, { dirname, parse } from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';
import querystring from 'querystring';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let users = [];
const MAX_ALLOWED = 1024;
const server = http.createServer(async(req, res)=>{
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    if(parsedUrl.pathname === '/' && req.method === 'GET'){
        try {
            const htmlPath = path.join(__dirname, 'app.html');
            const htmlContent = await fsp.readFile(htmlPath);
            res.writeHead(200, { 'Content-Type' : 'text/html' });
            res.end(htmlContent);
        } catch (error) {
            console.error('Error reading app.html', error);
            res.writeHead(500, { 'Content-Type' : ' text/plain' });
            res.end('500 - Internal server error');
        }
    } else if(parsedUrl.pathname === '/users' && req.method === 'POST'){
        let bytesReceived = 0;
        let totalData = '';
        req.on('error', (error)=>{
            console.error('Request error:', error.message);
            if(error.code === 'ERR_STREAM_DESTROYED'){
                console.log('(Stream destroyed due to backpressure)');
            }
        });
        req.on('data', (chunk)=>{
            totalData+=chunk.toString();
            bytesReceived+=chunk.length;
            console.log('Bytes Received:', bytesReceived);
            // Predictive size checking in this you want to check if adding this chunk get me over the limit or not
            if(bytesReceived+chunk.length > MAX_ALLOWED){
                console.error('Error! Request body too big for the server to handle');
                res.writeHead(413, { 'Content-Type' : 'text/plain' });
                res.end('413 - Payload Too Large');
                req.destroy();
                return;
            }
        });
        req.on('end', ()=>{
            if(bytesReceived > MAX_ALLOWED){
                console.log('Request rejected; skipping processing');
                return;
            }
            const formData = querystring.parse(totalData);
            const newUser = {
                name : formData.name,
                age : parseInt(formData.age),
            };
            users.push(newUser);
            console.log('New user added:', newUser);
            console.log('All users: ', users);
            res.writeHead(200, { 'Content-Type' : 'text/plain' });
            res.end('New User Added');
        });
    } else{
        res.writeHead(404, { 'Content-Type' : 'text/plain' });
        res.end('404 - Error Found');
    }
});
server.listen(3000, 'localhost', ()=>{
    console.log('Server is alive at http://localhost:3000');
})
