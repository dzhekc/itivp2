'use strict';

const express = require('express');
const { errorHandler } = require('./errorHandler');
const { notFoundHandler } = require('./middlewares/notFoundHandler');


function createApp({ articleRouter }) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/articles', articleRouter);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
