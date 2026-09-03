'use strict';

const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');

class JwtTokenService {
  constructor({
    accessSecret = process.env.JWT_ACCESS_SECRET,
    refreshSecret = process.env.JWT_REFRESH_SECRET,
    accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } = {}) {
    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT_ACCESS_SECRET и JWT_REFRESH_SECRET обязательны');
    }
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn = accessExpiresIn;
    this.refreshExpiresIn = refreshExpiresIn;
  }

  signAccessToken(payload) {
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessExpiresIn });
  }

  signRefreshToken(payload) {
    return jwt.sign({ ...payload, jti: randomUUID() }, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    });
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.accessSecret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, this.refreshSecret);
  }
}

module.exports = { JwtTokenService };
