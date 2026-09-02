'use strict';

const { Article } = require('../../../domain/entities/Article');
const { toArticleResponse } = require('../../dto/articleDto');

/** Сценарий: создать новую статью. */
class CreateArticle {
  constructor({ articleRepository, idGenerator }) {
    this.articleRepository = articleRepository;
    this.idGenerator = idGenerator;
  }

  async execute(data) {
    const article = Article.create({ id: this.idGenerator(), ...data });
    const created = await this.articleRepository.create(article);

    return toArticleResponse(created);
  }
}

module.exports = { CreateArticle };
