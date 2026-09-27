'use strict';

const { createHash } = require('node:crypto');
const articles = require('./data/wiki-articles.json');

/**
 * Лаба 5: статьи, которые в лабе 4 были моками на фронтенде.
 *
 * UUID вычисляется из ключа статьи (a1, a2, …), поэтому после повторного
 * сидирования ссылки вида /articles/<id> остаются теми же.
 */
function uuidFromKey(key) {
  const hex = createHash('sha1').update(`wiki-seed:${key}`).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

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
