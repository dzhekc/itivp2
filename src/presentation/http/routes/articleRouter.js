'use strict';

const express = require('express');
const { asyncHandler } = require('../middlewares/asyncHandler');

class ArticleRouter {
  constructor({ createArticle, getArticleById, listArticles, updateArticle, deleteArticle, authenticate }) {
    this.createArticle = createArticle;
    this.getArticleById = getArticleById;
    this.listArticles = listArticles;
    this.updateArticle = updateArticle;
    this.deleteArticle = deleteArticle;
    this.authenticate = authenticate;
  }

  getRouter() {
    const router = express.Router();

    // GET /articles
    router.get('/', asyncHandler(async (req, res) => {
      const filters = {};
      if (req.query.category) filters.category = req.query.category;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.tag) filters.tag = req.query.tag;
      if (req.query.search) filters.search = req.query.search;

      const articles = await this.listArticles.execute(filters);
      res.json(articles);
    }));

    // GET /articles/:id
    router.get('/:id', asyncHandler(async (req, res) => {
      const article = await this.getArticleById.execute(req.params.id);
      res.json(article);
    }));

    // POST /articles
    router.post('/', this.authenticate, asyncHandler(async (req, res) => {
      const dto = req.body;
      const article = await this.createArticle.execute(dto);
      res.status(201).json(article);
    }));

    // PUT /articles/:id
    router.put('/:id', this.authenticate, asyncHandler(async (req, res) => {
      const dto = { id: req.params.id, ...req.body };
      const article = await this.updateArticle.execute(dto);
      res.json(article);
    }));

    // DELETE /articles/:id
    router.delete('/:id', this.authenticate, asyncHandler(async (req, res) => {
      await this.deleteArticle.execute(req.params.id);
      res.status(204).send();
    }));

    return router;
  }
}

module.exports = { ArticleRouter };
