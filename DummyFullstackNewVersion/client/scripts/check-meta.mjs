// Fails the build when an indexable page's title or description is out of range
import { helmetData } from '../src/utils/data/helmetData.js';
import { PUBLIC_STATIC_ROUTES } from '../src/utils/constants/routes.js';
import { CompanyName } from '../src/utils/constants/constants.js';
import { MAX_TITLE, metaTitle, descriptionProblems } from '../src/utils/seo/metaText.js';

const failures = [];
const seen = new Map();

// Param routes (/reset-password/:userId/:token) and #fragments aren't pages of their own
const isOwnPage = (route) => !route.includes(':') && !route.includes('#') && route !== '*';

for (const route of PUBLIC_STATIC_ROUTES) {
  const entry = helmetData[route];
  if (!entry) failures.push(`${route}: in PUBLIC_STATIC_ROUTES but missing from helmetData`);
  else if (!entry.indexing?.startsWith('index')) failures.push(`${route}: in the sitemap but marked ${entry.indexing}`);
}

for (const [route, entry] of Object.entries(helmetData)) {
  if (!isOwnPage(route) || !entry.indexing?.startsWith('index')) continue;

  const title = entry.title || metaTitle(entry.pageName, CompanyName);
  if (title.length > MAX_TITLE) failures.push(`${route}: title over ${MAX_TITLE} characters (${title.length})`);

  for (const problem of descriptionProblems(entry.desc)) failures.push(`${route}: description ${problem}`);

  if (seen.has(entry.desc)) failures.push(`${route}: same description as ${seen.get(entry.desc)}`);
  else seen.set(entry.desc, route);
}

if (failures.length) {
  console.error(`❌ Page meta check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

console.log(`✅ Page meta check passed (${seen.size} indexable pages)`);
