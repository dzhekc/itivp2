// Простой статик-сервер для SPA-фронтенда (Лабораторная работа №8).
// Заменяет Nginx: отдаёт собранные файлы и делает fallback на index.html
// для клиентского роутинга (react-router). Только встроенные модули Node.
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.env.STATIC_DIR || '/app/dist';
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

function send(res, status, data, type) {
  res.writeHead(status, { 'Content-Type': type || 'application/octet-stream' });
  res.end(data);
}

function serveStatic(res, filePath) {
  fs.stat(filePath, (statErr, stat) => {
    if (!statErr && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        // Файла нет — отдаём index.html для SPA-роутинга
        fs.readFile(path.join(ROOT, 'index.html'), (spaErr, index) => {
          if (spaErr) return send(res, 404, 'Not Found', 'text/plain');
          send(res, 200, index, MIME['.html']);
        });
        return;
      }
      send(res, 200, data, MIME[path.extname(filePath)] || 'application/octet-stream');
    });
  });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));

  // Защита от выхода за пределы директории (path traversal)
  if (!filePath.startsWith(path.normalize(ROOT))) {
    return send(res, 403, 'Forbidden', 'text/plain');
  }

  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Static server: http://localhost:${PORT} serving ${ROOT}`);
});