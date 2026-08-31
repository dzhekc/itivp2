'use strict';

/**
 * Преобразование доменной сущности в ответ API.
 * Слой application решает, какие поля показывать наружу.
 */
function toArticleResponse(article) {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    author: article.author,
    tags: article.tags,
    status: article.status,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

function toArticleListResponse(articles) {
  return articles.map(toArticleResponse);
}

module.exports = { toArticleResponse, toArticleListResponse };
