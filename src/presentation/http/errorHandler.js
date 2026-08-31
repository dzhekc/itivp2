'use strict';

const { DomainError, ValidationError, NotFoundError } = require('../../domain/errors');

/**
 * Глобальный обработчик ошибок Express.
 * Преобразует доменные ошибки в HTTP-ответы с соответствующими статусами.
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Доменная ошибка валидации → 400
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields,
      },
    });
  }

  // Сущность не найдена → 404
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Другие доменные ошибки → 400
  if (err instanceof DomainError) {
    return res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Неожиданная ошибка → 500
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера',
    },
  });
}

module.exports = { errorHandler };
