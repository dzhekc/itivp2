'use strict';

const { DatabaseManager } = require('../infrastructure/connections/DatabaseManager');
const { SequelizeArticleRepository } = require('../infrastructure/repositories/SequelizeArticleRepository');
const { SequelizeUserRepository } = require('../infrastructure/repositories/SequelizeUserRepository');
const { BcryptPasswordHasher } = require('../infrastructure/security/BcryptPasswordHasher');
const { JwtTokenService } = require('../infrastructure/security/JwtTokenService');
const { Sha256TokenHasher } = require('../infrastructure/security/Sha256TokenHasher');
const { generateId } = require('../infrastructure/id/idGenerator');

const { CreateArticle } = require('../application/use-cases/articles/CreateArticle');
const { GetArticleById } = require('../application/use-cases/articles/GetArticleById');
const { ListArticles } = require('../application/use-cases/articles/ListArticles');
const { UpdateArticle } = require('../application/use-cases/articles/UpdateArticle');
const { DeleteArticle } = require('../application/use-cases/articles/DeleteArticle');
const { RegisterArticleView } = require('../application/use-cases/articles/RegisterArticleView');

const { RegisterUser } = require('../application/use-cases/auth/RegisterUser');
const { LoginUser } = require('../application/use-cases/auth/LoginUser');
const { RefreshTokens } = require('../application/use-cases/auth/RefreshTokens');
const { ChangePassword } = require('../application/use-cases/auth/ChangePassword');
const { GetCurrentUser } = require('../application/use-cases/auth/GetCurrentUser');

const { ArticleRouter } = require('../presentation/http/routes/articleRouter');
const { AuthRouter } = require('../presentation/http/routes/authRouter');
const { createAuthenticate } = require('../presentation/http/middlewares/authenticate');
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
    this._repositories.userRepository = new SequelizeUserRepository({
      userModel: this._services.databaseManager.getModel('User'),
    });

    this._services.idGenerator = generateId;
    this._services.passwordHasher = new BcryptPasswordHasher();
    this._services.tokenService = new JwtTokenService();
    this._services.tokenHasher = new Sha256TokenHasher();

    return this;
  }

  initUseCases() {
    const { articleRepository, userRepository } = this._repositories;
    const { idGenerator, passwordHasher, tokenService, tokenHasher } = this._services;

    this._useCases.createArticle = new CreateArticle({ articleRepository, idGenerator });
    this._useCases.getArticleById = new GetArticleById({ articleRepository });
    this._useCases.listArticles = new ListArticles({ articleRepository });
    this._useCases.updateArticle = new UpdateArticle({ articleRepository });
    this._useCases.deleteArticle = new DeleteArticle({ articleRepository });
    this._useCases.registerArticleView = new RegisterArticleView({ articleRepository });

    this._useCases.registerUser = new RegisterUser({ userRepository, passwordHasher, idGenerator });
    this._useCases.loginUser = new LoginUser({ userRepository, passwordHasher, tokenService, tokenHasher });
    this._useCases.refreshTokens = new RefreshTokens({ userRepository, tokenService, tokenHasher });
    this._useCases.changePassword = new ChangePassword({ userRepository, passwordHasher });
    this._useCases.getCurrentUser = new GetCurrentUser({ userRepository });

    return this;
  }

  initPresentation() {
    const {
      createArticle,
      getArticleById,
      listArticles,
      updateArticle,
      deleteArticle,
      registerArticleView,
      registerUser,
      loginUser,
      refreshTokens,
      changePassword,
      getCurrentUser,
    } = this._useCases;

    const authenticate = createAuthenticate({ tokenService: this._services.tokenService });
    this._services.authenticate = authenticate;

    this._routers.articleRouter = new ArticleRouter({
      createArticle,
      getArticleById,
      listArticles,
      updateArticle,
      deleteArticle,
      registerArticleView,
      authenticate,
    }).getRouter();

    this._routers.authRouter = new AuthRouter({
      registerUser,
      loginUser,
      refreshTokens,
      changePassword,
      getCurrentUser,
      authenticate,
    }).getRouter();

    return this;
  }

  createApp() {
    const { articleRouter, authRouter } = this._routers;
    const { authenticate } = this._services;
    const { getCurrentUser } = this._useCases;
    this._app = createApp({ articleRouter, authRouter, authenticate, getCurrentUser });
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
