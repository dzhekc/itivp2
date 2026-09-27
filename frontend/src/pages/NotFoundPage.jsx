import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Страница не найдена — Вики';
  }, []);

  return (
    <div className="page page-empty">
      <h1>Страница не найдена</h1>
      <p className="muted">Возможно, её удалили или ссылка устарела.</p>
      <Link to="/" className="btn">
        К списку статей
      </Link>
    </div>
  );
}
