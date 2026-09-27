import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { getErrorMessage } from '../api.js';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Вход — Вики';
  }, []);

  if (user) return <Navigate to={next} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await (mode === 'login' ? login(email, password) : register(email, password));
      navigate(next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page page-login">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
        <p className="muted">Просматривать статьи можно без входа, а создавать и изменять — только после него.</p>

        <label className="field">
          <span>Email</span>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <div className="field-error">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !email || !password}>
          {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
        >
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>

        <p className="login-hint muted">
          Демо-пользователь из сидера: demo@wiki.local / demo123
        </p>
      </form>
    </div>
  );
}
