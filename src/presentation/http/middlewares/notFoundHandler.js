'use strict';

function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Маршрут ${req.method} ${req.originalUrl} не найден`,
    },
  });
}

module.exports = { notFoundHandler };
