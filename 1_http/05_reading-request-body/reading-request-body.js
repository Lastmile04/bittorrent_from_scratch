import http from 'http';
import fsp from 'fs/promises';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import path from 'path';
let users = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = http.createServer(async(req, res)=>{
    let totalData = '';
    let chunkCount = 0;

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    if(parsedUrl.pathname === '/' && req.method === 'GET'){
        try {
            const htmlPath = path.join(__dirname, 'app.html');
            const htmlContent = await fsp.readFile(htmlPath, 'utf-8');
            res.writeHead(200, {'Content-Type' : 'text/html'});
            res.end(htmlContent);
        } catch (error) {
            console.error('Error reading app.html:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 - Internal Server Error');
        }
    } else if( parsedUrl.pathname === '/users' && req.method === 'POST'){
        console.log(`Request Started at ${new Date().toLocaleTimeString}`);
        req.on('data', (chunk)=>{
            chunkCount++;
            console.log(`[Chunk ${chunkCount} arrived] Raw chunk of data received of size: ${chunk.length} bytes\n Chunk: `, chunk);
            totalData +=chunk.toString();
        });
        req.on('end', ()=>{
            console.log('End of request(All chunks received)');
            let data;
            try {
                data = JSON.parse(totalData);
            } catch (error) {
                console.error('Error while parsing JSON:', error);
                res.writeHead(400, { 'Content-type' : 'application/json' });
                return res.end(
                    JSON.stringify({error: 'Invalid JSON in request body'})
                );
            }
            const newUser = {
                name : data.name,
                age : parseInt(data.age, 10),
            };
            users.push(newUser);
            console.log('New user added: ', newUser);
            console.log('All users: ', users);
            res.writeHead(200, { 'Content-Type' : 'application/json' });
            res.end(JSON.stringify({ message: 'New user added', user: newUser }));
        });
    } else{
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
    }
});
server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
})