'use strict';

const { ChatMessage } = require('../../../domain/entities/ChatMessage');
const { toChatMessageResponse } = require('../../dto/chatMessageDto');
const { UnauthorizedError } = require('../../../domain/errors');

class PostChatMessage {
  constructor({ chatRepository, idGenerator }) {
    this.chatRepository = chatRepository;
    this.idGenerator = idGenerator;
  }

  async execute({ articleId, text, user } = {}) {
    if (!user?.id || !user?.email) {
      throw new UnauthorizedError('Войдите, чтобы отправлять сообщения');
    }

    const message = ChatMessage.create({
      id: this.idGenerator(),
      articleId,
      authorId: user.id,
      author: user.email,
      text,
    });

    const created = await this.chatRepository.create(message);
    return toChatMessageResponse(created);
  }
}

module.exports = { PostChatMessage };
