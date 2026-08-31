'use strict';

const { randomUUID } = require('node:crypto');

/**
 * Генератор идентификаторов.
 * Вынесен в инфраструктуру, чтобы домен не зависел от способа генерации.
 */
function generateId() {
  return randomUUID();
}

module.exports = { generateId };
