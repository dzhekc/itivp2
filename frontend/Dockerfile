# Frontend: React (Vite) — многоэтапная сборка (Лабораторная работа №8)
# Этап 1: builder — установка зависимостей и сборка статики.

# Сборка выполняется из корня репозитория (context: .), чтобы переиспользовать
# корневой .npmrc для внутреннего Artifactory.
FROM docker-hosted.artifactory.tcsbank.ru/sec-base-images/blanc/ubuntu-jammy-nodejs-26-cicd:latest AS builder

WORKDIR /app/frontend

# npm-пакеты тянутся из внутреннего Artifactory (см. .npmrc)
COPY .npmrc ./

# Манифесты копируем отдельно — слой кэшируется до копирования исходников.
# package-lock.json ссылается на registry.npmjs.org (недоступен в РБ), а npm 12 блокирует
# "remote"-загрузку (EALLOWREMOTE). Переписываем URL тарболов на registry npm-all в образе.
COPY frontend/package*.json ./
RUN sed -i 's#https://registry.npmjs.org/#https://artifactory.tcsbank.ru/artifactory/api/npm/npm-all/#g' package-lock.json

# Auth для скачивания prebuilt-бинарников с gitlab.tcsbank.ru (если переданы в build-arg).
ARG GITLAB_NETRC_PASSWORD
RUN if [ -n "$GITLAB_NETRC_PASSWORD" ]; then \
      printf 'machine gitlab.tcsbank.ru\nlogin oauth2\npassword %s\n' "$GITLAB_NETRC_PASSWORD" > /root/.netrc \
      && chmod 600 /root/.netrc; \
    fi

# Адреса API и WebSocket подставляются на этапе сборки.
# По умолчанию фронтенд ходит на backend напрямую: http://localhost:5000.
ARG VITE_API_URL=http://localhost:5000
ARG VITE_SOCKET_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm ci

# npm-баг с optional-зависимостями (npm/cli#4828): lock-файл создавался на macOS и не содержит
# нативного биндинга для linux-x64 (@rolldown/binding-linux-x64-gnu). Доставляем его явно,
# версию берём из установленного rolldown.
RUN RD_VERSION=$(node -p "require('./node_modules/rolldown/package.json').version") \
  && npm install --no-save "@rolldown/binding-linux-x64-gnu@$RD_VERSION"

COPY frontend/ ./
RUN npm run build

# Этап 2: runner — Nginx отдаёт статику SPA.
FROM docker-proxy.artifactory.tcsbank.ru/nginx:alpine AS runner

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]