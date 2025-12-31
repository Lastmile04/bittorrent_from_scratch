import http from 'http';
import fsp from 'fs/promises';
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';
import querystring from 'querystring';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const users = [];
const favFoods = [];
const server = http.createServer(async(req, res)=>{
    const parsedUrl = new URL(req.url, `http://${req.headers.host}` );
    if(parsedUrl.pathname === '/' && req.method === 'GET'){
        try {
            const htmlPath = path.join(__dirname, 'app.html');
            const htmlContent = await fsp.readFile(htmlPath);
            res.writeHead(200, { 'Content-Type' : 'text/html' });
            res.end(htmlContent);
        } catch (error) {
            console.error('Error reading app.html', error);
            res.writeHead(500, { 'Content-Type' : 'text/plain' });
            res.end('500 - Internal Server Error');
        }
    } else if(parsedUrl.pathname === '/users' && req.method === 'POST'){
        let userData = ''
        console.log(`Request arrived for userData at time:${new Date().toLocaleTimeString}`);
        req.on('data', (chunk)=>{
            userData+=chunk.toString();
        });
        req.on('end', ()=>{
            console.log(`Request for userData ended at time: ${new Date().toLocaleTimeString}`);
            const formData_1 = querystring.parse(userData);
            const newUser = {
                name : formData_1.name,
                age : formData_1.age
            }
            users.push(newUser);
            console.log('New user added: ', newUser);
            console.log('All users: ', users);
            res.writeHead(200, { 'Content-Type' : 'text/plain' });
            res.end(`Response Arrived for userData at time: ${new Date().toLocaleTimeString}`);
        })
    } else if(parsedUrl.pathname === '/favFood' && req.method === 'POST'){
        let favFood_data = ''
        console.log(`Request arrived for favFood at time:${new Date().toLocaleTimeString}`);
        req.on('data', (chunk)=>{
            favFood_data+=chunk.toString();
        });
        req.on('end', ()=>{
            console.log(`Request for favFood ended at time: ${new Date().toLocaleTimeString}`);
            const formData_2 = querystring.parse(favFood_data);
            const newFavFood = {
                Favorite_Food : formData_2.favfood,
            }
            favFoods.push(newFavFood);
            console.log('New food added: ', newFavFood);
            console.log('All favFoods: ', favFoods);
            setTimeout(()=>{
                res.writeHead(200, { 'Content-Type' : 'text/plain'});
                res.end(`Response Arrived for favFoods at time: ${new Date().toLocaleTimeString}`)
            }, 2000)
        });
    } else{
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
    }
});
server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});