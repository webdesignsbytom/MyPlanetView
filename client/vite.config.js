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
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    sourcemap: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Photo-upload libraries are imported only when someone adds photos: leave them
          // to their own async chunks (heic2any alone is ~1.3 MB; in vendor it would load on
          // every page)
          if (/node_modules[\\/](heic2any|exifr)[\\/]/.test(id)) return undefined;

          // React core in one vendor chunk
          if (id.includes('node_modules')) return 'vendor';

          // Don't manually chunk eager imports (past regression)

          // Let Rollup decide the rest
        },
      },
    },
  },
});
