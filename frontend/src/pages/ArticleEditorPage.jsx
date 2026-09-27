import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isTempId, useArticles } from '../store/ArticlesContext.jsx';
import { CATEGORIES, STATUSES } from '../constants.js';
import { getDescendantIds } from '../utils/tree.js';
import { parseContent, Markup } from '../utils/markup.jsx';
import { parseTags } from '../utils/format.js';
import NotFoundPage from './NotFoundPage.jsx';

const AUTOSAVE_DELAY_MS = 500;
const CURRENT_USER = 'Лозюк Е.';

// Те же правила, что в Article.validate на бэкенде.
function validate(form) {
  const errors = {};
  if (form.title.trim().length < 3) errors.title = 'Минимум 3 символа';
  if (form.content.trim().length < 10) errors.content = 'Минимум 10 символов';
  if (!form.category.trim()) errors.category = 'Выберите раздел';
  if (!form.author.trim()) errors.author = 'Укажите автора';
  return errors;
}

function toForm(article) {
  return {
    title: article.title,
    category: article.category,
    parentId: article.parentId ?? '',
    status: article.status,
    author: article.author,
    tags: article.tags.join(', '),
    content: article.content,
  };
}

function readDraft(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export default function ArticleEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { articles, isLoading, error, reload, addArticle, updateArticle } = useArticles();

  const isEdit = Boolean(id);
  const article = isEdit ? articles.find((a) => a.id === id) : null;
  const draftKey = `wiki.draft.${id ?? 'new'}`;

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState('write');
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const initialFormRef = useRef(null);

  // Инициализация формы после загрузки данных: из черновика, из статьи или пустая.
  useEffect(() => {
    if (isLoading || form) return;
    if (isEdit && !article) return;

    let initial;
    if (isEdit) {
      initial = toForm(article);
    } else {
      const parent = articles.find((a) => a.id === searchParams.get('parent'));
      initial = {
        title: '',
        category: parent?.category ?? searchParams.get('category') ?? CATEGORIES[0],
        parentId: parent?.id ?? '',
        status: 'draft',
        author: CURRENT_USER,
        tags: '',
        content: '',
      };
    }
    initialFormRef.current = initial;

    const draft = readDraft(draftKey);
    if (draft) {
      setForm(draft.form);
      setRestoredDraft(true);
    } else {
      setForm(initial);
    }
  }, [isLoading, isEdit, article, articles, form, draftKey, searchParams]);

  // Автосохранение черновика в localStorage через 500 мс после последнего изменения.
  useEffect(() => {
    if (!form || form === initialFormRef.current) return;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ form, savedAt: new Date().toISOString() }));
      setSavedAt(new Date());
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [form, draftKey]);

  useEffect(() => {
    const name = form?.title.trim();
    document.title = isEdit
      ? `Редактирование: ${name || article?.title || ''} — Вики`
      : `${name || 'Новая страница'} — Вики`;
  }, [form?.title, isEdit, article?.title]);

  const parentOptions = useMemo(() => {
    if (!form) return [];
    const excluded = isEdit ? getDescendantIds(articles, id) : new Set();
    return articles
      .filter((a) => a.category === form.category && a.id !== id && !excluded.has(a.id) && !isTempId(a.id))
      .sort((x, y) => x.title.localeCompare(y.title, 'ru'));
  }, [articles, form, id, isEdit]);

  const preview = useMemo(() => (tab === 'preview' && form ? parseContent(form.content) : null), [tab, form]);

  if (error) {
    return (
      <div className="page page-editor">
        <div className="error-state">
          <p className="error-state-title">Не удалось загрузить данные для редактора</p>
          <p className="muted">{error}</p>
          <button type="button" className="btn" onClick={reload}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (!isLoading && isEdit && !article) return <NotFoundPage />;

  if (!form) {
    return (
      <div className="page page-editor">
        <div className="skeleton-line" style={{ width: '40%', height: 28 }} />
        <div className="skeleton-line" style={{ height: 300, marginTop: 24 }} />
      </div>
    );
  }

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // При смене раздела родитель из другого раздела больше не подходит.
      if (field === 'category') next.parentId = '';
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setForm(initialFormRef.current);
    setRestoredDraft(false);
    setSavedAt(null);
  };

  const handleCancel = () => {
    localStorage.removeItem(draftKey);
    navigate(isEdit ? `/articles/${id}` : -1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    const found = validate(form);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      // Ставим курсор в поле, которое нужно исправить (текст — только на вкладке «Текст»).
      if (firstInvalid === 'content') setTab('write');
      requestAnimationFrame(() => e.target.elements[firstInvalid]?.focus());
      return;
    }

    const data = {
      title: form.title.trim(),
      category: form.category,
      parentId: form.parentId || null,
      status: form.status,
      author: form.author.trim(),
      tags: parseTags(form.tags),
      content: form.content.trim(),
    };

    if (isEdit) {
      // Правка применяется к списку сразу, поэтому переходим к статье не дожидаясь ответа.
      // Черновик удаляем только после успешного PUT: при ошибке изменения откатятся,
      // но останутся в черновике и восстановятся при следующем открытии редактора.
      navigate(`/articles/${id}`);
      const saved = await updateArticle(id, data);
      if (saved) localStorage.removeItem(draftKey);
      return;
    }

    // Новая статья уже видна в дереве с временным id, но открыть её можно
    // только после ответа сервера, когда появится настоящий id.
    setIsSaving(true);
    const created = await addArticle(data);
    if (created) {
      localStorage.removeItem(draftKey);
      navigate(`/articles/${created.id}`);
    } else {
      setIsSaving(false);
    }
  };

  return (
    <div className="page page-editor">
      <form onSubmit={handleSubmit} noValidate>
        <div className="editor-header">
          <div className="breadcrumbs">
            <Link to="/">Корпоративная вики</Link>
            <span>/</span>
            <span>{isEdit ? 'Редактирование' : 'Новая страница'}</span>
          </div>
          <div className="editor-status muted">
            {savedAt && `Черновик сохранён в ${savedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </div>
          <div className="editor-actions">
            <button type="button" className="btn btn-ghost" onClick={handleCancel}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>

        {restoredDraft && (
          <div className="notice notice-info">
            Восстановлен несохранённый черновик.
            <button type="button" className="link-btn" onClick={discardDraft}>
              Отменить изменения
            </button>
          </div>
        )}

        <label className="editor-title-field">
          <span>Заголовок</span>
          <input
            name="title"
            className={`editor-title ${errors.title ? 'has-error' : ''}`}
            type="text"
            placeholder="Например: Как оформить отпуск"
            value={form.title}
            onChange={set('title')}
            autoFocus={!isEdit}
          />
        </label>
        {errors.title && <div className="field-error">Заголовок: {errors.title.toLowerCase()}</div>}

        <div className="editor-fields">
          <label className="field">
            <span>Раздел</span>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Родительская страница</span>
            <select value={form.parentId} onChange={set('parentId')}>
              <option value="">— верхний уровень —</option>
              {parentOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Статус</span>
            <select value={form.status} onChange={set('status')}>
              {Object.entries(STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Автор</span>
            <input
              type="text"
              value={form.author}
              name="author"
              onChange={set('author')}
              className={errors.author ? 'has-error' : ''}
            />
            {errors.author && <span className="field-error">{errors.author}</span>}
          </label>

          <label className="field field-wide">
            <span>Теги через запятую</span>
            <input type="text" placeholder="например: api, backend" value={form.tags} onChange={set('tags')} />
          </label>
        </div>

        <div className="editor-body">
          <div className="tabs">
            <button type="button" className={tab === 'write' ? 'is-active' : ''} onClick={() => setTab('write')}>
              Текст
            </button>
            <button type="button" className={tab === 'preview' ? 'is-active' : ''} onClick={() => setTab('preview')}>
              Предпросмотр
            </button>
            <span className="tabs-hint muted">## заголовок, - список, **жирный**, `код`</span>
          </div>

          {tab === 'write' ? (
            <textarea
              className={`editor-textarea ${errors.content ? 'has-error' : ''}`}
              value={form.content}
              name="content"
              onChange={set('content')}
              placeholder="Текст статьи…"
            />
          ) : (
            <div className="editor-preview article-content">
              {preview.blocks.length ? <Markup blocks={preview.blocks} /> : <p className="muted">Нечего показать.</p>}
            </div>
          )}
          {errors.content && <div className="field-error">{errors.content}</div>}
        </div>
      </form>
    </div>
  );
}
