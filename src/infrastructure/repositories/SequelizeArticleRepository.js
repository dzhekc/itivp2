'use strict';

const { Op } = require('sequelize');
const { ArticleRepository } = require('../../domain/repositories/ArticleRepository');
const { Article } = require('../../domain/entities/Article');


class SequelizeArticleRepository extends ArticleRepository {
  constructor({ articleModel }) {
    super();
    this.articleModel = articleModel;
  }

  async findAll({ category, status, tag, search } = {}) {
    const where = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (tag) where.tags = { [Op.contains]: [String(tag).trim().toLowerCase()] };
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const rows = await this.articleModel.findAll({ where, order: [['createdAt', 'DESC']] });
    return rows.map(toDomain);
  }

  async findById(id) {
    const row = await this.articleModel.findByPk(id);
    return row ? toDomain(row) : null;
  }

  async create(article) {
    const row = await this.articleModel.create(toPersistence(article));
    return toDomain(row);
  }

  async update(article) {
    const [affected] = await this.articleModel.update(toPersistence(article), {
      where: { id: article.id },
    });
    if (affected === 0) {
      return null;
    }
    return this.findById(article.id);
  }

  async delete(id) {
    const affected = await this.articleModel.destroy({ where: { id } });
    return affected > 0;
  }
}

function toDomain(row) {
  const plain = row.get({ plain: true });
  return new Article({
    ...plain,
    createdAt: plain.createdAt.toISOString(),
    updatedAt: plain.updatedAt.toISOString(),
  });
}

function toPersistence(article) {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    author: article.author,
    tags: article.tags,
    status: article.status,
    viewsCount: article.viewsCount,
  };
}

module.exports = { SequelizeArticleRepository };
