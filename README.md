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

| Переменная    | Назначение                          |
|---------------|--------------------------------------|
| `PORT`        | порт, на котором слушает Express     |
| `DB_HOST`     | хост PostgreSQL                      |
| `DB_PORT`     | порт PostgreSQL                      |
| `DB_USER`     | пользователь БД                      |
| `DB_PASSWORD` | пароль пользователя БД               |
| `DB_NAME`     | имя базы данных                      |

## База данных

Поднять PostgreSQL в Docker:

```bash
npm run docker:db:up      # docker compose up -d postgres
npm run docker:db:down    # остановить и удалить контейнер
```

Применить миграции и наполнить демо-данными:

```bash
npm run db:migrate        # создать таблицу articles + колонку viewsCount
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

## API

Ресурс — `articles`. Поля: `title`, `content`, `category`, `author`, `tags`
(массив строк), `status` (`draft` | `published` | `archived`), `viewsCount`
(только для чтения, выставляется автоматически).

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
curl -X DELETE http://localhost:3000/articles/<id>
```

### Ошибки

- `400` — невалидные данные (`ValidationError`), в ответе список проблемных полей.
- `404` — статья или маршрут не найдены (`NotFoundError`).
- `500` — непредвиденная ошибка сервера.

Все ошибки обрабатываются глобальным middleware
(`src/presentation/http/errorHandler.js`).
