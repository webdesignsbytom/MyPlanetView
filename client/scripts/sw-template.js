// The site's service worker (docs/FEATURE-PLAN.md, "Installable app (PWA)", version 1:
// installable, online only). Written by hand, no Workbox. The build fills in the two
// placeholders (vite.config.js `siteServiceWorker`) and writes it to dist/sw.js, served
// with no-cache so a new deploy replaces it at once.
//
// What it does:
// - keeps the app shell (app-shell.html and the files it loads) and every hashed file
//   under /assets/, so the app starts from the device on a repeat visit;
// - opens a page from the network first; offline, a signed-in or secret page falls back
//   to the app shell (which says it's offline) and a public page to its last copy;
// - never touches anything else: not the API, not another site (signed photo, video and
//   poster links), not a POST. Nothing private is ever stored here.
const BUILD = '__SW_BUILD__';
// Pages that only exist in the browser (CLIENT_ONLY_ROUTE_PREFIXES in routes.js): offline,
// they open the app shell. Their own HTML (also the secret share, invite and reset links)
// is never stored.
const CLIENT_ONLY_PREFIXES = ['__SW_CLIENT_ONLY__'];

const SHELL_CACHE = `mpv-shell-${BUILD}`;
const PAGES_CACHE = `mpv-pages-${BUILD}`;
const ASSETS_CACHE = `mpv-assets-${BUILD}`;
const OWN_CACHES = [SHELL_CACHE, PAGES_CACHE, ASSETS_CACHE];
const SHELL_URL = '/app-shell.html';
// Small public files the shell needs, refreshed in the background when used
const SITE_FILES = /^\/(favicon\/|brand\/|fonts\/|manifest\.json$)/;

const isClientOnly = (path) => CLIENT_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

// Install: the app shell and every file it names under /assets/
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const shell = await fetch(SHELL_URL, { cache: 'no-cache' });
      if (!shell.ok) throw new Error(`app shell ${shell.status}`);
      const html = await shell.clone().text();
      await cache.put(SHELL_URL, shell);
      const files = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))];
      const assets = await caches.open(ASSETS_CACHE);
      await assets.addAll(files);
      await self.skipWaiting();
    })()
  );
});

// Activate: only this build's caches stay
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('mpv-') && !OWN_CACHES.includes(name)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

async function openPage(request, path) {
  try {
    const response = await fetch(request);
    // Keep a copy of a public page only (never a signed-in or secret page's HTML)
    if (response.ok && !isClientOnly(path)) {
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (!isClientOnly(path)) {
      const page = await caches.match(request, { cacheName: PAGES_CACHE });
      if (page) return page;
    }
    const shell = await caches.match(SHELL_URL, { cacheName: SHELL_CACHE });
    return shell || new Response('You’re offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cachedFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function refreshedInBackground(event) {
  const cached = await caches.match(event.request);
  const network = fetch(event.request)
    .then(async (response) => {
      if (response.ok) await (await caches.open(ASSETS_CACHE)).put(event.request, response.clone());
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Another site (the API, R2, Stream, analytics, posters): left to the browser
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(openPage(request, url.pathname));
    return;
  }
  // Vite's hashed files never change under the same name
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cachedFirst(request));
    return;
  }
  if (SITE_FILES.test(url.pathname)) event.respondWith(refreshedInBackground(event));
});
