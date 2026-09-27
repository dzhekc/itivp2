import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';

// Создание и редактирование требуют JWT: без входа отправляем на /login и возвращаем обратно.
export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}
