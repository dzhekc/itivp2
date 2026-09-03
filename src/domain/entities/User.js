'use strict';

const { ValidationError } = require('../errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class User {
  constructor({ id, email, passwordHash, refreshTokenHash, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.refreshTokenHash = refreshTokenHash ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static validateEmail(email) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new ValidationError('Некорректные данные пользователя', [
        { field: 'email', message: 'обязателен, должен быть валидным email' },
      ]);
    }
    return email.trim().toLowerCase();
  }

  static validatePassword(password) {
    if (typeof password !== 'string' || password.length < 6) {
      throw new ValidationError('Некорректные данные пользователя', [
        { field: 'password', message: 'обязателен, минимум 6 символов' },
      ]);
    }
    return password;
  }

  setRefreshTokenHash(refreshTokenHash) {
    this.refreshTokenHash = refreshTokenHash;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  setPasswordHash(passwordHash) {
    this.passwordHash = passwordHash;
    this.refreshTokenHash = null;
    this.updatedAt = new Date().toISOString();
    return this;
  }
}

module.exports = { User };
