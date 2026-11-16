// The site's service worker (docs/FEATURE-PLAN.md, "Installable app (PWA)": installable,
// its data online only). Written by hand, no Workbox. The build fills in the four
// placeholders (vite.config.js `siteServiceWorker`) and writes it to dist/sw.js, served
// with no-cache so a new deploy replaces it at once.
//
// What it does:
// - keeps the app shell (app-shell.html and the files it loads) and every hashed file
//   under /assets/, so the app starts from the device on a repeat visit;
// - opens a page from the network first; offline, a signed-in or secret page falls back
//   to the app shell (which says it's offline) and a public page to its last copy;
// - in the installed app, keeps every public page and all the site's code ('keep-site',
//   below), so they all open offline, not only those already visited;
// - never touches anything else: not the API, not another site (signed photo, video and
//   poster links), not a POST. Nothing private is ever stored here: photos and map data
//   always need a connection.
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

// The public, pre-rendered pages (home, about, FAQ, pricing, contact, legal, and the
// published country guides and month pages): the pre-render's list
const PUBLIC_PAGES = ['__SW_PUBLIC_PAGES__'];
// Every script, stylesheet and font of this build, which the installed app keeps: a page's
// HTML doesn't name all it loads (a country guide's text is its own chunk, loaded later)
const SITE_CODE = ['__SW_SITE_CODE__'];

const isClientOnly = (path) => CLIENT_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

// Kept copies are found by address alone. A host may answer `Vary: Origin` (or another
// header), and the page asks for its scripts and fonts with an Origin the worker's own
// fetches don't send, so with Vary honoured nothing kept would ever be found offline. The
// files are hashed (never changed under one name) and the pages public, so that's safe.
const BY_ADDRESS = { ignoreVary: true };

// The files under /assets/ a page names: its scripts, styles and preloads (not the images in a
// srcset: those are kept once shown, like any /assets/ file)
const assetsIn = (html) => [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))];

// Install: the app shell and every file it names under /assets/
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const shell = await fetch(SHELL_URL, { cache: 'no-cache' });
      if (!shell.ok) throw new Error(`app shell ${shell.status}`);
      const html = await shell.clone().text();
      await cache.put(SHELL_URL, shell);
      const assets = await caches.open(ASSETS_CACHE);
      await assets.addAll(assetsIn(html));
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
      // A public page reads the same whatever its query (?utm_…, ?code=)
      const page = await caches.match(request, { ...BY_ADDRESS, cacheName: PAGES_CACHE, ignoreSearch: true });
      if (page) return page;
    }
    const shell = await caches.match(SHELL_URL, { ...BY_ADDRESS, cacheName: SHELL_CACHE });
    return shell || new Response('You’re offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cachedFirst(request) {
  const cached = await caches.match(request, BY_ADDRESS);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function refreshedInBackground(event) {
  const cached = await caches.match(event.request, BY_ADDRESS);
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

// The installed app keeps the whole public site: registerServiceWorker.js sends 'keep-site'
// each time the app opens, and only what this build hasn't kept yet is fetched: first the
// code (in batches; the browser's own cache usually has most of it), then the pages, one at
// a time. Whatever fails (offline, a bad file) is tried again next time. A redirected answer
// isn't kept, as a page opened from it would fail.
const CODE_BATCH = 20;
let keeping = null;
async function keepSite() {
  const assets = await caches.open(ASSETS_CACHE);
  const missing = [];
  for (const file of SITE_CODE) if (!(await assets.match(file, BY_ADDRESS))) missing.push(file);
  for (let i = 0; i < missing.length; i += CODE_BATCH) {
    try {
      await assets.addAll(missing.slice(i, i + CODE_BATCH));
    } catch {
      // Tried again the next time the app opens
    }
  }
  const pages = await caches.open(PAGES_CACHE);
  for (const route of PUBLIC_PAGES) {
    try {
      if (await pages.match(route, BY_ADDRESS)) continue;
      const response = await fetch(route, { cache: 'no-cache' });
      if (response.ok && !response.redirected) await pages.put(route, response);
    } catch {
      // Tried again the next time the app opens
    }
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'keep-site') return;
  keeping ??= keepSite().finally(() => {
    keeping = null;
  });
  event.waitUntil(keeping);
});

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
