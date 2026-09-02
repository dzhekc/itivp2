'use strict';

const { DatabaseManager } = require('../infrastructure/connections/DatabaseManager');
const { SequelizeArticleRepository } = require('../infrastructure/repositories/SequelizeArticleRepository');
const { generateId } = require('../infrastructure/id/idGenerator');

const { CreateArticle } = require('../application/use-cases/articles/CreateArticle');
const { GetArticleById } = require('../application/use-cases/articles/GetArticleById');
const { ListArticles } = require('../application/use-cases/articles/ListArticles');
const { UpdateArticle } = require('../application/use-cases/articles/UpdateArticle');
const { DeleteArticle } = require('../application/use-cases/articles/DeleteArticle');

const { ArticleRouter } = require('../presentation/http/routes/articleRouter');
const { createApp } = require('../presentation/http/app');

class ApplicationContainer {
  constructor() {
    this._repositories = {};
    this._services = {};
    this._useCases = {};
    this._routers = {};
    this._app = null;
  }

  async initInfrastructure() {
    this._services.databaseManager = new DatabaseManager();
    await this._services.databaseManager.connect();

    this._repositories.articleRepository = new SequelizeArticleRepository({
      articleModel: this._services.databaseManager.getModel('Article'),
    });

    this._services.idGenerator = generateId;

    return this;
  }

  initUseCases() {
    const { articleRepository } = this._repositories;
    const { idGenerator } = this._services;

    this._useCases.createArticle = new CreateArticle({ articleRepository, idGenerator });
    this._useCases.getArticleById = new GetArticleById({ articleRepository });
    this._useCases.listArticles = new ListArticles({ articleRepository });
    this._useCases.updateArticle = new UpdateArticle({ articleRepository });
    this._useCases.deleteArticle = new DeleteArticle({ articleRepository });

    return this;
  }

  initPresentation() {
    const { createArticle, getArticleById, listArticles, updateArticle, deleteArticle } =
      this._useCases;

    this._routers.articleRouter = new ArticleRouter({
      createArticle,
      getArticleById,
      listArticles,
      updateArticle,
      deleteArticle,
    }).getRouter();

    return this;
  }

  createApp() {
    const { articleRouter } = this._routers;
    this._app = createApp({ articleRouter });
    return this;
  }

  getApp() {
    if (!this._app) {
      throw new Error('Приложение не инициализировано. Вызовите build().');
    }
    return this._app;
  }

  async build() {
    await this.initInfrastructure();
    this.initUseCases();
    this.initPresentation();
    this.createApp();
    return this;
  }

  async close() {
    await this._services.databaseManager?.disconnect();
  }
}

module.exports = { ApplicationContainer };
