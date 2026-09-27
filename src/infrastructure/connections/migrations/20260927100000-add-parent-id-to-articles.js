'use strict';

// Лаба 5: иерархия страниц (дерево в сайдбаре фронтенда).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('articles', 'parentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'articles', key: 'id' },
      onUpdate: 'CASCADE',
      // Страховка на уровне БД; обычно дочерние страницы переносит DeleteArticle.
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('articles', ['parentId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('articles', ['parentId']);
    await queryInterface.removeColumn('articles', 'parentId');
  },
};
