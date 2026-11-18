import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
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
  PUBLIC_STATIC_ROUTES,
} from './src/utils/constants/routes.js';
import { helmetData } from './src/utils/data/helmetData.js';
// Country guides: the content files as virtual modules (drafts on the dev server only)
import { countryPagesPlugin, publishedCountryRoutes } from './scripts/country-pages.mjs';
import { monthPagesPlugin, publishedMonthRoutes } from './scripts/month-pages.mjs';

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
    // The app's identity for the installed copy (it stays the same if start_url changes)
    id: '/',
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
      { src: '/favicon/favicon.ico', sizes: '64x64 48x48 32x32 24x24 16x16', type: 'image/x-icon' },
      { src: '/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
      // The logo inside the safe circle, for launchers that crop icons to their own shape
      { src: '/favicon/web-app-manifest-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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

// The service worker (PWA, scripts/sw-template.js): written to dist/sw.js at build only, with
// a build id from the bundle's file names (a new deploy is a new worker, which drops the old
// caches), the browser-only pages it never stores, and what an installed app keeps: the
// public pages (the pre-render's list: prerender.mjs) and every script, stylesheet and font
// of the build (about 1 MB; images are kept as they're shown). Registered by
// src/utils/pwa/registerServiceWorker.js on the live site only.
const siteServiceWorker = () => ({
  name: 'site-service-worker',
  apply: 'build',
  generateBundle(_options, bundle) {
    const build = crypto.createHash('sha256').update(Object.keys(bundle).sort().join('\n')).digest('hex').slice(0, 12);
    const siteCode = Object.keys(bundle)
      // Not the map's detailed outlines (`outline-*`, 2.7 MB), fetched as the map is zoomed in,
      // or the countries' own maps (`countrymap-*`, 7 MB), fetched as one is opened
      .filter(
        (name) =>
          name.startsWith('assets/') &&
          !name.startsWith('assets/outline-') &&
          !name.startsWith('assets/countrymap-') &&
          /\.(js|css|woff2?|ttf)$/.test(name),
      )
      .sort()
      .map((name) => `/${name}`);
    const source = fs
      .readFileSync(path.resolve(__dirname, 'scripts/sw-template.js'), 'utf8')
      .replace('__SW_BUILD__', build)
      .replace("['__SW_CLIENT_ONLY__']", JSON.stringify(CLIENT_ONLY_ROUTE_PREFIXES))
      .replace("['__SW_PUBLIC_PAGES__']", JSON.stringify([...PUBLIC_STATIC_ROUTES, ...publishedCountryRoutes(), ...publishedMonthRoutes()]))
      .replace("['__SW_SITE_CODE__']", JSON.stringify(siteCode));
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
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

// Development only, three of the repo's folders (images only, and videos in seed-videos/;
// nothing outside them):
// - media/ (a copy of the public bucket) at /local-media, used when VITE_MEDIA_CDN isn't
//   set (src/utils/media/mediaUrl.js);
// - seed-photos/ (the real test photos) at /seed-photos, for mock mode's demo photos
//   (src/dev/mock/views.js). The server's seed puts the same photos in the private bucket;
// - seed-videos/ (NASA's clips, downloaded by hand: seed-videos/README.md) at /seed-videos,
//   for mock mode's First Class videos (src/dev/mock/seedFirstClass.js), with range
//   requests so the player can seek, as R2 answers them.
const IMAGE_TYPES = { '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const VIDEO_TYPES = { '.mp4': 'video/mp4', '.mov': 'video/quicktime' };
const LOCAL_FOLDERS = {
  '/local-media': { dir: path.resolve(__dirname, '../media'), types: IMAGE_TYPES },
  '/seed-photos': { dir: path.resolve(__dirname, '../seed-photos'), types: IMAGE_TYPES },
  '/seed-videos': { dir: path.resolve(__dirname, '../seed-videos'), types: { ...IMAGE_TYPES, ...VIDEO_TYPES } },
};

// "bytes=start-end" (either end may be missing) -> { start, end }, or null when it can't be served
function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim());
  if (!match || (!match[1] && !match[2])) return null;
  // "bytes=-500" is the last 500 bytes
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end && start < size ? { start, end } : null;
}

const localMedia = () => ({
  name: 'local-media',
  apply: 'serve',
  configureServer(server) {
    for (const [mount, { dir, types }] of Object.entries(LOCAL_FOLDERS)) {
      server.middlewares.use(mount, (req, res, next) => {
        const file = path.join(dir, decodeURIComponent((req.url || '').split('?')[0]));
        const type = types[path.extname(file).toLowerCase()];
        if (!type || !file.startsWith(dir + path.sep) || !fs.existsSync(file)) return next();
        res.setHeader('Content-Type', type);
        if (!VIDEO_TYPES[path.extname(file).toLowerCase()]) return fs.createReadStream(file).pipe(res);
        // Videos: the whole file, or the part a range asks for
        const { size } = fs.statSync(file);
        res.setHeader('Accept-Ranges', 'bytes');
        if (!req.headers.range) {
          res.setHeader('Content-Length', size);
          return fs.createReadStream(file).pipe(res);
        }
        const range = byteRange(req.headers.range, size);
        if (!range) {
          res.statusCode = 416;
          res.setHeader('Content-Range', `bytes */${size}`);
          return res.end();
        }
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
        res.setHeader('Content-Length', range.end - range.start + 1);
        return fs.createReadStream(file, range).pipe(res);
      });
    }
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
    countryPagesPlugin(),
    // "Where to go in <month>": the checked month files, from the checked guides
    monthPagesPlugin(),
    siteHeadDefaults(),
    siteManifest(),
    siteServiceWorker(),
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
        // The map's detailed outlines, one chunk per place (hooks/useDetailedShapes.js), named
        // so the service worker's list can leave them out
        // and each country's own map (utils/map/countryMapGeo.js), likewise
        chunkFileNames: (chunk) => {
          if (chunk.facadeModuleId && /[\\/]utils[\\/]map[\\/]detailShapes[\\/]/.test(chunk.facadeModuleId)) return 'assets/outline-[name]-[hash].js';
          if (chunk.facadeModuleId && /[\\/]utils[\\/]map[\\/]countryMaps[\\/]/.test(chunk.facadeModuleId)) return 'assets/countrymap-[name]-[hash].js';
          return 'assets/[name]-[hash].js';
        },
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
          // lazily imported ones (exifr, react-ga4, web-vitals) only when needed.
          // Don't manually chunk eager imports (past regression); let Rollup decide the rest.
        },
      },
    },
  },
});
