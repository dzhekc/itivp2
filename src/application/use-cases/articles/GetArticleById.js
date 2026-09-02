'use strict';

const { NotFoundError } = require('../../../domain/errors');
const { toArticleResponse } = require('../../dto/articleDto');

class GetArticleById {
  constructor({ articleRepository }) {
    this.articleRepository = articleRepository;
  }

  async execute(id) {
    const article = await this.articleRepository.findById(id);
    if (!article) {
      throw new NotFoundError('Статья', id);
    }

    return toArticleResponse(article);
  }
}

module.exports = { GetArticleById };
