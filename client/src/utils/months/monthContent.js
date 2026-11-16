// "Where to go in <month>" pages: the content file's format, its checks, and which
// countries a month lists, from the country guides. Pure, and imported by the Node build
// scripts too (relative imports with .js only).
//
// ONE FILE PER MONTH: src/content/months/<slug>.json (january.json … december.json).
// Written for the site by hand, like the country guides: the month's own introduction.
// The countries come from the guides (src/content/countries/), so the page changes when a
// guide does.
//
// {
//   "month": 1,                         1–12
//   "slug": "january",                  the month's name in lower case: /where-to-go/january
//   "status": "draft",                  'draft' | 'checked': only checked pages are built
//   "lastChecked": null,                'YYYY-MM-DD' once checked by hand
//   "summary": "…",                     one sentence: the subtitle and the start of the meta
//                                       description (keep it short: the description adds names)
//   "intro": ["…", "…"]                 1–4 short paragraphs on the month around the world
// }
//
// A month page lists, from the guides that month: the countries rated 'best' (with the
// season's line for that month and its festivals), those rated 'good', and the regions
// whose own strip rates it 'best' where the country's main strip doesn't. It's built only
// with at least MONTH_MIN_COUNTRIES countries rated 'best' or 'good', so no thin page.

export const MONTH_SLUGS = Object.freeze([
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]);
export const MONTH_LABELS = Object.freeze(MONTH_SLUGS.map((slug) => slug[0].toUpperCase() + slug.slice(1)));
export const MONTH_MIN_COUNTRIES = 3;
const STATUSES = ['draft', 'checked'];
const KEYS = ['month', 'slug', 'status', 'lastChecked', 'summary', 'intro'];

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** The problems with a month file, empty when it's fine. */
export function monthContentProblems(content) {
  const problems = [];
  if (!content || typeof content !== 'object' || Array.isArray(content)) return ['not an object'];
  for (const key of Object.keys(content)) if (!KEYS.includes(key)) problems.push(`unknown field "${key}"`);
  if (!Number.isInteger(content.month) || content.month < 1 || content.month > 12) problems.push('month: 1 to 12');
  else if (content.slug !== MONTH_SLUGS[content.month - 1]) problems.push(`slug: should be "${MONTH_SLUGS[content.month - 1]}"`);
  if (!STATUSES.includes(content.status)) problems.push('status: "draft" or "checked"');
  if (content.status === 'checked' && !isDay(content.lastChecked)) problems.push('lastChecked: a date (YYYY-MM-DD) once checked');
  if (content.lastChecked !== null && content.lastChecked !== undefined && !isDay(content.lastChecked)) problems.push('lastChecked: a date or null');
  if (!isText(content.summary)) problems.push('summary: one sentence');
  if (!Array.isArray(content.intro) || content.intro.length < 1 || content.intro.length > 4 || !content.intro.every(isText)) {
    problems.push('intro: 1 to 4 paragraphs');
  }
  return problems;
}

const byName = (a, b) => a.name.localeCompare(b.name);

// The season's line that covers the month, else the weather in words
const seasonLine = (whenToGo, month) =>
  (whenToGo.seasons || []).find((season) => (season.months || []).includes(month))?.text || whenToGo.weather || '';

/**
 * What a month lists, from the guides (`[{ code, slug, name, status, whenToGo }]`):
 * `{ best: [{ code, slug, name, status, season, festivals }], good: [{ code, slug, name,
 * status, season }], regions: [{ code, slug, name, region, text }] }`, each A–Z.
 */
export function monthPicks(month, guides) {
  const at = month - 1;
  const best = [];
  const good = [];
  const regions = [];
  for (const guide of guides) {
    const { whenToGo } = guide;
    const rating = whenToGo?.months?.[at];
    const base = { code: guide.code, slug: guide.slug, name: guide.name, status: guide.status };
    if (rating === 'best') {
      const festivals = (whenToGo.festivals || [])
        .filter((festival) => (festival.months || []).includes(month))
        .map(({ name, when, place }) => ({ name, when, place: place || null }));
      best.push({ ...base, season: seasonLine(whenToGo, month), festivals });
    } else if (rating === 'good') {
      good.push({ ...base, season: seasonLine(whenToGo, month) });
    }
    if (rating !== 'best') {
      for (const region of whenToGo?.regions || []) {
        if (region.months?.[at] === 'best') regions.push({ ...base, region: region.name, text: region.text });
      }
    }
  }
  return { best: best.sort(byName), good: good.sort(byName), regions: regions.sort((a, b) => byName(a, b) || a.region.localeCompare(b.region)) };
}

/** Enough to stand as a page of its own (playbook C1, C10)? */
export const isMonthPublishable = (picks) => picks.best.length + picks.good.length >= MONTH_MIN_COUNTRIES;
