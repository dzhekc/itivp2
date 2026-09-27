import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useArticles } from '../store/ArticlesContext.jsx';
import { CATEGORIES } from '../data/mockArticles.js';
import { buildTree, getAncestors } from '../utils/tree.js';
import { plural } from '../utils/format.js';
import PageTree from './PageTree.jsx';
import Icon from './Icon.jsx';

const EXPANDED_KEY = 'wiki.tree.expanded';

function loadExpanded() {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY)) ?? []);
  } catch {
    return new Set();
  }
}

// Оставляет узлы, у которых совпал заголовок или есть совпавший потомок.
function filterNodes(nodes, q) {
  return nodes
    .map((node) => {
      const children = filterNodes(node.children, q);
      const match = node.article.title.toLowerCase().includes(q);
      return match || children.length ? { ...node, children } : null;
    })
    .filter(Boolean);
}

export default function Sidebar() {
  const { articles, isLoading } = useArticles();
  const location = useLocation();
  const activeId = location.pathname.match(/^\/articles\/([^/]+)/)?.[1] ?? null;

  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(loadExpanded);
  const [collapsedCategories, setCollapsedCategories] = useState(() => new Set());

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
  }, [expanded]);

  // Раскрываем ветку до открытой статьи, чтобы она была видна в дереве.
  useEffect(() => {
    const active = articles.find((a) => a.id === activeId);
    if (!active) return;
    const ancestorIds = getAncestors(articles, active).map((a) => a.id);
    if (ancestorIds.every((id) => expanded.has(id))) return;
    setExpanded((prev) => new Set([...prev, ...ancestorIds]));
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.delete(active.category);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, articles]);

  const tree = useMemo(() => buildTree(articles, CATEGORIES), [articles]);
  const q = filter.trim().toLowerCase();
  const visibleTree = useMemo(
    () => (q ? tree.map((s) => ({ ...s, nodes: filterNodes(s.nodes, q) })).filter((s) => s.nodes.length) : tree),
    [tree, q],
  );

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleCategory = (category) =>
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  return (
    <aside className="sidebar">
      <div className="sidebar-space">
        <div className="sidebar-space-icon">КВ</div>
        <div>
          <div className="sidebar-space-name">Корпоративная вики</div>
          <div className="sidebar-space-meta">
            {articles.length} {plural(articles.length, 'страница', 'страницы', 'страниц')}
          </div>
        </div>
      </div>

      <nav className="sidebar-links">
        <NavLink to="/" end>
          Все статьи
        </NavLink>
        <NavLink to="/new">Новая страница</NavLink>
      </nav>

      <div className="sidebar-section-title">Страницы</div>
      <input
        className="sidebar-filter"
        type="text"
        placeholder="Фильтр по названию"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="sidebar-tree">
        {isLoading && (
          <div className="tree-skeleton">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="skeleton-line" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
            ))}
          </div>
        )}

        {!isLoading && visibleTree.length === 0 && <div className="sidebar-empty">Ничего не найдено</div>}

        {!isLoading &&
          visibleTree.map(({ category, nodes }) => {
            const isOpen = q || !collapsedCategories.has(category);
            return (
              <div key={category} className="tree-category">
                <div className="tree-category-row">
                  <button
                    type="button"
                    className={`tree-toggle ${isOpen ? 'is-open' : ''}`}
                    onClick={() => toggleCategory(category)}
                    aria-label={isOpen ? 'Свернуть раздел' : 'Развернуть раздел'}
                  >
                    <Icon name="chevron" size={14} />
                  </button>
                  <span className="tree-category-name">{category}</span>
                  <Link
                    to={`/new?category=${encodeURIComponent(category)}`}
                    className="tree-add"
                    title="Создать страницу в разделе"
                  >
                    <Icon name="plus" size={14} />
                  </Link>
                </div>
                {isOpen &&
                  (nodes.length ? (
                    <PageTree
                      nodes={nodes}
                      activeId={activeId}
                      expanded={expanded}
                      forceExpanded={Boolean(q)}
                      onToggle={toggle}
                    />
                  ) : (
                    <div className="tree-empty">Пока нет страниц</div>
                  ))}
              </div>
            );
          })}
      </div>
    </aside>
  );
}
