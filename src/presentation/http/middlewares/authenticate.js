'use strict';

const { UnauthorizedError } = require('../../../domain/errors');

function createAuthenticate({ tokenService }) {
  return function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Отсутствует или некорректный заголовок Authorization'));
    }

    try {
      const payload = tokenService.verifyAccessToken(token);
      req.user = { id: payload.id, email: payload.email };
      return next();
    } catch (err) {
      return next(new UnauthorizedError('Невалидный или просроченный access-токен'));
    }
  };
}

module.exports = { createAuthenticate };
