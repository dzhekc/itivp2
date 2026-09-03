'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');

class AuthRouter {
  constructor({ registerUser, loginUser, refreshTokens, changePassword, getCurrentUser, authenticate }) {
    this.registerUser = registerUser;
    this.loginUser = loginUser;
    this.refreshTokens = refreshTokens;
    this.changePassword = changePassword;
    this.getCurrentUser = getCurrentUser;
    this.authenticate = authenticate;
  }

  getRouter() {
    const router = express.Router();

    router.post('/register', asyncHandler(async (req, res) => {
      const user = await this.registerUser.execute(req.body);
      res.status(201).json(user);
    }));

    router.post('/login', asyncHandler(async (req, res) => {
      const result = await this.loginUser.execute(req.body);
      res.json(result);
    }));

    router.post('/refresh', asyncHandler(async (req, res) => {
      const result = await this.refreshTokens.execute(req.body);
      res.json(result);
    }));

    router.post('/change-password', this.authenticate, asyncHandler(async (req, res) => {
      const result = await this.changePassword.execute({ userId: req.user.id, ...req.body });
      res.json(result);
    }));

    router.get('/me', this.authenticate, asyncHandler(async (req, res) => {
      const user = await this.getCurrentUser.execute(req.user.id);
      res.json(user);
    }));

    return router;
  }
}

module.exports = { AuthRouter };
