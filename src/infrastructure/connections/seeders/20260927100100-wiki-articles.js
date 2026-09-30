'use strict';

const articles = require('./data/wiki-articles.json');
const { uuidFromKey } = require('./data/uuidFromKey');

/**
 * Лаба 5: статьи, которые в лабе 4 были моками на фронтенде.
 */

module.exports = {
  async up(queryInterface) {
    // Сидеры sequelize-cli не запоминают, что уже выполнялись, поэтому
    // db:seed:all при каждом запуске гоняет их все заново. Очищаем таблицу,
    // чтобы в базе был ровно тот набор статей, который показывал фронтенд
    // (в том числе без трёх статей из демо-сидера второй лабы).
    await queryInterface.bulkDelete('articles', null, {});

    // Родители в JSON идут раньше дочерних страниц, так что внешний ключ parentId не нарушается.
    await queryInterface.bulkInsert(
      'articles',
      articles.map(({ key, parentKey, createdAt, updatedAt, ...article }) => ({
        id: uuidFromKey(key),
        parentId: parentKey ? uuidFromKey(parentKey) : null,
        ...article,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('articles', { id: articles.map(({ key }) => uuidFromKey(key)) }, {});
  },
};
