'use strict';

const { randomUUID } = require('node:crypto');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('articles', [
      {
        id: randomUUID(),
        title: 'Как оформить отпуск',
        content:
          'Заявление подаётся в HR-портале не позднее чем за две недели до начала отпуска.',
        category: 'HR',
        author: 'Иванова А.',
        tags: ['отпуск', 'кадры'],
        status: 'published',
        viewsCount: 42,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: 'Соглашение об именовании веток в Git',
        content:
          'Ветки называем по схеме feature/JIRA-123-short-description, релизные — release/x.y.z.',
        category: 'Разработка',
        author: 'Петров С.',
        tags: ['git', 'стандарты'],
        status: 'published',
        viewsCount: 128,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: 'Подключение к корпоративному VPN',
        content:
          'Установите клиент, импортируйте профиль из письма службы поддержки и войдите по SSO.',
        category: 'IT-поддержка',
        author: 'Сидоров М.',
        tags: ['vpn', 'доступы'],
        status: 'draft',
        viewsCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('articles', null, {});
  },
};
