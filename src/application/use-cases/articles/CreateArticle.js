'use strict';

const { Article } = require('../../../domain/entities/Article');
const { toArticleResponse } = require('../../dto/articleDto');
const { assertValidParent } = require('./assertValidParent');

class CreateArticle {
  constructor({ articleRepository, idGenerator }) {
    this.articleRepository = articleRepository;
    this.idGenerator = idGenerator;
  }

  async execute(data) {
    const article = Article.create({ id: this.idGenerator(), ...data });
    await assertValidParent(this.articleRepository, article.parentId);
    const created = await this.articleRepository.create(article);

    return toArticleResponse(created);
  }
}

module.exports = { CreateArticle };
