import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import ArticleListPage from './pages/ArticleListPage.jsx';
import ArticlePage from './pages/ArticlePage.jsx';
import ArticleEditorPage from './pages/ArticleEditorPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RequireAuth from './components/RequireAuth.jsx';

export default function App() {
  const location = useLocation();
  const editorKey = location.pathname + location.search;

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ArticleListPage />} />
            {/* key пересоздаёт редактор при переходе между страницами создания/редактирования */}
            <Route
              path="/new"
              element={
                <RequireAuth>
                  <ArticleEditorPage key={editorKey} />
                </RequireAuth>
              }
            />
            <Route path="/articles/:id" element={<ArticlePage />} />
            <Route
              path="/articles/:id/edit"
              element={
                <RequireAuth>
                  <ArticleEditorPage key={editorKey} />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
