import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api.js';
import { useToast } from './ToastContext.jsx';

const ArticlesContext = createContext(null);

// Временный id статьи, которая ещё не сохранена на сервере.
export const isTempId = (id) => String(id).startsWith('tmp-');

// Поля, которые принимает PUT/POST /articles (остальное сервер считает сам).
function toPayload(article) {
  return {
    title: article.title,
    content: article.content,
    category: article.category,
    author: article.author,
    tags: article.tags,
    status: article.status,
    parentId: article.parentId ?? null,
  };
}

export function ArticlesProvider({ children }) {
  const { notify } = useToast();
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Актуальный список для снимков перед оптимистичным изменением (нужны для отката).
  const articlesRef = useRef(articles);
  useLayoutEffect(() => {
    articlesRef.current = articles;
  });

  const loadArticles = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      setArticles(await api.fetchArticles({}, { signal }));
    } catch (err) {
      if (api.isCancelled(err)) return;
      setError(api.getErrorMessage(err));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  // Загрузка при монтировании. При размонтировании запрос отменяется
  // (в StrictMode это как раз гасит первый, лишний запрос).
  useEffect(() => {
    const controller = new AbortController();
    loadArticles(controller.signal);
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => loadArticles(), [loadArticles]);

  // Добавление: статья сразу появляется с временным id, после ответа сервера
  // заменяется настоящей; при ошибке убирается из списка.
  const addArticle = useCallback(
    async (data) => {
      const tempId = `tmp-${Date.now()}`;
      const now = new Date().toISOString();
      const optimistic = {
        parentId: null,
        tags: [],
        status: 'draft',
        ...data,
        id: tempId,
        viewsCount: 0,
        createdAt: now,
        updatedAt: now,
        isPending: true,
      };
      setArticles((prev) => [optimistic, ...prev]);

      try {
        const created = await api.createArticle(toPayload(optimistic));
        setArticles((prev) => prev.map((a) => (a.id === tempId ? created : a)));
        return created;
      } catch (err) {
        setArticles((prev) => prev.filter((a) => a.id !== tempId));
        notify(`Не удалось создать «${data.title}». ${api.getErrorMessage(err)}`);
        return null;
      }
    },
    [notify],
  );

  // Редактирование: изменения видны сразу, при ошибке возвращается прежняя версия.
  const updateArticle = useCallback(
    async (id, data) => {
      const previous = articlesRef.current.find((a) => a.id === id);
      if (!previous) return null;

      const optimistic = { ...previous, ...data, updatedAt: new Date().toISOString(), isPending: true };
      setArticles((prev) => prev.map((a) => (a.id === id ? optimistic : a)));

      try {
        const saved = await api.updateArticle(id, toPayload(optimistic));
        setArticles((prev) => prev.map((a) => (a.id === id ? saved : a)));
        return saved;
      } catch (err) {
        setArticles((prev) => prev.map((a) => (a.id === id ? previous : a)));
        notify(`Изменения в «${previous.title}» не сохранены. ${api.getErrorMessage(err)}`);
        return null;
      }
    },
    [notify],
  );

  // Удаление: статья сразу пропадает, дочерние поднимаются на уровень выше
  // (так же делает сервер). При ошибке всё возвращается на место.
  const removeArticle = useCallback(
    async (id) => {
      const target = articlesRef.current.find((a) => a.id === id);
      if (!target) return false;
      const childIds = new Set(articlesRef.current.filter((a) => a.parentId === id).map((a) => a.id));

      setArticles((prev) =>
        prev.filter((a) => a.id !== id).map((a) => (childIds.has(a.id) ? { ...a, parentId: target.parentId } : a)),
      );

      try {
        await api.deleteArticle(id);
        return true;
      } catch (err) {
        // 404 — статью уже удалили (например, в другой вкладке), откатывать нечего.
        if (err.response?.status === 404) return true;
        setArticles((prev) => [...prev.map((a) => (childIds.has(a.id) ? { ...a, parentId: id } : a)), target]);
        notify(`Не удалось удалить «${target.title}». ${api.getErrorMessage(err)}`);
        return false;
      }
    },
    [notify],
  );

  // Просмотр: +1 сразу, затем точное значение с сервера. Ошибка некритична — тихо откатываем.
  const registerView = useCallback(async (id) => {
    if (isTempId(id)) return;
    const bump = (delta) =>
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, viewsCount: a.viewsCount + delta } : a)));

    bump(1);
    try {
      const { viewsCount } = await api.registerArticleView(id);
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, viewsCount } : a)));
    } catch {
      bump(-1);
    }
  }, []);

  const value = useMemo(
    () => ({ articles, isLoading, error, reload, addArticle, updateArticle, removeArticle, registerView }),
    [articles, isLoading, error, reload, addArticle, updateArticle, removeArticle, registerView],
  );

  return <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>;
}

export function useArticles() {
  const ctx = useContext(ArticlesContext);
  if (!ctx) throw new Error('useArticles должен использоваться внутри ArticlesProvider');
  return ctx;
}
