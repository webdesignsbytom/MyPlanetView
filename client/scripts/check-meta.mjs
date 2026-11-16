// Fails the build when an indexable page's title or description is out of range
import { helmetData } from '../src/utils/data/helmetData.js';
import { PUBLIC_STATIC_ROUTES } from '../src/utils/constants/routes.js';
import { CompanyName } from '../src/utils/constants/constants.js';
import { MAX_TITLE, metaTitle, descriptionProblems } from '../src/utils/seo/metaText.js';
// Country guides
import { COUNTRY_BY_CODE } from '../src/utils/map/countries.js';
import { isCheckedContent } from '../src/utils/countries/countryContent.js';
import { countriesIndexMeta, countryPageMeta } from '../src/utils/countries/countryMeta.js';
import { countryGuideContent, readCountryFiles } from './country-pages.mjs';
// "Where to go in <month>"
import { isMonthPublishable, monthPicks } from '../src/utils/months/monthContent.js';
import { monthPageMeta } from '../src/utils/months/monthMeta.js';
import { readMonthFiles } from './month-pages.mjs';

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

// Month pages (src/content/months/), with the meta their pages print, from the guides a
// build would list (the checked ones). A checked month with problems fails; a draft warns.
// A month the guides can't fill yet isn't built at all (it says so).
const publishedGuides = countryGuideContent({ includeDrafts: false }).map((guide) => ({
  ...guide,
  name: COUNTRY_BY_CODE[guide.code]?.name ?? guide.code,
}));
let monthPages = 0;
for (const { file, content, problems } of readMonthFiles()) {
  const checked = content?.status === 'checked';
  const where = `src/content/months/${file}${checked ? '' : ' (draft)'}`;
  const report = (message) => (checked ? failures : warnings).push(message);
  for (const problem of problems) report(`${where}: ${problem}`);
  if (problems.length) continue;
  const picks = monthPicks(content.month, publishedGuides);
  if (!isMonthPublishable(picks)) {
    warnings.push(`${where}: not built yet: the checked guides give only ${picks.best.length + picks.good.length} countries at their best or good`);
    continue;
  }
  checkMeta(where, monthPageMeta(content, { bestNames: picks.best.map((p) => p.name), goodNames: picks.good.map((p) => p.name) }), report);
  if (checked) {
    monthPages += 1;
    indexable += 1;
  }
}

for (const warning of warnings) console.warn(`⚠️  ${warning}`);
if (failures.length) {
  console.error(`❌ Page meta check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

console.log(`✅ Page meta check passed (${indexable} indexable pages, ${checkedNames.length} of them country guides, ${monthPages} month pages)`);
