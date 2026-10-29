'use strict';

function toChatMessageResponse(message) {
  return {
    id: message.id,
    articleId: message.articleId,
    authorId: message.authorId,
    author: message.author,
    text: message.text,
    createdAt: message.createdAt,
  };
}

function toChatMessageListResponse(messages) {
  return messages.map(toChatMessageResponse);
}

module.exports = { toChatMessageResponse, toChatMessageListResponse };
