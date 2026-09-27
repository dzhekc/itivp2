import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function PageTree({ nodes, activeId, expanded, forceExpanded, onToggle, depth = 0 }) {
  return (
    <ul className="tree">
      {nodes.map(({ article, children }) => {
        const hasChildren = children.length > 0;
        const isOpen = forceExpanded || expanded.has(article.id);
        const isActive = article.id === activeId;

        return (
          <li key={article.id}>
            <div
              className={`tree-row ${isActive ? 'is-active' : ''} ${article.status === 'archived' ? 'is-archived' : ''}`}
              style={{ paddingLeft: 18 + depth * 16}}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className={`tree-toggle ${isOpen ? 'is-open' : ''}`}
                  onClick={() => onToggle(article.id)}
                  aria-label={isOpen ? 'Свернуть' : 'Развернуть'}
                >
                  <Icon name="chevron" size={14} />
                </button>
              ) : (
                <span className="tree-toggle-placeholder" />
              )}
              <Link to={`/articles/${article.id}`} className="tree-link" title={article.title}>
                {article.title}
              </Link>
              {article.status === 'draft' && <span className="tree-draft-dot" title="Черновик" />}
              <Link
                to={`/new?parent=${article.id}`}
                className="tree-add"
                title="Создать дочернюю страницу"
              >
                <Icon name="plus" size={14} />
              </Link>
            </div>
            {hasChildren && isOpen && (
              <PageTree
                nodes={children}
                activeId={activeId}
                expanded={expanded}
                forceExpanded={forceExpanded}
                onToggle={onToggle}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
