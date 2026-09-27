import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useArticles } from '../store/ArticlesContext.jsx';
import { getAncestors } from '../utils/tree.js';
import { parseContent, Markup } from '../utils/markup.jsx';
import { formatDate, plural } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import NotFoundPage from './NotFoundPage.jsx';

function initials(name) {
  return name
    .replace(/\./g, '')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { articles, isLoading, removeArticle, registerView } = useArticles();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const viewedRef = useRef(null);

  const article = articles.find((a) => a.id === id);
  const ancestors = useMemo(() => (article ? getAncestors(articles, article) : []), [articles, article]);
  const children = useMemo(
    () =>
      articles.filter((a) => a.parentId === id).sort((x, y) => x.title.localeCompare(y.title, 'ru')),
    [articles, id],
  );
  const { blocks, headings } = useMemo(() => parseContent(article?.content ?? ''), [article?.content]);

  useEffect(() => {
    if (article) document.title = `${article.title} — Вики`;
  }, [article?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Счётчик просмотров: один раз на открытие статьи (ref защищает от двойного вызова в StrictMode).
  useEffect(() => {
    if (isLoading || !article || viewedRef.current === id) return;
    viewedRef.current = id;
    registerView(id);
  }, [id, isLoading, article, registerView]);

  if (isLoading) {
    return (
      <div className="page page-article">
        <div className="skeleton-line" style={{ width: 220, height: 12 }} />
        <div className="skeleton-line" style={{ width: '60%', height: 32, marginTop: 20 }} />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-line" style={{ width: `${70 + ((i * 13) % 30)}%`, marginTop: 14 }} />
        ))}
      </div>
    );
  }

  if (!article) return <NotFoundPage />;

  const handleDelete = () => {
    removeArticle(article.id);
    navigate(article.parentId ? `/articles/${article.parentId}` : '/');
  };

  return (
    <div className="page page-article">
      <div className="article-layout">
        <article className="article">
          <nav className="breadcrumbs">
            <Link to="/">Корпоративная вики</Link>
            <span>/</span>
            <Link to={`/?category=${encodeURIComponent(article.category)}`}>{article.category}</Link>
            {ancestors.map((a) => (
              <span key={a.id} className="breadcrumbs-item">
                <span>/</span>
                <Link to={`/articles/${a.id}`}>{a.title}</Link>
              </span>
            ))}
          </nav>

          <div className="article-toolbar">
            <StatusBadge status={article.status} />
            <div className="article-actions">
              <Link to={`/new?parent=${article.id}`} className="btn btn-ghost">
                Дочерняя страница
              </Link>
              <Link to={`/articles/${article.id}/edit`} className="btn">
                Редактировать
              </Link>
              <button type="button" className="btn btn-ghost btn-ghost-danger" onClick={() => setConfirmDelete(true)}>
                Удалить
              </button>
            </div>
          </div>

          <h1 className="article-title">{article.title}</h1>

          <div className="article-meta">
            <span className="avatar">{initials(article.author)}</span>
            <span>
              <span className="article-author">{article.author}</span>
              <span className="article-meta-sep">·</span>
              обновлено {formatDate(article.updatedAt)}
              <span className="article-meta-sep">·</span>
              {article.viewsCount} {plural(article.viewsCount, 'просмотр', 'просмотра', 'просмотров')}
            </span>
          </div>

          {article.status === 'archived' && (
            <div className="notice">Статья в архиве и может содержать устаревшую информацию.</div>
          )}

          <div className="article-content">
            {blocks.length ? <Markup blocks={blocks} /> : <p className="muted">Страница пока пустая.</p>}
          </div>

          {article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map((tag) => (
                <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} className="tag">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {children.length > 0 && (
            <section className="child-pages">
              <h4>Дочерние страницы</h4>
              <ul>
                {children.map((c) => (
                  <li key={c.id}>
                    <Link to={`/articles/${c.id}`}>{c.title}</Link>
                    <span className="muted">{c.author}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="article-footer">
            Создано {formatDate(article.createdAt)}
          </footer>
        </article>

        {headings.length > 1 && (
          <aside className="toc">
            <div className="toc-title">На этой странице</div>
            <ul>
              {headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? 'toc-sub' : ''}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Удалить страницу?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        >
          Страница «{article.title}» будет удалена.
          {children.length > 0 && ' Дочерние страницы переместятся на уровень выше.'}
        </ConfirmDialog>
      )}
    </div>
  );
}
