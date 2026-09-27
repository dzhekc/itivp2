'use strict';

const { randomUUID } = require('node:crypto');
const bcrypt = require('bcrypt');

// Демо-пользователь для входа во фронтенд (лаба 5): создание, правка и удаление статей требуют JWT.
const DEMO_EMAIL = 'demo@wiki.local';
const DEMO_PASSWORD = 'demo123';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkDelete('users', { email: DEMO_EMAIL }, {});
    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        email: DEMO_EMAIL,
        passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
        refreshTokenHash: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: DEMO_EMAIL }, {});
  },
};
