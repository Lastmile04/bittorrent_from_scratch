import http from 'http';
import fsp from 'fs/promises';
import path from 'path';
import url from 'url';
import querystring from 'querystring';
import { fileURLToPath } from 'url';

// create a users array
let users = [];

const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create a server and add conditions
const server = http.createServer(async (req, res)=>{



    if(parsedUrl.pathname === '/' && req.method === 'GET'){
        console.log(`${req.method} ${parsedUrl.pathname}`);
        try {
            const htmlPath = path.join(__dirname, 'app.html');
            const htmlContent = await fsp.readFile(htmlPath, 'utf-8'); // await here
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
        } catch (err) {
            console.error('Error reading app.html:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 - Internal Server Error');
        }
    }

    else if(req.method === 'GET' && parsedUrl.pathname === '/users'){
        console.log(`${req.method} ${parsedUrl.pathname}`);
        // build a simple html list
        let body = '<h1> All Users</h1>';
        if(users.length === 0){
            body+='<p>No users yet</p>';
        } else{
            body+='<ul>';
            for(const user of users){
                body+=`<li>${user.name} (Age: ${user.age}</li>`;
            }
            body+='</ul>'
        }
        body += `<a href="/"> Back to form</a>`;
        res.writeHead(200, {'Content-type' : 'text/html'});
        res.end(body);
    }

    else if(req.method === 'POST' && parsedUrl.pathname === '/users'){
        console.log(`${req.method} ${parsedUrl.pathname}`);
        let body ='';
        req.on('data', (chunk)=>{
            body += chunk.toString();
        });
        req.on('end', ()=>{
            const formData = querystring.parse(body);
            const newUser = {
                name : formData.name,
                age : parseInt(formData.age)
            };
            users.push(newUser);
            console.log('New user added: ', newUser);
            console.log('All users: ', users);
            res.writeHead(302, { Location: '/users' });
            res.end();
        });
    }

    else{
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
    }
});
server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});
