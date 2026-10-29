import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket } from '../realtime/socket.js';

const TYPING_STOP_MS = 2000;
const TYPING_EXPIRE_MS = 4000;
const SEND_TIMEOUT_MS = 5000;

/**
 * Состояние обсуждения одной статьи (лаба 7): история из MongoDB,
 * новые сообщения в реальном времени, presence и «печатает…».
 */
export function useArticleChat(articleId) {
  const [status, setStatus] = useState('connecting'); // connecting | online | offline
  const [messages, setMessages] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [online, setOnline] = useState({ count: 0, users: [] });
  const [typingNames, setTypingNames] = useState([]);
  const [error, setError] = useState(null);

  const typingTimer = useRef(null);
  const isTyping = useRef(false);
  const expireTimers = useRef(new Map());

  useEffect(() => {
    if (!articleId) return undefined;

    const socket = connectSocket();

    setMessages([]);
    setSystemMessages([]);
    setTypingNames([]);
    setOnline({ count: 0, users: [] });
    setError(null);

    const onConnect = () => {
      setStatus('online');
      socket.emit('chat:join', { articleId }, (res) => {
        if (!res?.ok) {
          setError(res?.error ?? 'Не удалось войти в обсуждение');
          return;
        }
        setMessages(res.history);
      });
    };

    const onDisconnect = () => setStatus('offline');

    const onMessage = (message) => {
      if (message.articleId !== articleId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      // Человек только что написал — индикатор больше не нужен.
      setTypingNames((prev) => prev.filter((name) => name !== message.author));
      clearTimeout(expireTimers.current.get(message.author));
    };

    const onSystem = (notice) => {
      if (notice.articleId !== articleId) return;
      const entry = { id: `${notice.createdAt}-${notice.text}`, text: notice.text };
      setSystemMessages((prev) => [...prev.slice(-4), entry]);
    };

    const onPresence = (presence) => {
      if (presence.articleId !== articleId) return;
      setOnline({ count: presence.count, users: presence.users });
    };

    const onTyping = (payload) => {
      if (payload.articleId !== articleId) return;
      const { name, isTyping: typing } = payload;

      setTypingNames((prev) => {
        if (!typing) return prev.filter((n) => n !== name);
        return prev.includes(name) ? prev : [...prev, name];
      });

      clearTimeout(expireTimers.current.get(name));
      if (typing) {
        expireTimers.current.set(
          name,
          setTimeout(() => setTypingNames((prev) => prev.filter((n) => n !== name)), TYPING_EXPIRE_MS),
        );
      } else {
        expireTimers.current.delete(name);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message', onMessage);
    socket.on('chat:system', onSystem);
    socket.on('chat:presence', onPresence);
    socket.on('chat:typing', onTyping);

    if (socket.connected) onConnect();
    else setStatus('connecting');

    return () => {
      socket.emit('chat:leave', { articleId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onMessage);
      socket.off('chat:system', onSystem);
      socket.off('chat:presence', onPresence);
      socket.off('chat:typing', onTyping);

      clearTimeout(typingTimer.current);
      isTyping.current = false;
      expireTimers.current.forEach((timer) => clearTimeout(timer));
      expireTimers.current.clear();
    };
  }, [articleId]);

  const sendMessage = useCallback(
    (text) =>
      new Promise((resolve) => {
        const socket = connectSocket();

        // Если сервер не ответил (обрыв), не оставляем промис висеть.
        const timer = setTimeout(() => resolve({ ok: false, error: 'Сервер не ответил' }), SEND_TIMEOUT_MS);

        socket.emit('chat:message', { articleId, text }, (res) => {
          clearTimeout(timer);
          if (res?.ok) setError(null);
          else setError(res?.error ?? 'Сообщение не отправлено');
          resolve(res ?? { ok: false });
        });
      }),
    [articleId],
  );

  // Индикатор «печатает»: сразу отправляем true, через паузу — false.
  const notifyTyping = useCallback(() => {
    const socket = connectSocket();
    if (!isTyping.current) {
      isTyping.current = true;
      socket.emit('chat:typing', { articleId, isTyping: true });
    }

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      socket.emit('chat:typing', { articleId, isTyping: false });
    }, TYPING_STOP_MS);
  }, [articleId]);

  return { status, messages, systemMessages, online, typingNames, error, sendMessage, notifyTyping };
}
