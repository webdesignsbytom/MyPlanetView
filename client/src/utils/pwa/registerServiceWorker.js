// The service worker (docs/FEATURE-PLAN.md, "Installable app (PWA)"; the worker itself is
// scripts/sw-template.js, written to /sw.js at build). Registered on the live site only:
// production builds, once the page has loaded. Never in development or mock mode (the
// worker doesn't exist there), in the pre-render's headless Chromium, or in a browser
// driven by tests.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (window.__PRERENDER__ || navigator.webdriver) return;
  const register = () =>
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('[pwa] service worker not registered:', err.message));
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
