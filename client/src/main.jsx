import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HeadProvider } from 'react-head';
// App
import App from './App.jsx';
// Context
import { AuthProvider } from './auth/AuthProvider.jsx';
import { startSessionRequest } from './auth/bootSession.js';
// Errors
import ErrorBoundary from './utils/error/ErrorBoundary.jsx';
import AppErrorScreen from './components/utils/AppErrorScreen.jsx';
// Constants
import { CLIENT_ONLY_ROUTE_PREFIXES, PUBLIC_STATIC_ROUTES } from './utils/constants/routes.js';
import { COUNTRY_ROUTES } from './utils/countries/countryPages.js';
// Pages
import { preloadPage } from './utils/navigation/lazyPages.js';
import { registerServiceWorker } from './utils/pwa/registerServiceWorker.js';
import { listenForInstallOffer } from './utils/pwa/installPrompt.js';
// Styles
import './styles/main.css';

// A pre-rendered page ('page', or '404' for 404.html) is already on screen: React takes it
// over (hydrates) instead of drawing it again. The app shell (browser-only pages) has an
// empty #root and is drawn from scratch.
const container = document.getElementById('root');
const prerendered = document.documentElement.dataset.prerendered;
const path = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';

// 404.html can also be served for a real page's address in another case (/About): the
// router matches that page, not the 404 markup, so it's drawn from scratch
const isRoutedPath = PUBLIC_STATIC_ROUTES.includes(path) || COUNTRY_ROUTES.includes(path) ||
  CLIENT_ONLY_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
const hydrate = container.hasChildNodes() && (prerendered === 'page' || (prerendered === '404' && !isRoutedPath));
const firstPage = prerendered === '404' && hydrate ? '*' : window.location.pathname;

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

// The same tree for the first render here and for the pre-render's markup (below)
const app = () => (
  // A render error anywhere (or a page whose code didn't download) shows the error screen
  // with a reload button, instead of a blank page
  <ErrorBoundary fallback={<AppErrorScreen />}>
    <HeadProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HeadProvider>
  </ErrorBoundary>
);

mockReady
  .then(() => {
    // The session request goes out now, alongside the first page's code (in mock mode,
    // once the mock answers requests)
    startSessionRequest();
    return preloadPage(firstPage);
  })
  .finally(() => {
    if (hydrate) hydrateRoot(container, app());
    else createRoot(container).render(app());
  });

// Build-time pre-render only (scripts/prerender.mjs): the markup React hydrates is the
// app's first render as the server renderer writes it (with the markers hydration needs),
// not the settled page. Its code is a separate chunk that visitors never download.
if (window.__PRERENDER__) {
  window.__renderRootHtml = () =>
    import('react-dom/server').then(({ renderToString }) => renderToString(app()));
}

// The installable app's service worker: production builds on the live site only
registerServiceWorker();
// The browser's offer to install it as an app, kept for the map's tips
listenForInstallOffer();
