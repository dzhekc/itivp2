'use strict';

const { toArticleListResponse } = require('../../dto/articleDto');

/** Сценарий: получить список статей (с необязательными фильтрами). */
class ListArticles {
  constructor({ articleRepository }) {
    this.articleRepository = articleRepository;
  }

  async execute(filters = {}) {
    const articles = await this.articleRepository.findAll(filters);
    return toArticleListResponse(articles);
  }
}

module.exports = { ListArticles };
