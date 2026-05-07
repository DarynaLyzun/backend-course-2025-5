const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const http = require('http');
const superagent = require('superagent');

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
      try 
      {
        const catRes = await superagent.get(`https://http.cat/${code}`);
        const imageBuffer = catRes.body;
        
        await fs.promises.writeFile(filePath, imageBuffer);
        
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(imageBuffer);
      } 
      catch (catError) 
      {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end("Not Found");
      }
    }
  }
  else if (req.method === 'PUT') 
  {
    const chunks = [];
    
    req.on('data', (chunk) => 
    {
      chunks.push(chunk);
    });

    req.on('end', async () => 
    {
      try 
      {
        const buffer = Buffer.concat(chunks);
        await fs.promises.writeFile(filePath, buffer);
        res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end("Created: Картинку збережено у кеш");
      } 
      catch (error) 
      {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end("Internal Server Error: Не вдалося зберегти файл");
      }
    });
  }
  else if (req.method === 'DELETE') 
  {
    try 
    {
      await fs.promises.unlink(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end("OK: Картинку видалено з кешу");
    } 
    catch (error) 
    {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end("Not Found: Файл для видалення не знайдено");
    }
  }
  else 
  {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("Method Not Allowed");
  }
});

server.listen(options.port, options.host, () => 
{
  console.log(`Server listening on http://${options.host}:${options.port}`);
});