import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mockArticles } from '../data/mockArticles.js';

const STORAGE_KEY = 'wiki.articles';
const LOAD_DELAY_MS = 1000;

const ArticlesContext = createContext(null);

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка при монтировании: имитируем запрос к серверу с задержкой в 1 секунду.
  useEffect(() => {
    const timer = setTimeout(() => {
      setArticles(readStorage() ?? mockArticles);
      setIsLoading(false);
    }, LOAD_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  // Сохранение при каждом изменении списка. Пока идёт загрузка, не пишем,
  // иначе пустой начальный массив затрёт сохранённые данные.
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }, [articles, isLoading]);

  const addArticle = useCallback((data) => {
    const now = new Date().toISOString();
    const article = {
      id: crypto.randomUUID(),
      parentId: null,
      content: '',
      tags: [],
      status: 'draft',
      ...data,
      viewsCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setArticles((prev) => [...prev, article]);
    return article;
  }, []);

  const updateArticle = useCallback((id, data) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a)),
    );
  }, []);

  // Дочерние страницы удалённой статьи поднимаются на уровень выше, а не удаляются.
  const removeArticle = useCallback((id) => {
    setArticles((prev) => {
      const target = prev.find((a) => a.id === id);
      if (!target) return prev;
      return prev
        .filter((a) => a.id !== id)
        .map((a) => (a.parentId === id ? { ...a, parentId: target.parentId } : a));
    });
  }, []);

  const registerView = useCallback((id) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, viewsCount: a.viewsCount + 1 } : a)));
  }, []);

  const resetToMock = useCallback(() => setArticles(mockArticles), []);

  const value = useMemo(
    () => ({ articles, isLoading, addArticle, updateArticle, removeArticle, registerView, resetToMock }),
    [articles, isLoading, addArticle, updateArticle, removeArticle, registerView, resetToMock],
  );

  return <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>;
}

export function useArticles() {
  const ctx = useContext(ArticlesContext);
  if (!ctx) throw new Error('useArticles должен использоваться внутри ArticlesProvider');
  return ctx;
}
