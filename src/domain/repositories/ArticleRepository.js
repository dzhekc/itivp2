'use strict';

class ArticleRepository {
  async findAll(filters) {
    throw new Error('Не реализовано: findAll');
  }

  async findById(id) {
    throw new Error('Не реализовано: findById');
  }

  async create(article) {
    throw new Error('Не реализовано: create');
  }

  async update(article) {
    throw new Error('Не реализовано: update');
  }

  async delete(id) {
    throw new Error('Не реализовано: delete');
  }

  async reparentChildren(fromParentId, toParentId) {
    throw new Error('Не реализовано: reparentChildren');
  }

  async incrementViews(id) {
    throw new Error('Не реализовано: incrementViews');
  }
}

module.exports = { ArticleRepository };
