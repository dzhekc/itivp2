// Разделы вики. Статьи приходят с сервера; раздел, которого нет в списке,
// всё равно появится в дереве (см. buildTree).
export const CATEGORIES = ['Разработка', 'Инфраструктура', 'Онбординг', 'Продукт'];

// Совпадают с ARTICLE_STATUSES в src/domain/entities/Article.js на бэкенде.
export const STATUSES = {
  draft: 'Черновик',
  published: 'Опубликовано',
  archived: 'В архиве',
};
