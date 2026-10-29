import { io } from 'socket.io-client';
import { getAccessToken, refreshSession } from '../api.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let socket = null;

/**
 * Одно общее соединение на всё приложение (лаба 7).
 * Токен передаётся в handshake: сервер отклоняет подключение без валидного access-токена.
 */
export function getSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: { token: getAccessToken() },
    transports: ['websocket', 'polling'],
  });

  // Access-токен живёт час. Если сервер отклонил его, обновляем сессию
  // тем же refresh-запросом, что и axios, и переподключаемся.
  socket.on('connect_error', async (err) => {
    if (err.message !== 'UNAUTHORIZED') return;
    try {
      await refreshSession();
      socket.auth = { token: getAccessToken() };
      socket.connect();
    } catch {
      // обновить не удалось — соединение остаётся закрытым, пользователь увидит статус
    }
  });

  window.addEventListener('wiki:session-expired', () => socket.disconnect());

  return socket;
}

export function connectSocket() {
  const instance = getSocket();
  // Токен мог смениться после логина в другой вкладке.
  instance.auth = { token: getAccessToken() };
  if (!instance.connected && !instance.active) instance.connect();
  return instance;
}

export function disconnectSocket() {
  socket?.disconnect();
}
