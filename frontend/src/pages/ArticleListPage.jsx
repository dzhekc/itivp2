import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isTempId, useArticles } from '../store/ArticlesContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { useServerSearch } from '../hooks/useServerSearch.js';
import { CATEGORIES, STATUSES } from '../constants.js';
import { formatShortDate, plural } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const SORTS = {
  updated: { label: 'Сначала обновлённые', fn: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  created: { label: 'Сначала новые', fn: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  title: { label: 'По названию', fn: (a, b) => a.title.localeCompare(b.title, 'ru') },
  views: { label: 'По просмотрам', fn: (a, b) => b.viewsCount - a.viewsCount },
};

const SORT_KEY = 'wiki.list.sort';
// Сервер требует текст не короче 10 символов, а быстрый черновик создаётся только с заголовком.
const DRAFT_PLACEHOLDER = 'Черновик страницы. Добавьте сюда текст статьи.';

export default function ArticleListPage() {
  const { articles, isLoading, error, reload, addArticle, removeArticle } = useArticles();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const tag = searchParams.get('tag') ?? '';

  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState(() => localStorage.getItem(SORT_KEY) ?? 'updated');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [toDelete, setToDelete] = useState(null);
  const search = useServerSearch(query);

  useEffect(() => {
    localStorage.setItem(SORT_KEY, sort);
  }, [sort]);

  useEffect(() => {
    document.title = isLoading
      ? 'Загрузка… — Вики'
      : `Статьи (${articles.length}) — Вики`;
  }, [articles.length, isLoading]);

  const setParam = (key, value, options) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, options);
  };

  const byId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);

  const stats = useMemo(
    () => ({
      total: articles.length,
      published: articles.filter((a) => a.status === 'published').length,
      draft: articles.filter((a) => a.status === 'draft').length,
      archived: articles.filter((a) => a.status === 'archived').length,
      views: articles.reduce((sum, a) => sum + a.viewsCount, 0),
    }),
    [articles],
  );

  // Текстовый поиск выполняет сервер (useServerSearch), остальные фильтры — на клиенте.
  const visible = useMemo(
    () =>
      articles
        .filter((a) => !search.ids || search.ids.has(a.id))
        .filter((a) => status === 'all' || a.status === status)
        .filter((a) => !category || a.category === category)
        .filter((a) => !tag || a.tags.includes(tag))
        .sort(SORTS[sort].fn),
    [articles, search.ids, status, category, tag, sort],
  );

  const handleQuickAdd = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (title.length < 3) return;
    // Поле очищается сразу: строка появится в таблице ещё до ответа сервера.
    setNewTitle('');
    addArticle({ title, category: newCategory, author: 'Лозюк Е.', content: DRAFT_PLACEHOLDER });
  };

  const hasFilters = query || category || tag || status !== 'all';

  return (
    <div className="page page-list">
      <div className="page-header">
        <div>
          <h1>Все статьи</h1>
          <p className="muted">Статьи корпоративной вики по всем разделам</p>
        </div>
        <Link to="/new" className="btn btn-primary">
          Создать статью
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">всего</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.published}</div>
          <div className="stat-label">опубликовано</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.draft}</div>
          <div className="stat-label">{plural(stats.draft, 'черновик', 'черновика', 'черновиков')}</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.archived}</div>
          <div className="stat-label">в архиве</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.views}</div>
          <div className="stat-label">{plural(stats.views, 'просмотр', 'просмотра', 'просмотров')}</div>
        </div>
      </div>

      {user && (
        <form className="quick-add" onSubmit={handleQuickAdd}>
          <input
            type="text"
            placeholder="Название нового черновика"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="btn" disabled={newTitle.trim().length < 3}>
            Добавить черновик
          </button>
        </form>
      )}

      <div className="filters">
        <input
          className="filters-search"
          type="search"
          placeholder="Поиск по заголовку, тексту и тегам"
          value={query}
          onChange={(e) => setParam('q', e.target.value, { replace: true })}
        />

        <div className="segmented">
          {[['all', 'Все'], ...Object.entries(STATUSES)].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={status === value ? 'is-active' : ''}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <select value={category} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">Все разделы</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(SORTS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {(query || tag) && (
        <div className="active-filters">
          {query && (
            <span className="chip">
              Поиск: «{query}»
              <button type="button" onClick={() => setParam('q', '')} aria-label="Сбросить поиск">
                ×
              </button>
            </span>
          )}
          {tag && (
            <span className="chip">
              Тег: {tag}
              <button type="button" onClick={() => setParam('tag', '')} aria-label="Сбросить тег">
                ×
              </button>
            </span>
          )}
          {search.isSearching && <span className="search-status muted">Ищем на сервере…</span>}
          {search.error && <span className="search-status search-status-error">{search.error}</span>}
        </div>
      )}

      {error ? (
        <div className="error-state">
          <p className="error-state-title">Не удалось загрузить статьи</p>
          <p className="muted">{error}</p>
          <button type="button" className="btn" onClick={reload}>
            Повторить
          </button>
        </div>
      ) : isLoading ? (
        <div className="table-skeleton">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton-line" style={{ height: 18, marginBottom: 18 }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>
            {search.isSearching
              ? 'Ищем…'
              : hasFilters
                ? 'Нет статей, подходящих под фильтры.'
                : 'Статей пока нет.'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setStatus('all');
                setSearchParams({});
              }}
            >
              Сбросить фильтры
            </button>
          ) : (
            <Link to="/new" className="btn">
              Создать первую статью
            </Link>
          )}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Раздел</th>
              <th>Статус</th>
              <th>Автор</th>
              <th>Обновлено</th>
              <th className="num">Просмотры</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const parent = a.parentId ? byId.get(a.parentId) : null;
              // У новой статьи до ответа сервера временный id — ссылаться на неё пока нельзя.
              const isNew = isTempId(a.id);
              return (
                <tr key={a.id} className={a.isPending ? 'is-pending' : ''}>
                  <td>
                    {isNew ? (
                      <span className="table-title">{a.title}</span>
                    ) : (
                      <Link to={`/articles/${a.id}`} className="table-title">
                        {a.title}
                      </Link>
                    )}
                    {a.isPending && <span className="pending-label">сохранение…</span>}
                    {parent && <div className="table-sub">в «{parent.title}»</div>}
                  </td>
                  <td>{a.category}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>{a.author}</td>
                  <td className="nowrap">{formatShortDate(a.updatedAt)}</td>
                  <td className="num">{a.viewsCount}</td>
                  <td className="table-actions">
                    {user && !isNew && (
                      <>
                        <button type="button" className="link-btn" onClick={() => navigate(`/articles/${a.id}/edit`)}>
                          Изменить
                        </button>
                        <button type="button" className="link-btn link-btn-danger" onClick={() => setToDelete(a)}>
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!isLoading && !error && visible.length > 0 && (
        <div className="table-footer muted">
          Показано {visible.length} из {articles.length}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Удалить статью?"
          onConfirm={() => {
            // Строка исчезает сразу; если сервер откажет, она вернётся и появится уведомление.
            removeArticle(toDelete.id);
            setToDelete(null);
          }}
          onCancel={() => setToDelete(null)}
        >
          Статья «{toDelete.title}» будет удалена без возможности восстановления.
        </ConfirmDialog>
      )}
    </div>
  );
}
