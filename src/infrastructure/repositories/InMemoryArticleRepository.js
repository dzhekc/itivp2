'use strict';

const { ArticleRepository } = require('../../domain/repositories/ArticleRepository');
const { Article } = require('../../domain/entities/Article');
const { seedArticles } = require('./seed');

/**
 * Реализация порта ArticleRepository поверх обычного массива в памяти.
 * Данные живут, пока запущен процесс, — на следующем этапе курсового
 * этот класс заменяется на репозиторий поверх БД, остальной код не меняется.
 */
class InMemoryArticleRepository extends ArticleRepository {
  constructor(initialData = seedArticles) {
    super();
    /** @type {Article[]} */
    this.items = initialData.map((raw) => new Article(raw));
  }

  async findAll({ category, status, tag, search } = {}) {
    let result = [...this.items];

    if (category) {
      result = result.filter((a) => a.category.toLowerCase() === String(category).toLowerCase());
    }
    if (status) {
      result = result.filter((a) => a.status === status);
    }
    if (tag) {
      result = result.filter((a) => a.tags.includes(String(tag).toLowerCase()));
    }
    if (search) {
      const query = String(search).toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query),
      );
    }

    return result;
  }

  async findById(id) {
    return this.items.find((a) => a.id === id) || null;
  }

  async create(article) {
    this.items.push(article);
    return article;
  }

  async update(article) {
    const index = this.items.findIndex((a) => a.id === article.id);
    if (index === -1) {
      return null;
    }

    this.items[index] = article;
    return article;
  }

  async delete(id) {
    const index = this.items.findIndex((a) => a.id === id);
    if (index === -1) {
      return false;
    }

    this.items.splice(index, 1);
    return true;
  }
}

module.exports = { InMemoryArticleRepository };
