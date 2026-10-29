'use strict';

const { ValidationError } = require('../errors');

const MAX_TEXT_LENGTH = 2000;

class ChatMessage {
  constructor({ id, articleId, authorId, author, text, createdAt }) {
    this.id = id;
    this.articleId = articleId;
    this.authorId = authorId;
    this.author = author;
    this.text = text;
    this.createdAt = createdAt;
  }

  static create({ id, articleId, authorId, author, text }) {
    const data = ChatMessage.validate({ articleId, text, authorId, author });

    return new ChatMessage({
      id,
      articleId: data.articleId,
      authorId: data.authorId,
      author: data.author,
      text: data.text,
      createdAt: new Date().toISOString(),
    });
  }

  static validate({ articleId, text, authorId, author }) {
    const errors = [];

    if (typeof articleId !== 'string' || articleId.trim() === '') {
      errors.push({ field: 'articleId', message: 'обязателен' });
    }
    if (typeof authorId !== 'string' || authorId.trim() === '') {
      errors.push({ field: 'authorId', message: 'обязателен' });
    }
    if (typeof author !== 'string' || author.trim() === '') {
      errors.push({ field: 'author', message: 'обязателен' });
    }
    if (typeof text !== 'string' || text.trim() === '') {
      errors.push({ field: 'text', message: 'сообщение не должно быть пустым' });
    } else if (text.trim().length > MAX_TEXT_LENGTH) {
      errors.push({ field: 'text', message: `не длиннее ${MAX_TEXT_LENGTH} символов` });
    }

    if (errors.length > 0) {
      throw new ValidationError('Некорректное сообщение', errors);
    }

    return {
      articleId: articleId.trim(),
      authorId: authorId.trim(),
      author: author.trim(),
      text: text.trim(),
    };
  }
}

module.exports = { ChatMessage, CHAT_MAX_TEXT_LENGTH: MAX_TEXT_LENGTH };
