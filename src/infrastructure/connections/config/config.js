'use strict';

require('dotenv').config();

/**
 * Конфиг для sequelize-cli и для models/index.js.
 * Строка подключения собирается из отдельных переменных окружения,
 * а не хранится готовой строкой — совпадает с тем, что заполняет docker-compose.yml.
 */
function buildConfig() {
  return {
    username: process.env.DB_USER || 'wiki',
    password: process.env.DB_PASSWORD || 'wiki',
    database: process.env.DB_NAME || 'wiki_db',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
  };
}

module.exports = {
  development: buildConfig(),
  test: buildConfig(),
  production: {
    ...buildConfig(),
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
