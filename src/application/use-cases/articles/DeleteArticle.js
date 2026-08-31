'use strict';

const { NotFoundError } = require('../../../domain/errors');

/** Сценарий: удалить статью. */
class DeleteArticle {
  constructor({ articleRepository }) {
    this.articleRepository = articleRepository;
  }

  async execute(id) {
    const deleted = await this.articleRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Статья', id);
    }
  }
}

module.exports = { DeleteArticle };
