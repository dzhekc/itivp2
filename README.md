# Корпоративная база знаний (Wiki) — REST API

Express.js API для статей корпоративной вики. Данные хранятся в PostgreSQL
через Sequelize. Код собран по чистой архитектуре:

```
src/
  domain/           сущности, доменные ошибки, интерфейс репозитория
  application/      use-case'ы, DTO
  infrastructure/    Sequelize-подключение, модели, миграции, сиды, репозиторий
  presentation/      Express: роутеры, middleware, error handler
  main/               ApplicationContainer — DI-контейнер, собирает всё вместе
```

## Требования

- Node.js 18+
- Docker (для локального PostgreSQL)

## Установка

```bash
npm install
cp .env.example .env   # при необходимости поменять значения
```

Переменные окружения (`.env`):

| Переменная               | Назначение                              |
|--------------------------|------------------------------------------|
| `PORT`                   | порт, на котором слушает Express          |
| `DB_HOST`                | хост PostgreSQL                           |
| `DB_PORT`                | порт PostgreSQL                           |
| `DB_USER`                | пользователь БД                           |
| `DB_PASSWORD`            | пароль пользователя БД                    |
| `DB_NAME`                | имя базы данных                           |
| `JWT_ACCESS_SECRET`      | секрет для подписи access-токенов         |
| `JWT_REFRESH_SECRET`     | секрет для подписи refresh-токенов        |
| `JWT_ACCESS_EXPIRES_IN`  | срок жизни access-токена (по умолчанию 1h)|
| `JWT_REFRESH_EXPIRES_IN` | срок жизни refresh-токена (по умолчанию 7d)|

## База данных

Поднять PostgreSQL в Docker:

```bash
npm run docker:db:up      # docker compose up -d postgres
npm run docker:db:down    # остановить и удалить контейнер
```

Применить миграции и наполнить демо-данными:

```bash
npm run db:migrate        # создать таблицы articles, users + колонку viewsCount
npm run db:seed           # добавить 3 демо-статьи
```

Откатить (при необходимости):

```bash
npm run db:seed:undo
npm run db:migrate:undo
```

Миграции и модели лежат в `src/infrastructure/connections/` (пути настроены
в `.sequelizerc`), поэтому команды `sequelize-cli` можно вызывать и напрямую:

```bash
npx sequelize-cli db:migrate:status
npx sequelize-cli migration:generate --name some-change
npx sequelize-cli seed:generate --name some-seed
```

## Запуск приложения

```bash
npm run dev     # nodemon, автоперезапуск
npm start       # обычный запуск
```

При старте приложение подключается к PostgreSQL (см. `DatabaseManager`),
если БД недоступна — сервер не запустится и выведет ошибку в консоль.

- Health-check: `GET http://localhost:3000/health`
- API статей: `http://localhost:3000/articles`

## Аутентификация

Регистрация, вход и обновление токенов — `/auth/*`. Доступ выдаётся парой
JWT: короткоживущий `accessToken` (по умолчанию 1 час) и `refreshToken`
(по умолчанию 7 дней), которым можно получить новую пару без повторного
ввода пароля. Защищённые маршруты требуют заголовок
`Authorization: Bearer <accessToken>`.

### Регистрация

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "supersecret"}'
```

### Вход

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "supersecret"}'
```

Ответ содержит `accessToken`, `refreshToken` и данные пользователя.

### Обновление токенов

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'
```

Refresh-токен одноразовый: при каждом обновлении выдаётся новая пара,
старый refresh-токен перестаёт работать.

### Смена пароля (требует access-токен)

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"oldPassword": "supersecret", "newPassword": "evenmoresecret"}'
```

После смены пароля все выданные ранее refresh-токены становятся недействительны.

### Текущий пользователь

```bash
curl http://localhost:3000/auth/me -H "Authorization: Bearer <accessToken>"
curl http://localhost:3000/profile -H "Authorization: Bearer <accessToken>"
```

## API

Ресурс — `articles`. Поля: `title`, `content`, `category`, `author`, `tags`
(массив строк), `status` (`draft` | `published` | `archived`), `viewsCount`
(только для чтения, выставляется автоматически).

Создание, изменение и удаление статей защищены — нужен заголовок
`Authorization: Bearer <accessToken>`. Чтение (`GET`) доступно без авторизации.

### Список статей

```bash
curl http://localhost:3000/articles
```

Фильтры через query-параметры:

```bash
curl "http://localhost:3000/articles?category=HR"
curl "http://localhost:3000/articles?status=published"
curl "http://localhost:3000/articles?tag=git"
curl "http://localhost:3000/articles?search=vpn"
```

### Одна статья по id

```bash
curl http://localhost:3000/articles/<id>
```

### Создать статью

```bash
curl -X POST http://localhost:3000/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "title": "Как получить доступ к Confluence",
    "content": "Доступ выдаётся автоматически при выходе на работу через SSO.",
    "category": "IT-поддержка",
    "author": "Смирнова Е.",
    "tags": ["доступы", "confluence"],
    "status": "draft"
  }'
```

### Полностью обновить статью (PUT)

```bash
curl -X PUT http://localhost:3000/articles/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "title": "Как получить доступ к Confluence",
    "content": "Доступ выдаётся автоматически при выходе на работу через SSO. Обновлено.",
    "category": "IT-поддержка",
    "author": "Смирнова Е.",
    "tags": ["доступы", "confluence"],
    "status": "published"
  }'
```

### Удалить статью

```bash
curl -X DELETE http://localhost:3000/articles/<id> \
  -H "Authorization: Bearer <accessToken>"
```

### Ошибки

- `400` — невалидные данные (`ValidationError`), в ответе список проблемных полей.
- `401` — нет/невалиден/просрочен токен, либо неверные учётные данные (`UnauthorizedError`).
- `404` — статья, пользователь или маршрут не найдены (`NotFoundError`).
- `409` — email уже занят при регистрации (`ConflictError`).
- `500` — непредвиденная ошибка сервера.

Все ошибки обрабатываются глобальным middleware
(`src/presentation/http/errorHandler.js`).
