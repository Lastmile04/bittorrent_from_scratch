import http from 'http';
import url from 'url';
let users = [];
let activeReq = 0;
const server = http.createServer((req, res)=>{
    const parsedUrl = new url(req.url, `http://${req.headers.host}`);
    console.log(`Request started: ${req.method} ${parsedUrl.pathname} (${new Date().toLocaleString()})`);
    activeReq++;
    console.log(`Active requests: ${activeReq}`);
    if(parsedUrl.pathname === '/users' && req.method === 'POST'){
        let user_data = '';
        req.on('data', (chunk)=>{
            user_data+=chunk.toString();
        });
        req.on('end', ()=>{
            let newUser = {};
            let user_object ;
            try {
                user_object = JSON.parse(user_data);
            } catch (error) {
                console.error('Error while parsing JSON:', error);
                res.writeHead(400, { 'Content-Type' : 'application/json' });
                return res.end(
                    JSON.stringify({error: 'Invalid JSON in request body'})
                );
            }
            const name = user_object.name;
            const age = parseInt(user_object.age, 10);
            if(!user_object.name || typeof user_object.name !== 'string' ){
                res.writeHead(400, { 'Content-Type' : 'application/json' })
                 return res.end(
                    JSON.stringify({error : 'Validation failed', details : 'name is not valid'})
                )
            }else if(user_object.name.trim().length === 0){
                res.writeHead(400, { 'Content-Type' : 'application/json' })
                 return res.end(
                    JSON.stringify({error : 'Validation failed', details : 'name field is blank'})
                )
            }else if( age == undefined || age === null){
                res.writeHead(400, { 'Content-Type' : 'application/json' })
                 return res.end(
                    JSON.stringify({error : 'Validation failed', details : 'age is not valid'})
                )
            }else if(isNaN(age)){
                res.writeHead(400, { 'Content-Type' : 'application/json' })
                 return res.end(
                    JSON.stringify({error : 'Validation failed', details : 'age is not valid'})
                )
            } else if(age < 0 || age > 150){
                res.writeHead(400, { 'Content-Type' : 'application/json' })
                 return res.end(
                    JSON.stringify({error : 'Validation failed', details : 'age field is either blank or the age given is unrealistic'})
                )
            }else{
                newUser = {
                name : name,
                age : age
                }
            }
            users.push(newUser);
            console.log('New User Added');
            console.log(`Response finishes at ${new Date().toLocaleTimeString()}`);
            res.writeHead(201, { 'Content-Type' : 'application/json' });
            res.end(JSON.stringify({ message: 'New User added', user: newUser }));
        });
    } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Not Found');
  }
  res.on('finish', ()=>{
    activeReq--;
    console.log(`📤 Response finished: ${activeReq} active requests remaining (${new Date().toLocaleTimeString()})`);
  })
})
