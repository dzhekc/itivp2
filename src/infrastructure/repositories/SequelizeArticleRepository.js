'use strict';

const { Op } = require('sequelize');
const { ArticleRepository } = require('../../domain/repositories/ArticleRepository');
const { Article } = require('../../domain/entities/Article');

// Колонка id имеет тип uuid: Postgres падает на приведении строки вроде "abc",
// поэтому такие id сразу считаем несуществующими (404 вместо 500).
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id);


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
      const term = String(search).trim();
      where[Op.or] = [
        { title: { [Op.iLike]: `%${term}%` } },
        { content: { [Op.iLike]: `%${term}%` } },
        { tags: { [Op.contains]: [term.toLowerCase()] } },
      ];
    }

    const rows = await this.articleModel.findAll({ where, order: [['createdAt', 'DESC']] });
    return rows.map(toDomain);
  }

  async findById(id) {
    if (!isUuid(id)) return null;
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
    if (!isUuid(id)) return false;
    const affected = await this.articleModel.destroy({ where: { id } });
    return affected > 0;
  }

  async reparentChildren(fromParentId, toParentId) {
    // silent: переезд в дереве не считается правкой содержимого, updatedAt не трогаем.
    await this.articleModel.update(
      { parentId: toParentId },
      { where: { parentId: fromParentId }, silent: true },
    );
  }

  async incrementViews(id) {
    if (!isUuid(id)) return null;
    // Атомарный UPDATE ... SET "viewsCount" = "viewsCount" + 1, без гонки при параллельных просмотрах.
    await this.articleModel.increment('viewsCount', { where: { id }, silent: true });
    const row = await this.articleModel.findByPk(id, { attributes: ['viewsCount'] });
    return row ? row.viewsCount : null;
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
    parentId: article.parentId,
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
