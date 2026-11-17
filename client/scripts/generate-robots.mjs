import { writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { FULL_BUSINESS_URL as SITE_ORIGIN } from '../src/utils/constants/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Every browser-only page is disallowed: the same list the hosts' rewrites use
// (CLIENT_ONLY_ROUTE_PREFIXES), so a new private page can't be missed here. That's the
// travel app (maps, trips, onboarding, challenges and their join links), share links and
// invites, the account and admin pages, and sign-in, sign-up and the emailed links
const routesFile = resolve(__dirname, '../src/utils/constants/routes.js');
const { CLIENT_ONLY_ROUTE_PREFIXES } = await import(pathToFileURL(routesFile).href);

const disallowedRoutes = [...new Set(CLIENT_ONLY_ROUTE_PREFIXES)];

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
