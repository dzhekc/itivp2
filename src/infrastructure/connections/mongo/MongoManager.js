'use strict';

const { MongoClient } = require('mongodb');

function buildClientConfig() {
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || 27017;

  return {
    url: process.env.MONGO_URL || `mongodb://${host}:${port}`,
    options: {
      serverSelectionTimeoutMS: 5000,
      auth: {
        username: process.env.MONGO_USER || 'wiki',
        password: process.env.MONGO_PASSWORD || 'wiki',
      },
      authSource: 'admin',
    },
  };
}

class MongoManager {
  constructor({ dbName = process.env.MONGO_DB || 'wiki_db' } = {}) {
    const { url, options } = buildClientConfig();
    this.client = new MongoClient(url, options);
    this.dbName = dbName;
    this.db = null;
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    await this.ensureIndexes();
  }

  async ensureIndexes() {
    await this.getCollection('articles').createIndexes([
      { key: { parentId: 1 } },
      { key: { category: 1 } },
      { key: { tags: 1 } },
      { key: { createdAt: -1 } },
    ]);
  }

  async disconnect() {
    await this.client.close();
  }

  getCollection(name) {
    return this.db.collection(name);
  }
}

module.exports = { MongoManager };
