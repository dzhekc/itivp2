'use strict';

/**
 * Лаба 6: заливает в MongoDB тот же набор статей, что сидер Postgres
 * (seeders/data/wiki-articles.json). Коллекция очищается перед вставкой.
 *
 *   npm run mongo:seed
 */

require('dotenv').config();

const { MongoManager } = require('./MongoManager');
const articles = require('../seeders/data/wiki-articles.json');
const { uuidFromKey } = require('../seeders/data/uuidFromKey');

async function seed() {
  const mongo = new MongoManager();
  await mongo.connect();

  try {
    const collection = mongo.getCollection('articles');
    await collection.deleteMany({});

    const docs = articles.map(({ key, parentKey, createdAt, updatedAt, ...article }) => ({
      _id: uuidFromKey(key),
      parentId: parentKey ? uuidFromKey(parentKey) : null,
      ...article,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    }));
    await collection.insertMany(docs);

    console.log(`MongoDB: добавлено статей — ${docs.length}`);
  } finally {
    await mongo.disconnect();
  }
}

seed().catch((err) => {
  console.error('Не удалось заполнить MongoDB:', err);
  process.exit(1);
});
