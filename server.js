'use strict';

const { ApplicationContainer } = require('./src/main/ApplicationContainer');

// Инициализация приложения через DI-контейнер
const container = new ApplicationContainer();
container.build();

const app = container.getApp();

// Порт сервера
const PORT = process.env.PORT || 3000;

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Articles API: http://localhost:${PORT}/articles`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };
