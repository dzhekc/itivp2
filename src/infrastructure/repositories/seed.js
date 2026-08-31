'use strict';

/** Стартовые данные, чтобы API было чем отвечать сразу после запуска. */
const seedArticles = [
  {
    id: '1',
    title: 'Как оформить отпуск',
    content: 'Заявление подаётся в HR-портале не позднее чем за две недели до начала отпуска.',
    category: 'HR',
    author: 'Иванова А.',
    tags: ['отпуск', 'кадры'],
    status: 'published',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '2',
    title: 'Соглашение об именовании веток в Git',
    content: 'Ветки называем по схеме feature/JIRA-123-short-description, релизные — release/x.y.z.',
    category: 'Разработка',
    author: 'Петров С.',
    tags: ['git', 'стандарты'],
    status: 'published',
    createdAt: '2026-02-03T12:30:00.000Z',
    updatedAt: '2026-02-15T08:15:00.000Z',
  },
  {
    id: '3',
    title: 'Подключение к корпоративному VPN',
    content: 'Установите клиент, импортируйте профиль из письма службы поддержки и войдите по SSO.',
    category: 'IT-поддержка',
    author: 'Сидоров М.',
    tags: ['vpn', 'доступы'],
    status: 'draft',
    createdAt: '2026-03-01T15:45:00.000Z',
    updatedAt: '2026-03-01T15:45:00.000Z',
  },
];

module.exports = { seedArticles };
