'use strict';

const { ValidationError } = require('../../../domain/errors');

function invalid(message) {
  return new ValidationError('Некорректные данные статьи', [{ field: 'parentId', message }]);
}

/**
 * Родитель должен существовать и не может быть самой статьёй или её потомком,
 * иначе в дереве страниц появится цикл.
 */
async function assertValidParent(articleRepository, parentId, articleId = null) {
  if (!parentId) return;

  let current = await articleRepository.findById(parentId);
  if (!current) {
    throw invalid('родительская статья не найдена');
  }

  const seen = new Set();
  while (current) {
    if (current.id === articleId) {
      throw invalid('статью нельзя вложить в саму себя или в свою дочернюю страницу');
    }
    if (!current.parentId || seen.has(current.parentId)) break;
    seen.add(current.parentId);
    current = await articleRepository.findById(current.parentId);
  }
}

module.exports = { assertValidParent };
