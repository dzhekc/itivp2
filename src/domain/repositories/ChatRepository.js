'use strict';

class ChatRepository {
  async create(message) {
    throw new Error('Не реализовано: create');
  }

  // Последние `limit` сообщений статьи в хронологическом порядке.
  async findRecent(articleId, limit) {
    throw new Error('Не реализовано: findRecent');
  }
}

module.exports = { ChatRepository };
