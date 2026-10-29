'use strict';

require('dotenv').config();

const http = require('node:http');
const { ApplicationContainer } = require('./src/main/ApplicationContainer');

async function main() {
  // Инициализация приложения через DI-контейнер (подключается к Postgres и MongoDB внутри)
  const container = new ApplicationContainer();
  await container.build();

  const app = container.getApp();
  const server = http.createServer(app);

  // Лаба 7: Socket.IO на том же порту, что и REST API.
  container.attachRealtime(server);

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Articles API: http://localhost:${PORT}/articles`);
    console.log(`Socket.IO: ws://localhost:${PORT}/socket.io`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    // io.close() закрывает и HTTP-сервер, поэтому отдельный server.close() не нужен.
    Promise.resolve(container.close()).then(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Не удалось запустить сервер:', err);
  process.exit(1);
});
