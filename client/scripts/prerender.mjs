// Renders every public page in headless Chromium after the build and saves it as dist/<route>.html,
// so crawlers and link previews get each page's real HTML, and main.jsx hydrates it. Runs
// first after the build; inline-critical.mjs then inlines each page's critical CSS.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { preview, loadEnv } from 'vite';
import { chromium } from '@playwright/test';
// Constants
import { FULL_BUSINESS_URL } from '../src/utils/constants/constants.js';
import {
  CLIENT_ONLY_ROUTE_PREFIXES,
  PUBLIC_STATIC_ROUTES,
} from '../src/utils/constants/routes.js';
// Country guides: the checked ones only, as the build has (none checked: none at all)
import { publishedCountryRoutes } from './country-pages.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const PORT = 4175;
const NOT_FOUND_PROBE = '/__prerender-404__';
const APP_SHELL = 'app-shell.html';
const HTACCESS_MARKER = '#__CLIENT_ONLY_REWRITES__';

// Head tags react-head owns; marked so it swaps them for its own when the page loads
const HEAD_TAGS = [
  'title',
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[property^="og:"]',
  'meta[property^="article:"]',
  'meta[name^="twitter:"]',
  'link[rel="canonical"]',
].join(', ');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Netlify (_redirects) and Apache (.htaccess) rules for pages that aren't files
async function writeHostingRules(shell) {
  const prefixes = CLIENT_ONLY_ROUTE_PREFIXES.map((prefix) => prefix.replace(/^\//, ''));
  const spaOnly = shell === 'index.html';

  const redirects = spaOnly
    ? ['/*  /index.html  200']
    : prefixes.flatMap((prefix) => [`/${prefix}  /${shell}  200`, `/${prefix}/*  /${shell}  200`]);
  await writeFile(resolve(dist, '_redirects'), `# Written by scripts/prerender.mjs\n${redirects.join('\n')}\n`);

  const htaccessPath = resolve(dist, '.htaccess');
  if (!existsSync(htaccessPath)) return;
  const htaccess = await readFile(htaccessPath, 'utf8');
  if (!htaccess.includes(HTACCESS_MARKER)) throw new Error(`.htaccess is missing ${HTACCESS_MARKER}`);
  const rule = spaOnly
    ? 'RewriteRule . /index.html [L]'
    : `RewriteRule ^(${prefixes.map(escapeRegex).join('|')})(/.*)?$ /${shell} [L]`;
  await writeFile(htaccessPath, htaccess.replace(HTACCESS_MARKER, rule));
}

// Load a page, wait for it to settle, return its HTML with react-head's tags marked.
// The head is the settled page's (react-head's tags, the page's preloads). #root holds the
// app's first render as React's server renderer writes it (main.jsx, window.__renderRootHtml):
// main.jsx hydrates that markup, and hydration needs exactly the first render, with its
// Suspense and text markers, not the DOM after effects have run.
async function capture(page, url, { isNotFound }) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    // Lazy media can keep the network busy; the DOM is what matters
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  }
  await page.waitForSelector('#main-content', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(300);

  return page.evaluate(
    async ({ headTags, isNotFound }) => {
      if (typeof window.__renderRootHtml !== 'function') throw new Error('main.jsx has no window.__renderRootHtml');
      // Loading the renderer adds a modulepreload for its chunk: never for visitors
      const headBefore = new Set(document.head.children);
      const markup = await window.__renderRootHtml();
      for (const el of [...document.head.children]) if (!headBefore.has(el)) el.remove();

      for (const el of document.head.querySelectorAll(headTags)) el.setAttribute('data-rh', '');
      document.documentElement.dataset.prerendered = isNotFound ? '404' : 'page';
      // The 404 page is served for many URLs, so it can't claim one
      if (isNotFound) {
        document.head.querySelector('link[rel="canonical"]')?.remove();
        document.head.querySelector('meta[property="og:url"]')?.remove();
      }

      // Text the page only shows after an effect isn't in the first render, so crawlers
      // wouldn't see it: report the difference
      const root = document.getElementById('root');
      const settledText = root.innerText.replace(/\s+/g, ' ').trim().length;
      root.innerHTML = markup;
      const firstRenderText = root.innerText.replace(/\s+/g, ' ').trim().length;

      return { html: `<!doctype html>\n${document.documentElement.outerHTML}`, settledText, firstRenderText };
    },
    { headTags: HEAD_TAGS, isNotFound }
  );
}

const outputFile = (route) => {
  if (route === '/') return 'index.html';
  if (route === NOT_FOUND_PROBE) return '404.html';
  return `${route.replace(/^\//, '')}.html`;
};

async function run() {
  // SKIP_PRERENDER=1: plain SPA (every URL gets index.html), e.g. a host without Chromium
  if (process.env.SKIP_PRERENDER) {
    await writeHostingRules('index.html');
    console.warn('⚠️  SKIP_PRERENDER set: plain SPA build, crawlers only see the fallback tags');
    return;
  }

  // App shell for browser-only pages: the built index.html, kept out of search
  const shell = await readFile(resolve(dist, 'index.html'), 'utf8');
  await writeFile(
    resolve(dist, APP_SHELL),
    shell.replace('</head>', '<meta data-rh="" name="robots" content="noindex,nofollow"></head>')
  );

  // Production API, for pages that fetch data while they are captured
  const { VITE_API_URL: apiUrl } = loadEnv('production', root, 'VITE_');
  const pages = [...PUBLIC_STATIC_ROUTES, ...publishedCountryRoutes()];
  const routes = [...pages, NOT_FOUND_PROBE];

  const server = await preview({ root, logLevel: 'silent', preview: { port: PORT, strictPort: true, open: false } });
  const origin = `http://localhost:${PORT}`;
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.__PRERENDER__ = true;
    });
    // Analytics never runs at build time
    await context.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());

    // API calls go through Node so the production API's CORS doesn't block the build origin
    let apiOrigin = null;
    try {
      apiOrigin = apiUrl ? new URL(apiUrl).origin : null;
    } catch {
      apiOrigin = null;
    }
    if (apiOrigin) {
      const cors = {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': 'content-type, authorization',
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      };
      await context.route((url) => url.origin === apiOrigin, async (route) => {
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
        try {
          const response = await route.fetch();
          return route.fulfill({ response, headers: { ...response.headers(), ...cors } });
        } catch {
          return route.abort();
        }
      });
    }

    const page = await context.newPage();
    const rendered = [];
    let failures = 0;

    for (const route of routes) {
      const apiProblems = [];
      const onResponse = (response) => {
        if (apiOrigin && response.url().startsWith(apiOrigin) && response.status() >= 400) apiProblems.push(response.status());
      };
      const onFailed = (request) => {
        if (apiOrigin && request.url().startsWith(apiOrigin)) apiProblems.push('failed');
      };
      page.on('response', onResponse);
      page.on('requestfailed', onFailed);

      try {
        const isNotFound = route === NOT_FOUND_PROBE;
        const { html, settledText, firstRenderText } = await capture(page, `${origin}${route}`, { isNotFound });
        if (!/<title[^>]*>[^<]+<\/title>/.test(html)) throw new Error('no <title> (check its HelmetItem)');
        rendered.push({ route, html });
        const notes = [];
        if (apiProblems.length) notes.push(`${apiProblems.length} API request(s) failed, check the saved page`);
        if (firstRenderText < settledText * 0.9) {
          notes.push(`the first render has ${firstRenderText} characters of text, the settled page ${settledText}: content shown after an effect isn't pre-rendered`);
        }
        console.log(`✅ Pre-rendered ${route}${notes.map((note) => `\n   ⚠️  ${note}`).join('')}`);
      } catch (err) {
        failures += 1;
        console.error(`❌ Failed to pre-render ${route}: ${err.message}`);
      } finally {
        page.off('response', onResponse);
        page.off('requestfailed', onFailed);
      }
    }

    if (failures) throw new Error(`${failures} page(s) failed to pre-render`);

    // Written only after every capture: index.html is the preview server's fallback until then
    for (const { route, html } of rendered) {
      const file = resolve(dist, outputFile(route));
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, html, 'utf8');
    }

    await writeHostingRules(APP_SHELL);
    console.log(
      `✅ Pre-rendered ${pages.length} pages and 404.html for ${FULL_BUSINESS_URL}`
    );
  } finally {
    await browser.close();
    await new Promise((done) => server.httpServer.close(done));
  }
}

run().catch((err) => {
  console.error('❌ Pre-render failed:', err.message);
  process.exit(1);
});
