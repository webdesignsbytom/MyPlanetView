// Fails the build when an indexable page's title or description is out of range
import { helmetData } from '../src/utils/data/helmetData.js';
import { PUBLIC_STATIC_ROUTES } from '../src/utils/constants/routes.js';
import { CompanyName } from '../src/utils/constants/constants.js';
import { MAX_TITLE, metaTitle, descriptionProblems } from '../src/utils/seo/metaText.js';
// Country guides
import { COUNTRY_BY_CODE } from '../src/utils/map/countries.js';
import { isCheckedContent } from '../src/utils/countries/countryContent.js';
import { countriesIndexMeta, countryPageMeta } from '../src/utils/countries/countryMeta.js';
import { readCountryFiles } from './country-pages.mjs';

const failures = [];
const warnings = [];
const seen = new Map();
let indexable = 0;

// Param routes (/reset-password/:userId/:token) and #fragments aren't pages of their own
const isOwnPage = (route) => !route.includes(':') && !route.includes('#') && route !== '*';

for (const route of PUBLIC_STATIC_ROUTES) {
  const entry = helmetData[route];
  if (!entry) failures.push(`${route}: in PUBLIC_STATIC_ROUTES but missing from helmetData`);
  else if (!entry.indexing?.startsWith('index')) failures.push(`${route}: in the sitemap but marked ${entry.indexing}`);
}

// One page's title and description: within the limits, and a description of its own
function checkMeta(where, { title, desc }, report = (message) => failures.push(message)) {
  if (title.length > MAX_TITLE) report(`${where}: title over ${MAX_TITLE} characters (${title.length})`);
  for (const problem of descriptionProblems(desc)) report(`${where}: description ${problem}`);
  if (seen.has(desc)) report(`${where}: same description as ${seen.get(desc)}`);
  else seen.set(desc, where);
}

for (const [route, entry] of Object.entries(helmetData)) {
  if (!isOwnPage(route) || !entry.indexing?.startsWith('index')) continue;
  checkMeta(route, { title: entry.title || metaTitle(entry.pageName, CompanyName), desc: entry.desc });
  indexable += 1;
}

// Country guides (src/content/countries/), with the meta their pages print. A checked page
// fails the build on any problem; a draft only warns, since no build includes it, but its
// problems are what stand between it and being checked.
const checkedNames = [];
for (const { file, content, problems } of readCountryFiles()) {
  const checked = isCheckedContent(content);
  const where = `src/content/countries/${file}${checked ? '' : ' (draft)'}`;
  const report = (message) => (checked ? failures : warnings).push(message);
  for (const problem of problems) report(`${where}: ${problem}`);
  if (problems.length) continue;

  const { name } = COUNTRY_BY_CODE[content.code];
  checkMeta(where, countryPageMeta(content, name), report);
  if (checked) {
    checkedNames.push(name);
    indexable += 1;
  }
}
// The index exists once a guide is checked; it lists them A–Z, as the page does
if (checkedNames.length) {
  checkMeta('/countries', countriesIndexMeta(checkedNames.sort((a, b) => a.localeCompare(b))));
  indexable += 1;
}

for (const warning of warnings) console.warn(`⚠️  ${warning}`);
if (failures.length) {
  console.error(`❌ Page meta check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

console.log(`✅ Page meta check passed (${indexable} indexable pages, ${checkedNames.length} of them country guides)`);
