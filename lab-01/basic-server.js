const http = require('http');

const PORT = 3000;

// Create the basic HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Hello');
});

// Start listening on port 3000
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
});

