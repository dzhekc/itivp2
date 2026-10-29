import axios from 'axios';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Событие для AuthContext: сессия истекла, и обновить её не удалось.
export const SESSION_EXPIRED_EVENT = 'wiki:session-expired';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 700;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 10000,
});

/* ---------- Сессия ---------- */

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function saveSession({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function hasRefreshToken() {
  return Boolean(localStorage.getItem(REFRESH_TOKEN_KEY));
}

/* ---------- Перехватчики ---------- */

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Один общий запрос на обновление, даже если одновременно упало несколько запросов.
let refreshPromise = null;

export function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return Promise.reject(new Error('Нет refresh-токена'));

  refreshPromise ??= axios
    .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
    .then(({ data }) => saveSession(data))
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function refreshTokens() {
  return refreshSession();
}

// Access-токен живёт час. На 401 пробуем обновить его по refresh-токену и повторить запрос.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthRequest = config?.url?.startsWith('/auth/');
    if (response?.status !== 401 || isAuthRequest || config._retried) throw error;

    if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
      config._retried = true;
      try {
        await refreshTokens();
        return api(config);
      } catch {
        // упадём ниже в завершение сессии
      }
    }

    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw error;
  },
);

/* ---------- Повтор запросов ---------- */

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new axios.CanceledError());
      },
      { once: true },
    );
  });
}

// Повторяем только то, что может пройти со второй попытки: сеть недоступна или 5xx.
function isRetryable(error) {
  if (axios.isCancel(error)) return false;
  return !error.response || error.response.status >= 500;
}

// GET-запрос с повтором: до 3 попыток, пауза растёт с каждой попыткой.
async function withRetry(request, signal) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      if (attempt >= RETRY_ATTEMPTS || !isRetryable(error) || signal?.aborted) throw error;
      await wait(RETRY_DELAY_MS * attempt, signal);
    }
  }
}

/* ---------- Статьи ---------- */

export const fetchArticles = (params = {}, { signal } = {}) =>
  withRetry(() => api.get('/articles', { params, signal }), signal).then((r) => r.data);

export const createArticle = (article) => api.post('/articles', article).then((r) => r.data);

export const updateArticle = (id, article) => api.put(`/articles/${id}`, article).then((r) => r.data);

export const deleteArticle = (id) => api.delete(`/articles/${id}`);

export const registerArticleView = (id) => api.post(`/articles/${id}/views`).then((r) => r.data);

/* ---------- Авторизация ---------- */

export const login = (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (email, password) => api.post('/auth/register', { email, password }).then((r) => r.data);

export const fetchCurrentUser = () => api.get('/auth/me').then((r) => r.data);

/* ---------- Ошибки ---------- */

export const isCancelled = (error) => axios.isCancel(error);

const FIELD_LABELS = {
  title: 'заголовок',
  content: 'текст',
  category: 'раздел',
  author: 'автор',
  tags: 'теги',
  status: 'статус',
  parentId: 'родительская страница',
  email: 'email',
  password: 'пароль',
};

// Текст для пользователя из ответа API: { error: { code, message, fields } }.
export function getErrorMessage(error) {
  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? 'Сервер не ответил вовремя'
      : 'Сервер недоступен. Проверьте, что API запущен';
  }

  const { status, data } = error.response;
  // Для /auth/login сервер сам объясняет причину («Неверный email или пароль»).
  if (status === 401 && !error.config?.url?.startsWith('/auth/')) {
    return 'Сессия истекла, войдите заново';
  }

  const apiError = data?.error;
  if (!apiError) return `Ошибка сервера (${status})`;

  const fields = apiError.fields?.map((f) => `${FIELD_LABELS[f.field] ?? f.field} — ${f.message}`);
  return fields?.length ? `${apiError.message}: ${fields.join('; ')}` : apiError.message;
}
