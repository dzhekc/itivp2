'use strict';

const db = require('./models');

/**
 * Обёртка над Sequelize-подключением: единая точка входа для остального
 * кода приложения, чтобы не тащить наружу детали models/index.js.
 */
class DatabaseManager {
  constructor() {
    this.sequelize = db.sequelize;
    this.models = db;
  }

  /** Проверить соединение с БД (падает, если Postgres недоступен). */
  async connect() {
    await this.sequelize.authenticate();
  }

  /** Закрыть пул соединений — вызывается при graceful shutdown. */
  async disconnect() {
    await this.sequelize.close();
  }

  /** @param {string} name например "Article" */
  getModel(name) {
    return this.models[name];
  }
}

module.exports = { DatabaseManager };
