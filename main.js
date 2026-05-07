const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const http = require('http');

program
    .requiredOption("-h, --host <address>")
    .requiredOption("-p, --port <number>")
    .requiredOption("-c, --cache <directory>");

program.parse();
const options = program.opts();

const cachePath = path.join(__dirname, options.cache);

if (!fs.existsSync(cachePath)) 
{
    fs.mkdirSync(cachePath, { recursive: true });
}

const server = http.createServer((req, res) => 
{
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running\n');
});

server.listen(options.port, options.host, () => 
{
  console.log(`Server listening on http://${options.host}:${options.port}`);
});