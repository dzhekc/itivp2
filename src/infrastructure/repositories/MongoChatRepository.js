'use strict';

const { ChatRepository } = require('../../domain/repositories/ChatRepository');
const { ChatMessage } = require('../../domain/entities/ChatMessage');

class MongoChatRepository extends ChatRepository {
  constructor({ collection }) {
    super();
    this.collection = collection;
  }

  async create(message) {
    const doc = toPersistence(message);
    await this.collection.insertOne(doc);
    return toDomain(doc);
  }

  async findRecent(articleId, limit) {
    const docs = await this.collection
      .find({ articleId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.reverse().map(toDomain);
  }
}

function toDomain(doc) {
  return new ChatMessage({
    id: doc._id,
    articleId: doc.articleId,
    authorId: doc.authorId,
    author: doc.author,
    text: doc.text,
    createdAt: new Date(doc.createdAt).toISOString(),
  });
}

function toPersistence(message) {
  return {
    _id: message.id,
    articleId: message.articleId,
    authorId: message.authorId,
    author: message.author,
    text: message.text,
    createdAt: new Date(message.createdAt),
  };
}

module.exports = { MongoChatRepository };
