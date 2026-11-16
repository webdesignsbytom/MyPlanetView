// The checks a country content file must pass (format: countryContent.js). Run by the
// build scripts only (scripts/country-pages.mjs: check-meta, the Vite plugin), so the
// pages' code never carries the country list.
import { COUNTRY_BY_CODE } from '../map/countries.js';
import { CONTENT_STATUSES, FACT_FIELDS, RATINGS } from './countryContent.js';

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isDay = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const isMonthNumbers = (value) =>
  Array.isArray(value) && value.length > 0 && value.every((n) => Number.isInteger(n) && n >= 1 && n <= 12);
const isRatings = (value) => Array.isArray(value) && value.length === 12 && value.every((r) => RATINGS.includes(r));

const TOP_KEYS = ['code', 'slug', 'status', 'lastChecked', 'stamp', 'summary', 'overview', 'whenToGo', 'culture', 'facts'];
const WHEN_KEYS = ['stripLabel', 'months', 'seasons', 'weather', 'festivals', 'regions'];
const CULTURE_KEYS = ['greetings', 'etiquette', 'tipping', 'dress', 'food', 'phrases'];

function unknownKeys(where, value, allowed, problems) {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) if (!allowed.includes(key)) problems.push(`${where}: unknown field "${key}"`);
}

function listProblems(where, list, check, problems, { min = 1 } = {}) {
  if (!Array.isArray(list) || list.length < min) {
    problems.push(`${where}: needs at least ${min} item(s)`);
    return;
  }
  list.forEach((item, index) => check(item, `${where}[${index}]`));
}

// Everything wrong with one content file, as readable lines ([] when it's fine)
export function countryContentProblems(content) {
  const problems = [];
  if (!content || typeof content !== 'object') return ['not an object'];
  const need = (ok, message) => {
    if (!ok) problems.push(message);
  };
  unknownKeys('top level', content, TOP_KEYS, problems);

  const country = COUNTRY_BY_CODE[content.code];
  need(country, `code "${content.code}" isn't in utils/map/countries.js`);
  if (country) need(content.slug === country.slug, `slug "${content.slug}" should be "${country.slug}" (utils/map/countries.js)`);
  need(CONTENT_STATUSES.includes(content.status), `status must be one of ${CONTENT_STATUSES.join(', ')}`);
  if (content.status === 'checked') need(isDay(content.lastChecked), 'a checked page needs lastChecked (YYYY-MM-DD)');
  else need(content.lastChecked === null || isDay(content.lastChecked), 'lastChecked must be null or YYYY-MM-DD');

  need(
    Array.isArray(content.stamp) && content.stamp.length >= 1 && content.stamp.length <= 3 && content.stamp.every((line) => isText(line) && line.length <= 14),
    'stamp: 1–3 lines of up to 14 characters',
  );
  need(isText(content.summary), 'summary is missing');
  need(
    Array.isArray(content.overview) && content.overview.length >= 1 && content.overview.length <= 4 && content.overview.every(isText),
    'overview: 1–4 paragraphs',
  );

  const when = content.whenToGo || {};
  unknownKeys('whenToGo', when, WHEN_KEYS, problems);
  need(when.stripLabel === undefined || isText(when.stripLabel), 'whenToGo.stripLabel must be text');
  need(isRatings(when.months), `whenToGo.months: 12 ratings (${RATINGS.join(', ')}), January first`);
  need(isText(when.weather), 'whenToGo.weather is missing');
  listProblems('whenToGo.seasons', when.seasons, (season, where) => {
    need(isText(season?.name) && isText(season?.text), `${where}: needs name and text`);
    need(isMonthNumbers(season?.months), `${where}: months must be month numbers 1–12`);
  }, problems, { min: 2 });
  listProblems('whenToGo.festivals', when.festivals, (festival, where) => {
    need(isText(festival?.name) && isText(festival?.when) && isText(festival?.text), `${where}: needs name, when and text`);
    need(festival?.place === undefined || isText(festival.place), `${where}: place must be text`);
    need(isMonthNumbers(festival?.months), `${where}: months must be month numbers 1–12`);
  }, problems);
  listProblems('whenToGo.regions', when.regions ?? [], (region, where) => {
    need(isText(region?.name) && isText(region?.text), `${where}: needs name and text`);
    need(region?.months === undefined || isRatings(region.months), `${where}: months must be 12 ratings`);
  }, problems, { min: 0 });

  const culture = content.culture || {};
  unknownKeys('culture', culture, CULTURE_KEYS, problems);
  for (const key of ['greetings', 'tipping', 'dress']) need(isText(culture[key]), `culture.${key} is missing`);
  need(Array.isArray(culture.etiquette) && culture.etiquette.length > 0 && culture.etiquette.every(isText), 'culture.etiquette: at least one line');
  listProblems('culture.food', culture.food, (dish, where) => need(isText(dish?.name) && isText(dish?.text), `${where}: needs name and text`), problems);
  need(isText(culture.phrases?.language), 'culture.phrases.language is missing');
  listProblems('culture.phrases.items', culture.phrases?.items, (item, where) => {
    need(isText(item?.phrase) && isText(item?.meaning), `${where}: needs phrase and meaning`);
    need(item?.say === undefined || isText(item.say), `${where}: say must be text`);
  }, problems);

  const facts = content.facts || {};
  need(/^Q\d+$/.test(String(facts.wikidata || '')), 'facts.wikidata: the country\'s Wikidata item (Q…)');
  need(isDay(facts.queried), 'facts.queried: the date the Wikidata query was run (YYYY-MM-DD)');
  const items = Array.isArray(facts.items) ? facts.items : [];
  for (const field of FACT_FIELDS) {
    const found = items.filter((item) => item?.key === field.key);
    if (found.length !== 1) {
      problems.push(`facts.items: needs one "${field.key}" (found ${found.length})`);
      continue;
    }
    const [item] = found;
    need(isText(item.text), `facts ${field.key}: text is missing`);
    need(Array.isArray(item.sources) && item.sources.length > 0, `facts ${field.key}: sources are missing`);
    for (const source of item.sources || []) {
      need(field.properties.includes(source?.property), `facts ${field.key}: property ${source?.property} isn't one of ${field.properties.join(', ')}`);
      need(Array.isArray(source?.values) && source.values.length > 0 && source.values.every(isText), `facts ${field.key}: ${source?.property} needs its values`);
    }
  }
  for (const item of items) {
    if (!FACT_FIELDS.some((field) => field.key === item?.key)) problems.push(`facts.items: unknown key "${item?.key}"`);
  }

  return problems;
}
