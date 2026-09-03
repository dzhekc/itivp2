'use strict';

class DomainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class ValidationError extends DomainError {
  constructor(message, fields = []) {
    super(message, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

class NotFoundError extends DomainError {
  constructor(resource, id) {
    super(`${resource} с id "${id}" не найден`, 'NOT_FOUND');
  }
}

class ConflictError extends DomainError {
  constructor(message) {
    super(message, 'CONFLICT');
  }
}

class UnauthorizedError extends DomainError {
  constructor(message) {
    super(message, 'UNAUTHORIZED');
  }
}

module.exports = { DomainError, ValidationError, NotFoundError, ConflictError, UnauthorizedError };
