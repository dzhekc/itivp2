'use strict';

const { Server } = require('socket.io');

const ROOM_PREFIX = 'article:';

const roomName = (articleId) => `${ROOM_PREFIX}${articleId}`;

// Имя для отображения: часть email до @ (полный адрес в чате не нужен).
function displayName(user) {
  return String(user?.email ?? '').split('@')[0] || 'Аноним';
}

function readToken(socket) {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth) return fromAuth;

  const [scheme, token] = String(socket.handshake.headers.authorization ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/**
 * Слой реального времени (лаба 7): Socket.IO поверх того же HTTP-сервера, что и REST.
 *
 * Сокеты аутентифицируются access-токеном из handshake — без него подключение
 * отклоняется. Каждая статья — отдельная комната `article:<id>`: сообщения,
 * индикатор набора текста и presence видят только участники комнаты.
 * Сообщения сохраняются в MongoDB, поэтому история переживает перезапуск сервера.
 */
function createRealtimeServer({
  httpServer,
  tokenService,
  listChatMessages,
  postChatMessage,
  getArticleById,
  origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
}) {
  const allowedOrigins = origins.map((o) => o.trim()).filter(Boolean);

  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  });

  io.use((socket, next) => {
    const token = readToken(socket);
    if (!token) return next(new Error('UNAUTHORIZED'));

    try {
      const payload = tokenService.verifyAccessToken(token);
      socket.data.user = { id: payload.id, email: payload.email };
      return next();
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    // Комнаты, из которых нужно обновить presence после отключения: к моменту
    // события `disconnect` socket.rooms уже пуст.
    socket.data.joinedRooms = new Set();
    console.log(`Чат: подключился ${user.email} (${socket.id})`);

    // Presence считаем по пользователям, а не по сокетам: несколько вкладок
    // одного человека — это один участник.
    const emitPresence = async (articleId) => {
      const room = roomName(articleId);
      const sockets = await io.in(room).fetchSockets();

      const users = new Map();
      for (const s of sockets) {
        const id = s.data.user?.id ?? s.id;
        if (!users.has(id)) {
          users.set(id, { id, name: displayName(s.data.user) });
        }
      }

      io.to(room).emit('chat:presence', {
        articleId,
        count: users.size,
        users: [...users.values()],
      });
    };

    const systemNotice = (articleId, text) => {
      io.to(roomName(articleId)).emit('chat:system', {
        articleId,
        text,
        createdAt: new Date().toISOString(),
      });
    };

    socket.on('chat:join', async (payload, ack) => {
      const articleId = typeof payload?.articleId === 'string' ? payload.articleId : null;
      if (!articleId) {
        ack?.({ ok: false, error: 'Не указана статья' });
        return;
      }

      let article;
      try {
        article = await getArticleById.execute(articleId);
      } catch {
        ack?.({ ok: false, error: 'Статья не найдена' });
        return;
      }

      for (const room of socket.rooms) {
        if (room.startsWith(ROOM_PREFIX) && room !== roomName(articleId)) {
          socket.leave(room);
          socket.data.joinedRooms.delete(room.slice(ROOM_PREFIX.length));
          await emitPresence(room.slice(ROOM_PREFIX.length));
        }
      }

      await socket.join(roomName(articleId));
      socket.data.joinedRooms.add(articleId);

      let history = [];
      try {
        history = await listChatMessages.execute({ articleId });
      } catch (err) {
        console.error('Чат: не удалось загрузить историю', err);
      }

      const name = displayName(user);
      socket.to(roomName(articleId)).emit('chat:system', {
        articleId,
        text: `${name} присоединился к обсуждению`,
        kind: 'join',
        createdAt: new Date().toISOString(),
      });

      ack?.({ ok: true, articleId, history, user: { id: user.id, name } });
      await emitPresence(articleId);
      console.log(`Чат: ${name} вошёл в комнату «${article.title}»`);
    });

    socket.on('chat:leave', async (payload) => {
      const articleId = typeof payload?.articleId === 'string' ? payload.articleId : null;
      if (!articleId) return;

      await socket.leave(roomName(articleId));
      socket.data.joinedRooms.delete(articleId);
      socket.to(roomName(articleId)).emit('chat:system', {
        articleId,
        text: `${displayName(user)} покинул обсуждение`,
        kind: 'leave',
        createdAt: new Date().toISOString(),
      });
      await emitPresence(articleId);
    });

    socket.on('chat:message', async (payload, ack) => {
      const articleId = typeof payload?.articleId === 'string' ? payload.articleId : null;
      if (!articleId || !socket.rooms.has(roomName(articleId))) {
        ack?.({ ok: false, error: 'Сначала войдите в обсуждение статьи' });
        return;
      }

      try {
        const message = await postChatMessage.execute({ articleId, text: payload?.text, user });
        io.to(roomName(articleId)).emit('chat:message', message);
        ack?.({ ok: true, message });
      } catch (err) {
        const fieldError = err.fields?.[0];
        ack?.({ ok: false, error: fieldError ? `Сообщение: ${fieldError.message}` : err.message });
      }
    });

    socket.on('chat:typing', (payload) => {
      const articleId = typeof payload?.articleId === 'string' ? payload.articleId : null;
      if (!articleId || !socket.rooms.has(roomName(articleId))) return;

      socket.to(roomName(articleId)).emit('chat:typing', {
        articleId,
        userId: user.id,
        name: displayName(user),
        isTyping: Boolean(payload?.isTyping),
      });
    });

    // `disconnecting` — последний момент, когда socket.rooms ещё заполнен.
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (!room.startsWith(ROOM_PREFIX)) continue;

        const articleId = room.slice(ROOM_PREFIX.length);
        socket.to(room).emit('chat:system', {
          articleId,
          text: `${displayName(user)} покинул обсуждение`,
          kind: 'leave',
          createdAt: new Date().toISOString(),
        });
        socket.to(room).emit('chat:typing', { articleId, name: displayName(user), isTyping: false });
      }
    });

    socket.on('disconnect', async (reason) => {
      console.log(`Чат: отключился ${user.email} (${socket.id}): ${reason}`);
      for (const articleId of socket.data.joinedRooms ?? []) {
        await emitPresence(articleId);
      }
    });
  });

  return io;
}

module.exports = { createRealtimeServer, roomName };
