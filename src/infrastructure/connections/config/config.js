'use strict';

require('dotenv').config();


function buildConfig() {
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
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
