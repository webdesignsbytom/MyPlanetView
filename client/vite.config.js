import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';
// Site head defaults
import {
  BACKGROUND_COLOUR,
  CompanyName,
  CompanyShortName,
  FULL_BUSINESS_URL,
  SITE_LANGUAGE,
  THEME_COLOUR,
  THEME_COLOUR_DARK,
} from './src/utils/constants/constants.js';
import {
  ABOUT_PAGE_URL,
  CLIENT_ONLY_ROUTE_PREFIXES,
  CONTACT_PAGE_URL,
  HOME_PAGE_URL,
} from './src/utils/constants/routes.js';
import { helmetData } from './src/utils/data/helmetData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fills index.html's __SITE_*__ fallback tags from the same data as the home page
const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SITE_HEAD = {
  TITLE: helmetData[HOME_PAGE_URL].title,
  DESCRIPTION: helmetData[HOME_PAGE_URL].desc,
  NAME: CompanyName,
  OG_IMAGE: `${FULL_BUSINESS_URL}/brand/og-default.jpg`,
  LANGUAGE: SITE_LANGUAGE,
  THEME_COLOUR,
  THEME_COLOUR_DARK,
};

const siteHeadDefaults = () => ({
  name: 'site-head-defaults',
  transformIndexHtml: (html) =>
    html.replace(/__SITE_([A-Z_]+)__/g, (match, key) =>
      key in SITE_HEAD ? escapeHtml(SITE_HEAD[key]) : match,
    ),
});

// manifest.json from constants.js: served in dev, written to dist/ at build
const SITE_MANIFEST = JSON.stringify(
  {
    name: CompanyName,
    short_name: CompanyShortName,
    description: helmetData[HOME_PAGE_URL].desc,
    lang: SITE_LANGUAGE,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: THEME_COLOUR,
    background_color: BACKGROUND_COLOUR,
    icons: [
      { src: '/favicon/favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
      { src: '/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcuts: [ABOUT_PAGE_URL, CONTACT_PAGE_URL].map((url) => ({ name: helmetData[url].pageName, url })),
  },
  null,
  2,
);

const siteManifest = () => ({
  name: 'site-manifest',
  configureServer(server) {
    server.middlewares.use('/manifest.json', (req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json');
      res.end(SITE_MANIFEST);
    });
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'manifest.json', source: SITE_MANIFEST });
  },
});

// vite preview behaves like the hosts: <route>.html, the app shell for browser-only pages, else a real 404
const isClientOnly = (pathname) =>
  CLIENT_ONLY_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const hostLikePreview = () => ({
  name: 'host-like-preview',
  configurePreviewServer(server) {
    const dist = path.resolve(__dirname, 'dist');
    const exists = (file) => fs.existsSync(path.join(dist, file));

    server.middlewares.use((req, res, next) => {
      const pathname = decodeURIComponent((req.url || '/').split('?')[0]).replace(/\/+$/, '') || '/';
      if (req.method !== 'GET' || pathname === '/' || path.extname(pathname) || exists(`${pathname}.html`)) return next();

      if (isClientOnly(pathname) && exists('app-shell.html')) {
        req.url = '/app-shell.html';
        return next();
      }
      if (exists('404.html')) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(fs.readFileSync(path.join(dist, '404.html')));
      }
      return next();
    });
  },
});

// Development only: the repo's media/ folder (a copy of the public bucket) at /local-media,
// used when VITE_MEDIA_CDN isn't set (src/utils/media/mediaUrl.js)
const MEDIA_DIR = path.resolve(__dirname, '../media');
const MEDIA_TYPES = { '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

const localMedia = () => ({
  name: 'local-media',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/local-media', (req, res, next) => {
      const file = path.join(MEDIA_DIR, decodeURIComponent((req.url || '').split('?')[0]));
      const type = MEDIA_TYPES[path.extname(file).toLowerCase()];
      if (!type || !file.startsWith(MEDIA_DIR + path.sep) || !fs.existsSync(file)) return next();
      res.setHeader('Content-Type', type);
      fs.createReadStream(file).pipe(res);
    });
  },
});

// A NODE_ENV=development line in a client env file makes vite build ship React's slow development build
const requireProductionBuild = () => ({
  name: 'require-production-build',
  configResolved(config) {
    if (config.command === 'build' && !config.isProduction) {
      throw new Error(
        'vite build is running with NODE_ENV=development, so it would ship React\'s development build. ' +
          'Remove the NODE_ENV line from client/.env.production (Vite sets NODE_ENV itself).',
      );
    }
  },
});

// ANALYZE=true writes dist/stats.html
export default defineConfig({
  plugins: [
    react(),
    requireProductionBuild(),
    siteHeadDefaults(),
    siteManifest(),
    localMedia(),
    hostLikePreview(),
    process.env.ANALYZE &&
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        open: true,
      }),
  ].filter(Boolean),
  server: { port: 5173, open: true },
  // The year the pages are built (and pre-rendered) in: the footer's first render uses it,
  // so hydration matches the pre-rendered text in a later year too
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    sourcemap: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React, React DOM and the router: every page needs them and they change rarely,
          // so they are one chunk that stays cached when the app's own code changes. Not
          // React DOM's server renderer, which only the build's pre-render loads.
          if (/node_modules[\\/]react-dom[\\/](server|cjs[\\/]react-dom-server)/.test(id)) return undefined;
          if (/node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/.test(id)) {
            return 'react';
          }

          // Every other package goes with the code that imports it, so a page downloads only
          // what it uses: axios and react-head with the entry, icons with their pages, and the
          // lazily imported ones (heic2any, exifr, react-ga4, web-vitals) only when needed.
          // Don't manually chunk eager imports (past regression); let Rollup decide the rest.
        },
      },
    },
  },
});
