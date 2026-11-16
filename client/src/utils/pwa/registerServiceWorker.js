// Running as the installed app (from its own icon, with no browser bar): Chrome and Edge
// report the manifest's standalone display, Safari on iPhone `navigator.standalone`
const isInstalledApp = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// The installed app asks the worker to keep every public page, so they open offline (the
// worker fetches only what it hasn't kept). Not in a browser tab, where it would cost every
// visitor the whole site, and not when the device asks to save data.
async function keepSiteIfInstalled() {
  if (!isInstalledApp() || navigator.connection?.saveData) return;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: 'keep-site' });
}

// The service worker (docs/FEATURE-PLAN.md, "Installable app (PWA)"; the worker itself is
// scripts/sw-template.js, written to /sw.js at build). Registered on the live site only:
// production builds, once the page has loaded. Never in development or mock mode (the
// worker doesn't exist there), in the pre-render's headless Chromium, or in a browser
// driven by tests.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (window.__PRERENDER__ || navigator.webdriver) return;
  const register = () =>
    navigator.serviceWorker
      .register('/sw.js')
      .then(keepSiteIfInstalled)
      .catch((err) => console.warn('[pwa] service worker not registered:', err.message));
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
