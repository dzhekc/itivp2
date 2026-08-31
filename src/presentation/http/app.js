'use strict';

const express = require('express');
const { errorHandler } = require('./errorHandler');
const { notFoundHandler } = require('./middlewares/notFoundHandler');

/**
 * Создание и настройка Express-приложения.
 * Presentation layer - отвечает за HTTP-транспорт и маршрутизацию.
 */
function createApp({ articleRouter }) {
  const app = express();

  // Middleware для парсинга JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Подключение роутеров
  app.use('/articles', articleRouter);

  // Обработчик 404
  app.use(notFoundHandler);

  // Глобальный обработчик ошибок
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
