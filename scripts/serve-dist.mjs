import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const port = Number.parseInt(process.argv[2] ?? '4173', 10);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
  const cleanPath = decodeURIComponent(url.pathname);
  const filePath = resolveFile(cleanPath);

  if (filePath) {
    sendFile(response, filePath, 200);
    return;
  }

  const notFound = join(root, '404.html');
  sendFile(response, notFound, 404);
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving dist on http://127.0.0.1:${port}`);
});

function resolveFile(pathname) {
  const relative = normalize(pathname).replace(/^([/\\])+/, '');
  const candidate = resolve(root, relative);
  const safeRoot = `${root}${sep}`;

  if (candidate !== root && !candidate.startsWith(safeRoot)) {
    return null;
  }

  const candidates = [];

  if (pathname.endsWith('/')) {
    candidates.push(join(candidate, 'index.html'));
  } else {
    candidates.push(candidate, join(candidate, 'index.html'));
  }

  for (const path of candidates) {
    if (existsSync(path) && statSync(path).isFile()) {
      return path;
    }
  }

  return null;
}

function sendFile(response, path, status) {
  const extension = extname(path);
  response.writeHead(status, {
    'Content-Type': types[extension] ?? 'application/octet-stream'
  });
  createReadStream(path).pipe(response);
}
