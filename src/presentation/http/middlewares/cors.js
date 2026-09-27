'use strict';

/**
 * CORS для React-клиента (лаба 5): фронтенд на Vite живёт на другом порту.
 * Список разрешённых источников задаётся через CORS_ORIGIN (через запятую),
 * по умолчанию — адрес dev-сервера Vite.
 */
function createCors({ origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',') } = {}) {
  const allowed = new Set(origins.map((o) => o.trim()).filter(Boolean));

  return function cors(req, res, next) {
    const { origin } = req.headers;
    if (origin && (allowed.has('*') || allowed.has(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '600');
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return next();
  };
}

module.exports = { createCors };
