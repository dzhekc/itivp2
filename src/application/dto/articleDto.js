'use strict';


function toArticleResponse(article) {
  return {
    id: article.id,
    parentId: article.parentId,
    title: article.title,
    content: article.content,
    category: article.category,
    author: article.author,
    tags: article.tags,
    status: article.status,
    viewsCount: article.viewsCount,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

function toArticleListResponse(articles) {
  return articles.map(toArticleResponse);
}

module.exports = { toArticleResponse, toArticleListResponse };
