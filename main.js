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

const server = http.createServer(async (req, res) => 
{
  const baseURL = `http://${options.host}:${options.port}`;
  const parsedUrl = new URL(req.url, baseURL);
  const code = parsedUrl.pathname.slice(1);

  const filePath = path.join(options.cache, `${code}.jpg`);

  if (!/^\d{3}$/.test(code)) 
  {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("Bad Request: Вкажіть валідний HTTP код у шляху");
    return;
  }

  if (req.method === 'GET') 
  {
    try 
    {
      const data = await fs.promises.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } 
    catch (error) 
    {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end("Not Found: Картинку не знайдено в кеші");
    }
  }
});

server.listen(options.port, options.host, () => 
{
  console.log(`Server listening on http://${options.host}:${options.port}`);
});