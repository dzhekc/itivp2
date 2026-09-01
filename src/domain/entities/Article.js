'use strict';

const { ValidationError } = require('../errors');

const STATUSES = ['draft', 'published', 'archived'];

/**
 * Сущность «Статья корпоративной базы знаний».
 * Хранит данные и сама проверяет свои инварианты.
 */
class Article {
  constructor({ id, title, content, category, author, tags, status, viewsCount, createdAt, updatedAt }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.category = category;
    this.author = author;
    this.tags = tags;
    this.status = status;
    this.viewsCount = viewsCount ?? 0;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /** Создать новую статью. Счётчик просмотров всегда стартует с нуля. */
  static create({ id, title, content, category, author, tags, status }) {
    const data = Article.validate({ title, content, category, author, tags, status });
    const now = new Date().toISOString();

    return new Article({ id, ...data, viewsCount: 0, createdAt: now, updatedAt: now });
  }

  /** Полностью перезаписать статью (PUT). */
  update({ title, content, category, author, tags, status }) {
    const data = Article.validate({ title, content, category, author, tags, status });

    Object.assign(this, data, { updatedAt: new Date().toISOString() });
    return this;
  }

  /**
   * Проверка полей. Возвращает нормализованные данные
   * или бросает ValidationError со списком проблемных полей.
   */
  static validate({ title, content, category, author, tags, status }) {
    const errors = [];

    if (typeof title !== 'string' || title.trim().length < 3) {
      errors.push({ field: 'title', message: 'обязателен, минимум 3 символа' });
    }
    if (typeof content !== 'string' || content.trim().length < 10) {
      errors.push({ field: 'content', message: 'обязателен, минимум 10 символов' });
    }
    if (typeof category !== 'string' || category.trim() === '') {
      errors.push({ field: 'category', message: 'обязательна' });
    }
    if (typeof author !== 'string' || author.trim() === '') {
      errors.push({ field: 'author', message: 'обязателен' });
    }
    if (tags !== undefined && !Array.isArray(tags)) {
      errors.push({ field: 'tags', message: 'должен быть массивом строк' });
    }
    if (status !== undefined && !STATUSES.includes(status)) {
      errors.push({ field: 'status', message: `допустимые значения: ${STATUSES.join(', ')}` });
    }

    if (errors.length > 0) {
      throw new ValidationError('Некорректные данные статьи', errors);
    }

    return {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      author: author.trim(),
      tags: (tags || []).map((tag) => String(tag).trim().toLowerCase()),
      status: status || 'draft',
    };
  }
}

module.exports = { Article, ARTICLE_STATUSES: STATUSES };
