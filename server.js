'use strict';

require('dotenv').config();

const { ApplicationContainer } = require('./src/main/ApplicationContainer');

async function main() {
  // Инициализация приложения через DI-контейнер (подключается к Postgres внутри)
  const container = new ApplicationContainer();
  await container.build();

  const app = container.getApp();

  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Articles API: http://localhost:${PORT}/articles`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await container.close();
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
