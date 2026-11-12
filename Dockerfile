# Backend: Node.js/Express + Socket.IO (Лабораторная работа №8)
# Базовый образ — внутренний рантайм Node 26 (ubuntu-jammy) вместо node:<tag> с Docker Hub,
# т.к. Docker Hub ограничен в РБ и внутри T-Bank используются внутренние реестры.
FROM docker-hosted.artifactory.tcsbank.ru/sec-base-images/blanc/ubuntu-jammy-nodejs-26-cicd:latest

WORKDIR /app

# npm-пакеты тянутся из внутреннего Artifactory (см. .npmrc)
COPY .npmrc ./

# Манифесты копируем отдельно — слой кэшируется до копирования исходников.
# package-lock.json создавался под другой путь Artifactory (npm-registry-used-proxy),
# а npm 12 блокирует "remote"-загрузку (EALLOWREMOTE). Переписываем URL тарболов
# на настроенный registry npm-all прямо в образе (файл в репозитории не меняем).
COPY package*.json ./
RUN sed -i 's#/artifactory/api/npm/npm-registry-used-proxy/#/artifactory/api/npm/npm-all/#g' package-lock.json

# Auth для скачивания prebuilt-бинарников (bcrypt через node-pre-gyp) с gitlab.tcsbank.ru.
# Пароль (токен oauth2) передаётся build-arg'ом из .env и не попадает в репозиторий.
ARG GITLAB_NETRC_PASSWORD
RUN printf 'machine gitlab.tcsbank.ru\nlogin oauth2\npassword %s\n' "$GITLAB_NETRC_PASSWORD" > /root/.netrc \
  && chmod 600 /root/.netrc

RUN npm ci --omit=dev \
  && npm install-scripts approve bcrypt \
  && npm rebuild bcrypt

# Исходники приложения
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]