'use strict';

const express = require('express');
const { errorHandler } = require('./errorHandler');
const { notFoundHandler } = require('./middlewares/notFoundHandler');
const { asyncHandler } = require('./middlewares/asyncHandler');


function createApp({ articleRouter, authRouter, authenticate, getCurrentUser }) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRouter);

  app.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const user = await getCurrentUser.execute(req.user.id);
    res.json(user);
  }));

  app.use('/articles', articleRouter);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
