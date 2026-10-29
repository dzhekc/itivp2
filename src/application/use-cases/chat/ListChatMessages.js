'use strict';

const { toChatMessageListResponse } = require('../../dto/chatMessageDto');
const { ValidationError } = require('../../../domain/errors');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

class ListChatMessages {
  constructor({ chatRepository }) {
    this.chatRepository = chatRepository;
  }

  async execute({ articleId, limit = DEFAULT_LIMIT } = {}) {
    if (typeof articleId !== 'string' || articleId.trim() === '') {
      throw new ValidationError('Некорректные параметры запроса', [
        { field: 'articleId', message: 'обязателен' },
      ]);
    }

    const size = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const messages = await this.chatRepository.findRecent(articleId.trim(), size);
    return toChatMessageListResponse(messages);
  }
}

module.exports = { ListChatMessages, DEFAULT_HISTORY_LIMIT: DEFAULT_LIMIT };
