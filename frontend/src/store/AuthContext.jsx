import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { notify } = useToast();
  const [user, setUser] = useState(api.getStoredUser);

  // Проверяем сохранённую сессию: если токены протухли, перехватчик в api.js
  // попробует их обновить, а при неудаче пришлёт SESSION_EXPIRED_EVENT.
  useEffect(() => {
    if (!api.getStoredUser()) return;
    api
      .fetchCurrentUser()
      .then((current) => {
        api.saveSession({ user: current });
        setUser(current);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      notify('Сессия истекла, войдите заново');
    };
    window.addEventListener(api.SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(api.SESSION_EXPIRED_EVENT, onExpired);
  }, [notify]);

  const login = useCallback(async (email, password) => {
    const session = await api.login(email, password);
    api.saveSession(session);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(
    async (email, password) => {
      await api.register(email, password);
      return login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    api.clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return ctx;
}
