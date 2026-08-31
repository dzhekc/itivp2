'use strict';

/**
 * Обёртка для асинхронных обработчиков: ошибка из промиса
 * автоматически уезжает в next() и попадает в глобальный errorHandler.
 */
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
