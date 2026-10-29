    import { useEffect, useState } from 'react';
import * as api from '../api.js';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Поиск на сервере: GET /articles?search=… по заголовку, тексту и тегам.
 *
 * - запрос уходит через 400 мс после последнего изменения строки (debounce);
 * - предыдущий запрос отменяется AbortController'ом, поэтому медленный ответ
 *   на старую строку не перетрёт результат для новой;
 * - при размонтировании компонента незавершённый запрос тоже отменяется.
 *
 * Возвращает id найденных статей (null — поиска нет), флаг загрузки и ошибку.
 */
export function useServerSearch(query) {
  const q = query.trim();
  const [result, setResult] = useState({ query: '', ids: null, error: null });

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .fetchArticles({ search: q }, { signal: controller.signal })
        .then((found) => setResult({ query: q, ids: new Set(found.map((a) => a.id)), error: null }))
        .catch((err) => {
          if (!api.isCancelled(err)) setResult({ query: q, ids: null, error: api.getErrorMessage(err) });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  if (!q) return { ids: null, isSearching: false, error: null };

  const isFresh = result.query === q;
  return {
    // Пока идёт новый запрос, показываем прошлую выдачу, чтобы таблица не мигала.
    ids: result.ids,
    isSearching: !isFresh,
    error: isFresh ? result.error : null,
  };
}
