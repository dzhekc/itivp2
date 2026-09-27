import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';

function SearchForm({ initialQuery }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  return (
    <form className="header-search" onSubmit={handleSubmit} role="search">
      <input
        type="search"
        placeholder="Поиск по статьям"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

export default function Header() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span className="header-logo-mark">W</span>
        <span>Вики</span>
      </Link>

      <nav className="header-nav">
        <Link to="/">Статьи</Link>
      </nav>

      {/* key сбрасывает поле, когда поисковый запрос в URL меняется извне */}
      <SearchForm key={q} initialQuery={q} />

      <Link to="/new" className="btn btn-primary">
        Создать
      </Link>

      {user ? (
        <>
          <div className="header-user" title={user.email}>
            {user.email.slice(0, 2).toUpperCase()}
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </>
      ) : (
        <Link to="/login" className="btn">
          Войти
        </Link>
      )}
    </header>
  );
}
