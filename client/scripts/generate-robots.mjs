import { writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { FULL_BUSINESS_URL as SITE_ORIGIN } from '../src/utils/constants/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Private/admin routes to disallow
const routesFile = resolve(__dirname, '../src/utils/constants/routes.js');
const {
  ADMIN_PAGE_URL,
  ACCOUNT_PAGE_URL,
  MAP_PAGE_URL,
  TRIP_PAGE_URL,
  WELCOME_PAGE_URL,
  SHARED_PAGE_URL,
  INVITE_PAGE_URL,
} = await import(pathToFileURL(routesFile).href);

const base = (route) => route.split('/:')[0];

// The travel app is private: maps (/map also covers /maps/...), trips, onboarding,
// share links and invites
const disallowedRoutes = [
  ADMIN_PAGE_URL,
  ACCOUNT_PAGE_URL,
  MAP_PAGE_URL,
  base(TRIP_PAGE_URL),
  WELCOME_PAGE_URL,
  base(SHARED_PAGE_URL),
  base(INVITE_PAGE_URL),
];

const disallowLines = disallowedRoutes.map((route) => `Disallow: ${route}`).join('\n');

const txt = `# https://www.robotstxt.org/robotstxt.html
# Generated at build time by scripts/generate-robots.mjs — do not edit dist/robots.txt directly.

User-agent: *
Allow: /

${disallowLines}

Sitemap: ${SITE_ORIGIN.replace(/\/$/, '')}/sitemap.xml
`;

await writeFile(resolve(__dirname, '../dist/robots.txt'), txt, 'utf8');
console.log('✅ robots.txt generated at dist/robots.txt');
