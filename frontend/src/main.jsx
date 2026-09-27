import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-serif/400.css';
import '@fontsource/ibm-plex-serif/400-italic.css';
import '@fontsource/ibm-plex-serif/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles.css';

import App from './App.jsx';
import { ArticlesProvider } from './store/ArticlesContext.jsx';
import { AuthProvider } from './store/AuthContext.jsx';
import { ToastProvider } from './store/ToastContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ArticlesProvider>
            <App />
          </ArticlesProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
