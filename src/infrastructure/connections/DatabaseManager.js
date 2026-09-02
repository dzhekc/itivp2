'use strict';

const db = require('./models');

class DatabaseManager {
  constructor() {
    this.sequelize = db.sequelize;
    this.models = db;
  }

  async connect() {
    await this.sequelize.authenticate();
  }

  async disconnect() {
    await this.sequelize.close();
  }

  getModel(name) {
    return this.models[name];
  }
}

module.exports = { DatabaseManager };
