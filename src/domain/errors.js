'use strict';

/** Базовая доменная ошибка. Домен не знает про HTTP — только про смысл ошибки. */
class DomainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/** Некорректные входные данные → 400. */
class ValidationError extends DomainError {
  constructor(message, fields = []) {
    super(message, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

/** Сущность не найдена → 404. */
class NotFoundError extends DomainError {
  constructor(resource, id) {
    super(`${resource} с id "${id}" не найден`, 'NOT_FOUND');
  }
}

module.exports = { DomainError, ValidationError, NotFoundError };
