import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useArticles } from '../store/ArticlesContext.jsx';
import { CATEGORIES, STATUSES } from '../data/mockArticles.js';
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

export default function ArticleListPage() {
  const { articles, isLoading, addArticle, removeArticle, resetToMock } = useArticles();
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

  useEffect(() => {
    localStorage.setItem(SORT_KEY, sort);
  }, [sort]);

  useEffect(() => {
    document.title = isLoading
      ? 'Загрузка… — Вики'
      : `Статьи (${articles.length}) — Вики`;
  }, [articles.length, isLoading]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles
      .filter((a) => status === 'all' || a.status === status)
      .filter((a) => !category || a.category === category)
      .filter((a) => !tag || a.tags.includes(tag))
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q)),
      )
      .sort(SORTS[sort].fn);
  }, [articles, status, category, tag, query, sort]);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (title.length < 3) return;
    addArticle({ title, category: newCategory, author: 'Лозюк Е.' });
    setNewTitle('');
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

      <div className="filters">
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
        </div>
      )}

      {isLoading ? (
        <div className="table-skeleton">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton-line" style={{ height: 18, marginBottom: 18 }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>{hasFilters ? 'Нет статей, подходящих под фильтры.' : 'Статей пока нет.'}</p>
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
            <button type="button" className="btn" onClick={resetToMock}>
              Загрузить демо-данные
            </button>
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
              return (
                <tr key={a.id}>
                  <td>
                    <Link to={`/articles/${a.id}`} className="table-title">
                      {a.title}
                    </Link>
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
                    <button type="button" className="link-btn" onClick={() => navigate(`/articles/${a.id}/edit`)}>
                      Изменить
                    </button>
                    <button type="button" className="link-btn link-btn-danger" onClick={() => setToDelete(a)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!isLoading && visible.length > 0 && (
        <div className="table-footer muted">
          Показано {visible.length} из {articles.length}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Удалить статью?"
          onConfirm={() => {
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
