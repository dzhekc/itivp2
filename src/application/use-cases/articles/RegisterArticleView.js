'use strict';

const { NotFoundError } = require('../../../domain/errors');

class RegisterArticleView {
  constructor({ articleRepository }) {
    this.articleRepository = articleRepository;
  }

  async execute(id) {
    const viewsCount = await this.articleRepository.incrementViews(id);
    if (viewsCount === null) {
      throw new NotFoundError('Статья', id);
    }

    return { id, viewsCount };
  }
}

module.exports = { RegisterArticleView };
