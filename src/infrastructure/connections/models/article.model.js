'use strict';

module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define(
    'Article',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      category: { type: DataTypes.STRING(100), allowNull: false },
      author: { type: DataTypes.STRING(100), allowNull: false },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      // Добавлено миграцией add-views-count-to-articles (лаба 2, часть 5).
      viewsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Добавлено миграцией add-parent-id-to-articles (лаба 5).
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'articles',
      timestamps: true,
    },
  );

  return Article;
};
