'use strict';

const { NotFoundError } = require('../../../domain/errors');
const { toArticleResponse } = require('../../dto/articleDto');

/** Сценарий: полностью обновить статью (PUT). */
class UpdateArticle {
  constructor({ articleRepository }) {
    this.articleRepository = articleRepository;
  }

  async execute(data) {
    const { id, ...updateData } = data;
    const article = await this.articleRepository.findById(id);
    if (!article) {
      throw new NotFoundError('Статья', id);
    }

    article.update(updateData);
    const updated = await this.articleRepository.update(article);

    return toArticleResponse(updated);
  }
}

module.exports = { UpdateArticle };
