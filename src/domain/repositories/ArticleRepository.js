'use strict';

/**
 * Порт (интерфейс) хранилища статей.
 *
 * Домен говорит, что ему нужно от хранилища, но не знает, как оно устроено.
 * Реализация лежит в слое инфраструктуры: сейчас массив в памяти,
 * позже — БД, при этом домен и application-слой не изменятся.
 *
 * @interface
 */
class ArticleRepository {
  /** @returns {Promise<import('../entities/Article').Article[]>} */
  async findAll(filters) {
    throw new Error('Не реализовано: findAll');
  }

  /** @returns {Promise<import('../entities/Article').Article|null>} */
  async findById(id) {
    throw new Error('Не реализовано: findById');
  }

  /** @returns {Promise<import('../entities/Article').Article>} */
  async create(article) {
    throw new Error('Не реализовано: create');
  }

  /** @returns {Promise<import('../entities/Article').Article>} */
  async update(article) {
    throw new Error('Не реализовано: update');
  }

  /** @returns {Promise<boolean>} */
  async delete(id) {
    throw new Error('Не реализовано: delete');
  }
}

module.exports = { ArticleRepository };
