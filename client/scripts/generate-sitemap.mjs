import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { FULL_BUSINESS_URL as SITE_ORIGIN } from '../src/utils/constants/constants.js';
import {
  PUBLIC_STATIC_ROUTES,
  ROUTE_SITEMAP_META,
} from '../src/utils/constants/routes.js';
// Country guides: checked ones only (none checked: no /countries either)
import { publishedCountrySitemap } from './country-pages.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// lastmod only when it's true (changefreq/priority are ignored by search engines)
const urlEntry = (loc, { lastmod } = {}) => `
  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;

const origin = SITE_ORIGIN.replace(/\/$/, '');

const entries = [
  ...PUBLIC_STATIC_ROUTES.map((route) => ({ route, lastmod: ROUTE_SITEMAP_META[route]?.lastmod })),
  ...publishedCountrySitemap(),
];

const urlsXml = entries.map(({ route, lastmod }) => urlEntry(`${origin}${route}`, { lastmod })).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`;

await writeFile(resolve(__dirname, '../dist/sitemap.xml'), xml, 'utf8');
console.log(`✅ sitemap.xml generated at dist/sitemap.xml (${entries.length} routes)`);
