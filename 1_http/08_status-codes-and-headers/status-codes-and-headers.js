import http from 'http';
const server = http.createServer((req, res) => {
  console.log(`\n Request: ${req.method} ${req.url}`);
  // ROUTE 1: GET / - Success (200) 
  if (req.url === '/' && req.method === 'GET') {
    console.log(' Route found: GET /');
    
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'X-Demo': 'This is a custom header'
    });
    
    res.end(`
      <h1>Welcome to Exercise 7</h1>
      <p>Status Code: <strong>200 OK</strong></p>
      <p>Content-Type: <strong>text/html</strong></p>
      <p>This means: Browser RENDERS this HTML ✅</p>
      
      <hr>
      
      <h2>Try These Routes:</h2>
      <ul>
        <li><a href="/api/user">GET /api/user</a> - Returns JSON (200 OK)</li>
        <li><a href="/bad">GET /bad</a> - Bad request (400)</li>
        <li><a href="/notfound">GET /notfound</a> - Not found (404)</li>
      </ul>
    `);
  }
  // ROUTE 2: GET /api/user - JSON Response (200)
  else if (req.url === '/api/user' && req.method === 'GET') {
    console.log('✅ Route found: GET /api/user');
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'X-Data-Type': 'user-profile',
      'X-User-ID': '123'
    });
    
    res.end(JSON.stringify({
      id: 123,
      name: 'Dikshant',
      age: 21,
      status: 'success',
      message: 'Status 200 means request succeeded ✅'
    }, null, 2));
  }
  // ROUTE 3: GET /bad - Bad Request (400)
  else if (req.url === '/bad' && req.method === 'GET') {
    console.log(' Bad request: GET /bad');
    
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'X-Error-Code': 'INVALID_INPUT',
      'X-Error-Severity': 'LOW'
    });
    
    res.end(JSON.stringify({
      status: 'error',
      code: 400,
      message: 'Bad Request',
      reason: 'Status 400 means CLIENT sent bad data',
      example: 'Missing required fields, invalid format, etc.'
    }, null, 2));
  }
  //  ROUTE 4: GET /notfound - Not Found (404)
  else if (req.url === '/notfound' && req.method === 'GET') {
    console.log(' Not found: GET /notfound');
    
    res.writeHead(404, { 
      'Content-Type': 'application/json',
      'X-Error-Code': 'ROUTE_NOT_FOUND'
    });
    
    res.end(JSON.stringify({
      status: 'error',
      code: 404,
      message: 'Not Found',
      reason: 'Status 404 means this ROUTE DOES NOT EXIST',
      availableRoutes: [
        'GET /',
        'GET /api/user',
        'GET /bad',
        'GET /notfound'
      ]
    }, null, 2));
  }
  //  DEMO: Missing Content-Type
  else if (req.url === '/missing-header' && req.method === 'GET') {
    console.log('  Missing Content-Type: GET /missing-header');
    
    res.writeHead(200, { 
      'X-Demo': 'Notice no Content-Type header!'
    });
    
    res.end('<h1>This is HTML but...</h1><p>Without Content-Type, browser might NOT render it!</p>');
  }
  //  DEFAULT: Unknown route (404)
  else {
    console.log('Unknown route: ' + req.url);
    
    res.writeHead(404, { 
      'Content-Type': 'application/json',
      'X-Error-Code': 'UNKNOWN_ROUTE'
    });
    
    res.end(JSON.stringify({
      status: 'error',
      code: 404,
      message: 'Route not found',
      requested: req.url,
      availableRoutes: [
        'GET /',
        'GET /api/user',
        'GET /bad',
        'GET /notfound',
        'GET /missing-header'
      ]
    }, null, 2));
  }
});
server.listen(3000, 'localhost', () => {
  console.log('Server running at http://localhost:3000\n');
  console.log('=== Status Code & Header Demo ===');
  console.log('✅ 200 OK:');
  console.log('http://localhost:3000/');
  
  console.log('❌ 400 Bad Request:');
  console.log('http://localhost:3000/bad\n');
  
  console.log('❌ 404 Not Found:');
  console.log('http://localhost:3000/notfound\n');
  
  console.log('⚠️ Missing Content-Type (to see the difference):');
  console.log('http://localhost:3000/missing-header\n');
});