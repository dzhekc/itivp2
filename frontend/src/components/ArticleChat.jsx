import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.jsx';
import { useArticleChat } from '../hooks/useArticleChat.js';
import { formatTime, plural } from '../utils/format.js';

const STATUS_LABELS = {
  connecting: 'подключение…',
  online: 'в сети',
  offline: 'нет соединения',
};

export default function ArticleChat({ articleId }) {
  const { user } = useAuth();
  const { status, messages, systemMessages, online, typingNames, error, sendMessage, notifyTyping } =
    useArticleChat(articleId);

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);

  // Новые сообщения и системные уведомления прокручивают список вниз.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, systemMessages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || isSending) return;

    setIsSending(true);
    const result = await sendMessage(value);
    setIsSending(false);
    // Текст очищаем только при успехе, иначе пользователь потеряет набранное.
    if (result.ok) setText('');
  };

  const typingLabel =
    typingNames.length === 1
      ? `${typingNames[0]} печатает…`
      : typingNames.length > 1
        ? `${typingNames.length} человека печатают…`
        : '';

  return (
    <section className="chat" aria-label="Обсуждение статьи">
      <div className="chat-head">
        <h4>Обсуждение</h4>
        <span className={`chat-status chat-status-${status}`}>
          <span className="chat-dot" aria-hidden="true" />
          {status === 'online'
            ? `${online.count} ${plural(online.count, 'участник', 'участника', 'участников')} · в сети`
            : STATUS_LABELS[status]}
        </span>
      </div>

      <div className="chat-list" ref={listRef} role="log" aria-live="polite">
        {messages.length === 0 && <p className="muted chat-empty">Сообщений пока нет — начните обсуждение.</p>}

        {messages.map((message) => {
          const own = user && message.author === user.email;
          return (
            <div key={message.id} className={`chat-message${own ? ' chat-message-own' : ''}`}>
              <div className="chat-message-head">
                <span className="chat-author">{message.author}</span>
                <span className="chat-time">{formatTime(message.createdAt)}</span>
              </div>
              <div className="chat-bubble">{message.text}</div>
            </div>
          );
        })}

        {systemMessages.map((notice) => (
          <div key={notice.id} className="chat-system">
            {notice.text}
          </div>
        ))}
      </div>

      <div className="chat-typing" aria-live="polite">
        {typingLabel}
      </div>

      {user ? (
        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            rows={2}
            maxLength={2000}
            placeholder="Написать в обсуждение… (Enter — отправить, Shift+Enter — новая строка)"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={isSending || !text.trim()}>
            {isSending ? 'Отправка…' : 'Отправить'}
          </button>
        </form>
      ) : (
        <div className="chat-login">
          <span className="muted">Войдите, чтобы участвовать в обсуждении.</span>
          <Link to={`/login?next=${encodeURIComponent(`/articles/${articleId}`)}`} className="btn">
            Войти
          </Link>
        </div>
      )}

      {error && <p className="chat-error">{error}</p>}
    </section>
  );
}
