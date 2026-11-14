import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HeadProvider } from 'react-head';
// App
import App from './App.jsx';
// Context
import { AuthProvider } from './auth/AuthProvider.jsx';
// Pages
import { preloadPage } from './utils/navigation/lazyPages.js';
// Styles
import './styles/main.css';
// Web Vitals
import './utils/seo/vitals.js';

// A pre-rendered page is already on screen: load its code before React replaces it
const prerendered = document.documentElement.dataset.prerendered;
const firstPage = prerendered === '404' ? '*' : window.location.pathname;

// Dev mock mode: signed in as a test user, every API call answered in the browser, no
// server. It's the default for `npm run dev`. `?api=real` switches to the real API
// (VITE_API_URL) and `?api=mock` back; the choice is remembered in this browser.
// `npm run dev:mock` always uses mock mode. A production build compiles MOCK to false and
// drops the import entirely.
function devUsesMock() {
  if (import.meta.env.MODE === 'mock') return true;
  try {
    const param = new URLSearchParams(window.location.search).get('api');
    if (param === 'real' || param === 'mock') localStorage.setItem('mpv:apiSource', param);
    return localStorage.getItem('mpv:apiSource') !== 'real';
  } catch {
    return true; // storage blocked: stay on mock
  }
}
const MOCK = import.meta.env.DEV && devUsesMock();
const mockReady = MOCK
  ? import('./dev/mock/installMock.js')
      .then((m) => m.installMock())
      .catch((err) => console.error('Mock mode failed to start', err))
  : Promise.resolve();

mockReady
  .then(() => preloadPage(firstPage))
  .finally(() => {
    createRoot(document.getElementById('root')).render(
      <HeadProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </HeadProvider>,
    );
  });
