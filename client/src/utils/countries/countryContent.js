// The country pages' content: its format, the checks it must pass, and the month helpers.
// Pure, and imported by the Node build scripts too (relative imports with .js only).
//
// ONE FILE PER COUNTRY: src/content/countries/<code>.json (lower-case ISO code, es.json).
// Written for the site by hand (drafted, then checked line by line): never text copied
// from Wikipedia or Wikivoyage, which is CC BY-SA. Practical facts come from Wikidata
// (CC0), with the items they rest on, so a later check can repeat the query.
//
// {
//   "code": "ES",                       ISO code, as in utils/map/countries.js
//   "slug": "spain",                    the country's slug there: /countries/spain
//   "status": "draft",                  'draft' | 'checked': only checked pages are built,
//                                       linked, listed and in the sitemap
//   "lastChecked": null,                'YYYY-MM-DD' once checked by hand (shown on the page)
//   "stamp": ["¡Hola!", "España"],      1–3 short words on the headline's rubber stamp
//   "summary": "…",                     one sentence of its own (the subtitle, and the start
//                                       of the meta description)
//   "overview": ["…", "…"],             1–4 short paragraphs
//   "whenToGo": {
//     "stripLabel": "…",                optional: what the month strip covers, when a
//                                       country's regions differ a lot (USA)
//     "months": ["good", … 12],         January to December: 'best' | 'good' | 'avoid'
//     "seasons": [{ "name", "months": [3, 4, 5], "text" }],   a line per season
//     "weather": "…",                   the weather in words
//     "festivals": [{ "name", "place"?, "when", "months": [3], "text" }],
//                                       "when" in words; dates that move say "usually"
//     "regions": [{ "name", "text", "months"? }]   how regions differ; "months" (12
//                                       ratings) draws a strip of the region's own
//   },
//   "culture": {
//     "greetings": "…", "etiquette": ["…"], "tipping": "…", "dress": "…",
//     "food": [{ "name", "text" }],
//     "phrases": { "language", "intro"?, "items": [{ "phrase", "say"?, "meaning" }] }
//   },
//   "facts": {
//     "wikidata": "Q29",                the country's Wikidata item
//     "queried": "2026-11-16",          when the query below was run
//     "items": [{ "key", "text", "sources": [{ "property": "P38", "values": ["Q4916"] }],
//                 "note"? }]            one per FACT_FIELDS key; "text" is what the page
//                                       says; "note" records where it departs from Wikidata
//   }
// }
//
// The query (https://query.wikidata.org/sparql, any generic User-Agent), per country:
//   SELECT ?propId ?value ?valueLabel ?rank ?end WHERE {
//     VALUES (?p ?ps ?propId) { (p:P38 ps:P38 "P38") (p:P37 ps:P37 "P37") … }
//     wd:Q29 ?p ?st . ?st ?ps ?value ; wikibase:rank ?rank .
//     OPTIONAL { ?st pq:P582 ?end }
//     SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }
// When query.wikidata.org doesn't answer, the wbgetentities API gives the same statements
// with their ranks and end dates (P582): www.wikidata.org/w/api.php?action=wbgetentities
// &ids=Q142|Q38&props=claims (the first 20's facts were read this way, 16 Nov 2026).
//
// The checks a file must pass are in countryContentChecks.js (the build scripts run them).

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3));

// How a month rates for a general traveller (the legend on the page says the same)
export const RATINGS = ['best', 'good', 'avoid'];
export const RATING_LABELS = { best: 'Best', good: 'Good', avoid: 'Avoid' };
export const RATING_MEANINGS = {
  best: 'The most pleasant weather for sightseeing and being outdoors.',
  good: 'Fine for a visit, with a catch (heat, rain, cold or crowds) named below.',
  avoid: 'Most visitors would find it hard going: extreme heat, storms or much of it closed.',
};

// The practical facts, in the order shown, and the Wikidata properties each may rest on
export const FACT_FIELDS = [
  { key: 'currency', label: 'Currency', properties: ['P38'] },
  { key: 'languages', label: 'Languages', properties: ['P37'] },
  { key: 'plugs', label: 'Plugs and voltage', properties: ['P2853', 'P2884'] },
  { key: 'driving', label: 'Driving', properties: ['P1622'] },
  { key: 'timeZones', label: 'Time', properties: ['P421'] },
  { key: 'emergency', label: 'Emergency number', properties: ['P2852'] },
  { key: 'callingCode', label: 'Calling code', properties: ['P474'] },
];

export const CONTENT_STATUSES = ['draft', 'checked'];
export const isCheckedContent = (content) => content?.status === 'checked';

// --- Months -------------------------------------------------------------------------

// Runs of consecutive months (0–11) for which keep(value, index) is true, wrapping over
// the new year (December to February is one run), in calendar order of their first month
export function monthRuns(values, keep) {
  const on = values.map((value, index) => Boolean(keep(value, index)));
  if (on.every(Boolean)) return [[0, 11]];
  const firstOff = on.indexOf(false);
  if (firstOff < 0 || !on.some(Boolean)) return [];

  // Start just after a month that's off, so a run over the new year isn't split
  const runs = [];
  let start = null;
  for (let step = 1; step <= 12; step++) {
    const index = (firstOff + step) % 12;
    if (on[index] && start === null) start = index;
    if (!on[index] && start !== null) {
      runs.push([start, (index + 11) % 12]);
      start = null;
    }
  }
  return runs.sort((a, b) => a[0] - b[0]);
}

const joinWords = (parts) =>
  parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] || '';

// "April to June and September to October" (short: "Apr–Jun, Sep–Oct")
export function formatMonthRuns(runs, { short = false } = {}) {
  const names = short ? MONTH_SHORT : MONTH_NAMES;
  const parts = runs.map(([start, end]) => {
    if (start === end) return names[start];
    if (start === 0 && end === 11) return short ? 'All year' : 'all year round';
    return short ? `${names[start]}–${names[end]}` : `${names[start]} to ${names[end]}`;
  });
  return short ? parts.join(', ') : joinWords(parts);
}

// The months given one rating, in words ('' when none has it)
export const monthsRatedText = (months, wanted, options) =>
  formatMonthRuns(monthRuns(months, (rating) => rating === wanted), options);
export const bestMonthsText = (months, options) => monthsRatedText(months, 'best', options);

// Month numbers (1–12) in words: [12, 1, 2] -> "December to February"
export function monthNumbersText(numbers, options) {
  const wanted = new Set(numbers);
  return formatMonthRuns(monthRuns(MONTH_NAMES, (_, index) => wanted.has(index + 1)), options);
}

// '2026-11-16' -> '16 November 2026' (no Date or Intl: the same text at build and in the
// browser, so the pre-rendered page hydrates)
export function formatDay(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ''));
  if (!match) return '';
  return `${Number(match[3])} ${MONTH_NAMES[Number(match[2]) - 1]} ${match[1]}`;
}
