// What each little 3D landmark model's card says about its place (24 Nov 2026, the user's wish:
// press a model on a country's map and read about it): a few sentences from the start of its
// English Wikipedia article, and a few facts from the article's Wikidata item (when it was
// built, its height or elevation, its architects). Wikipedia's text is CC BY-SA 4.0, so the card
// names the article and links it and the licence (LandmarkModelCard).
//
// Run from the repo root:   node images/src/tools/model-facts.mjs [--cache <dir>]
//
// For each model (images/src/models/<id>/model.json) the article is, first match wins:
//   1. OVERRIDES below (an article picked by hand);
//   2. the article named as the model is (redirects followed; never a disambiguation page);
//   3. the article named as a part of its name is: the words in its brackets ("Ayutthaya (Wat
//      Phra Si Sanphet)"), before its first comma ("Ruwanwelisaya, Anuradhapura"), or without
//      the brackets or a leading "The" (Wikipedia's search isn't used: it answered 429s from a
//      build script on 24 Nov 2026);
//   4. the article of the landmark the model belongs to (model.json's `landmark` item).
// Steps 2 and 3 count only when the article's Wikidata item has a position near the model's
// spot (MAX_KM, VARIANT_MAX_KM), so "Acre" is never the unit of area; REJECT turns down an
// article found wrong by eye.
//
// It writes client/src/utils/map/landmarkModelFacts.js (generated) and, in the cache folder,
// report.txt: every model with its article and how it was found, to check by eye. The APIs'
// answers are kept in --cache (default: the OS temp folder), so a re-run asks only what's new.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const modelsDir = resolve(root, 'images/src/models');
const outPath = resolve(root, 'client/src/utils/map/landmarkModelFacts.js');

const args = process.argv.slice(2);
const argValue = (name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : null;
};
const cacheDir = resolve(argValue('--cache') || join(os.tmpdir(), 'mpv-model-facts'));

// Articles picked by hand (model id -> English Wikipedia title), from report.txt (24 Nov 2026):
// the model's own building where the name found a battle, a disambiguation page or only the
// landmark's wider site (Philae's landmark is the Nubian Monuments, whose article is Abu Simbel),
// and the models whose name was a disambiguation page and whose landmark's item (a World
// Heritage listing of its own) has no English article. A hand pick still has to be within
// OVERRIDE_MAX_KM of the spot, so a slip of the pen can't bring in the wrong place.
const OVERRIDES = {
  aksum: 'Aksum',
  alamo: 'Alamo Mission in San Antonio',
  aphrodisias: 'Aphrodisias',
  assisi: "Basilica of San Francesco d'Assisi",
  'bali-subak': 'Subak (irrigation)',
  'blue-mosque': 'Sultan Ahmed Mosque',
  'bock-casemates': 'Bock (Luxembourg)',
  bursa: 'Green Mosque, Bursa',
  cartagena: 'Cartagena, Colombia',
  'chain-bridge': 'Széchenyi Chain Bridge',
  cibeles: 'Plaza de Cibeles',
  'cordoba-mezquita': 'Mosque–Cathedral of Córdoba',
  'el-morro': 'Castillo San Felipe del Morro',
  elvas: 'Elvas',
  'grace-bay': 'Providenciales',
  'graz-clock-tower': 'Schlossberg (Graz)',
  guilin: 'Li River',
  hattusa: 'Hattusa',
  'hercules-kassel': 'Hercules monument (Kassel)',
  jelling: 'Jelling stones',
  'kaiping-diaolou': 'Diaolou',
  kamchatka: 'Volcanoes of Kamchatka',
  'kutna-hora': "St. Barbara's Church, Kutná Hora",
  'le-havre': "St. Joseph's Church, Le Havre",
  'little-mermaid': 'The Little Mermaid (statue)',
  'maiden-tower': 'Maiden Tower (Baku)',
  mireuksa: 'Mireuksa',
  moai: 'Ahu Tongariki',
  mulafossur: 'Gásadalur',
  nachi: 'Nachi Falls',
  nikko: 'Nikkō Tōshō-gū',
  'ouro-preto': 'Church of Saint Francis of Assisi (Ouro Preto)',
  paramaribo: 'Paramaribo',
  patmos: 'Monastery of Saint John the Theologian',
  philae: 'Philae',
  pingyao: 'Pingyao',
  'plaza-de-espana': 'Plaza de España (Seville)',
  regensburg: 'Stone Bridge (Regensburg)',
  rhodes: 'Palace of the Grand Master of the Knights of Rhodes',
  roros: 'Røros (town)',
  'sacre-coeur': 'Sacré-Cœur, Paris',
  salamanca: 'New Cathedral of Salamanca',
  samarra: 'Great Mosque of Samarra',
  'san-miguel-de-allende': 'San Miguel de Allende',
  shakhrisyabz: 'Ak-Saray Palace',
  spa: 'Spa, Belgium',
  'st-stephens': "St. Stephen's Cathedral, Vienna",
  'stone-spheres': 'Stone spheres of Costa Rica',
  stralsund: 'Stralsund',
  'svaneti-towers': 'Svan towers',
  toledo: 'Toledo, Spain',
  'trinidad-cuba': 'Trinidad, Cuba',
  trulli: 'Trullo',
  tyre: 'Tyre, Lebanon',
  willemstad: 'Willemstad',
  yogyakarta: 'Yogyakarta',
};
const OVERRIDE_MAX_KM = 400;
// Articles never to use (found wrong in report.txt)
const REJECT = new Set([]);

// How far an article's item may be from the model's spot: the name's own article, then a part's
const MAX_KM = 150;
const VARIANT_MAX_KM = 60;
// The text: whole sentences from the article's start, about this long
const TEXT_MIN = 320;
const TEXT_MAX = 720;

const UA = 'MyPlanetViewModelFacts/1.0 (one-off build script)';
const WIKIPEDIA = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA = 'https://www.wikidata.org/w/api.php';

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

async function request(url, tries = 20) {
  for (let attempt = 1; ; attempt += 1) {
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(45000) });
    } catch (err) {
      if (attempt >= tries) throw err;
      await wait(1000 + 500 * attempt);
      continue;
    }
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < tries) {
      const after = Number(res.headers.get('retry-after'));
      await wait(after > 0 ? after * 1000 : Math.min(60000, 1500 * 2 ** attempt));
      continue;
    }
    throw new Error(`${res.status} for ${url.slice(0, 160)}`);
  }
}

// An API's answer, from the cache when it's been asked before
async function cached(url) {
  const file = join(cacheDir, `${createHash('sha1').update(url).digest('hex')}.json`);
  if (existsSync(file)) return JSON.parse(await readFile(file, 'utf8'));
  const data = await request(url);
  await writeFile(file, JSON.stringify(data));
  return data;
}

const query = (base, params) => `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// ── Wikipedia: titles to their pages ────────────────────────────────────────────────────────

// title asked -> { title, item } of the page it ends on, or null (missing, a disambiguation)
const pageOf = new Map();
async function resolveTitles(titles) {
  const todo = [...new Set(titles)].filter((title) => !pageOf.has(title));
  for (const batch of chunks(todo, 50)) {
    const data = await cached(query(WIKIPEDIA, { action: 'query', redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item|disambiguation', titles: batch.join('|') }));
    const moved = new Map();
    for (const step of [...(data.query?.normalized || []), ...(data.query?.redirects || [])]) moved.set(step.from, step.to);
    const pages = new Map((data.query?.pages || []).map((page) => [page.title, page]));
    for (const title of batch) {
      let at = title;
      for (let hops = 0; moved.has(at) && hops < 5; hops += 1) at = moved.get(at);
      const page = pages.get(at);
      const usable = page && !page.missing && !page.invalid && page.pageprops?.wikibase_item && !('disambiguation' in (page.pageprops || {}));
      pageOf.set(title, usable ? { title: page.title, item: page.pageprops.wikibase_item } : null);
    }
  }
}

// The parts of a name worth trying as an article's title, most particular first
function nameVariants(name) {
  const variants = [];
  const inner = /\(([^()]+)\)/.exec(name)?.[1];
  if (inner) variants.push(inner.trim());
  const bare = name.replace(/\s*\([^()]*\)/g, '').trim();
  if (bare.includes(',')) variants.push(bare.split(',')[0].trim());
  variants.push(bare);
  if (/^the /i.test(bare)) variants.push(bare.slice(4));
  else variants.push(`The ${bare}`);
  return [...new Set(variants)].filter((variant) => variant && variant !== name && variant.length > 2);
}

// The extracts already in the cache's answers, by title, so a re-run whose list of articles has
// changed asks only for the new ones (the batches' addresses shift with the list)
async function cachedExtracts() {
  const byTitle = new Map();
  for (const file of await readdir(cacheDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(await readFile(join(cacheDir, file), 'utf8'));
      for (const page of data?.query?.pages || []) if (page.extract) byTitle.set(page.title, page.extract);
    } catch {
      // not an answer of ours
    }
  }
  return byTitle;
}

async function extracts(titles) {
  const byTitle = await cachedExtracts();
  const todo = [...new Set(titles)].filter((title) => !byTitle.has(title));
  for (const batch of chunks(todo, 20)) {
    // The API gives a batch's extracts in parts, up to a size: ask on until it has no more
    let more = {};
    for (let round = 0; round < 20; round += 1) {
      const data = await cached(
        query(WIKIPEDIA, { action: 'query', prop: 'extracts', exintro: '1', explaintext: '1', exlimit: '20', titles: batch.join('|'), ...more }),
      );
      for (const page of data.query?.pages || []) if (page.extract) byTitle.set(page.title, page.extract);
      if (!data.continue) break;
      more = data.continue;
    }
  }
  return byTitle;
}

// ── Wikidata: items' claims, sitelinks and labels ───────────────────────────────────────────

const entityOf = new Map();
async function loadEntities(ids, props = 'claims|sitelinks') {
  const todo = [...new Set(ids)].filter((id) => id && !entityOf.has(id));
  for (const batch of chunks(todo, 50)) {
    const data = await cached(query(WIKIDATA, { action: 'wbgetentities', ids: batch.join('|'), props, sitefilter: 'enwiki', languages: 'en' }));
    for (const [id, entity] of Object.entries(data.entities || {})) entityOf.set(id, entity);
  }
}

const labelOf = new Map();
async function loadLabels(ids) {
  const todo = [...new Set(ids)].filter((id) => !labelOf.has(id));
  for (const batch of chunks(todo, 50)) {
    const data = await cached(query(WIKIDATA, { action: 'wbgetentities', ids: batch.join('|'), props: 'labels', languages: 'en' }));
    for (const [id, entity] of Object.entries(data.entities || {})) labelOf.set(id, entity.labels?.en?.value || null);
  }
}

// A property's values, best rank first (preferred, then normal; never deprecated)
function values(entity, property) {
  const claims = (entity?.claims?.[property] || []).filter((claim) => claim.rank !== 'deprecated' && claim.mainsnak?.datavalue);
  const preferred = claims.filter((claim) => claim.rank === 'preferred');
  return (preferred.length ? preferred : claims).map((claim) => claim.mainsnak.datavalue.value);
}

function kmBetween(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// How far the item's nearest position is from the model's spot (Infinity: it has none)
const distanceKm = (entity, model) =>
  Math.min(Infinity, ...values(entity, 'P625').filter((at) => at.globe?.endsWith('Q2')).map((at) => kmBetween(at, model)));

// ── The facts ───────────────────────────────────────────────────────────────────────────────

const ordinal = (n) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;
};

// A Wikidata time as people say it: "1859", "AD 80", "2560 BC", "1850s", "13th century"
function whenWords(value) {
  const match = /^([+-])0*(\d+)-/.exec(value?.time || '');
  if (!match) return null;
  const bc = match[1] === '-';
  const year = Number(match[2]);
  if (!year) return null;
  const era = bc ? ' BC' : '';
  if (value.precision >= 9) return bc ? `${year} BC` : year < 1000 ? `AD ${year}` : String(year);
  if (value.precision === 8) return bc ? `${year}s BC` : `${year}s`;
  if (value.precision === 7) return `${ordinal(Math.ceil(year / 100))} century${era}`;
  if (value.precision === 6) return `${ordinal(Math.ceil(year / 1000))} millennium${era}`;
  return null;
}

const METRES_PER = { Q11573: 1, Q3710: 0.3048, Q828224: 1000 };
// A length in metres, or null for a unit we don't know
function metres(value) {
  const per = METRES_PER[String(value?.unit || '').split('/').pop()];
  const amount = Number(value?.amount);
  if (!per || !Number.isFinite(amount) || amount <= 0) return null;
  const m = amount * per;
  return m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
}

// Parentheses that only hold a pronunciation, another script or nothing
// (with one level of brackets inside: "Πάνθειον (Pantheion)")
const ASIDE = /\s*\(((?:[^()]|\([^()]*\))*)\)/g;
// "(Spanish: …)", "(Dutch pronunciation: …)": another language's name, labelled
const LABELLED = /^\s*[A-Z][A-Za-z]*(?: [A-Za-z]+)?:/;
// Nothing left but the labels of pronunciations taken out ("(UK:, US: )", "(, French:, Swedish:)",
// "(, )"), or a respelling, which the extract leaves after a space ("( BLEN-im)")
const emptyAside = (inner) => /^\s/.test(inner) || !inner.replace(/[A-Z][A-Za-z]*(?: [A-Za-z]+)?:/g, '').replace(/[\s,;:]/g, '');
// IPA in square brackets ("[ˈloŋxa]"): anything but plain words ("[temple] of all the gods")
const IPA = /\s*\[([^[\]]*)\]/g;
const PLAIN_WORDS = /^[A-Za-z0-9 .,'’-]*$/;
// A pronunciation, a translation or another script (anything past Latin letters and punctuation)
const UNSAID = /;|pronounc|listen|IPA|lit\.|[^\u0000-ɏḀ-ỿ -⁯]/;
const unsaid = (inner) => emptyAside(inner) || LABELLED.test(inner) || /pronunc/.test(inner) || UNSAID.test(inner);

// What some articles' own unclosed brackets leave behind (24 Nov 2026, the nine report.txt
// showed): "(German: Schweriner Schloss, German pronunciation: also known as …, is",
// "Hall; German: Jahrhunderthalle),", "(Old Norse pronunciation:, …", "Seda; or Llotja"
function tidy(text) {
  let t = text
    .replace(/(?:[A-Z][a-z]+ ){0,2}pronunciation:\s*/g, '')
    .replace(/\(\s*(?:,\s*)+/g, '(')
    .replace(/,\s*\)/g, ')');
  const balanced = (s) => (s.match(/\(/g) || []).length === (s.match(/\)/g) || []).length;
  // A ")" with no "(": the label before it goes ("; German: Jahrhunderthalle)")
  if (!balanced(t)) t = t.replace(/;\s*[A-Z][A-Za-z]*(?: [A-Za-z]+)?:[^();]*\)/g, '');
  // A "(" never closed: up to its first comma goes, the comma kept ("(German: Schweriner Schloss,")
  if (!balanced(t)) t = t.replace(/\s*\((?![^()]*\))[^(),]*,\s*/g, ', ');
  return t.replace(/;\s+or\b/g, ' or');
}

// Whole sentences from the article's start, TEXT_MIN to TEXT_MAX characters where it can
function shortText(extract) {
  // The IPA first, then the asides, again and again: an aside can hold another ("[ˈmɛɦ(ɛ)l]")
  let bare = extract.replace(IPA, (all, inner) => (PLAIN_WORDS.test(inner) ? all : ''));
  for (let before = null; bare !== before; ) {
    before = bare;
    bare = bare.replace(ASIDE, (all, inner) => (unsaid(inner) ? '' : all));
  }
  const clean = tidy(bare)
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([,.;:])/g, '$1')
    .trim();
  const sentences = clean
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z“"‘'(])/));
  let text = '';
  for (const sentence of sentences) {
    if (text.length >= TEXT_MIN) break;
    if (text && text.length + sentence.length + 1 > TEXT_MAX) break;
    text = text ? `${text} ${sentence}` : sentence;
  }
  return text.length > TEXT_MAX + 200 ? `${text.slice(0, TEXT_MAX).replace(/\s+\S*$/, '')}…` : text;
}

function factsOf(entity) {
  const built = values(entity, 'P571').map(whenWords).find(Boolean) || values(entity, 'P1619').map(whenWords).find(Boolean) || null;
  const height = values(entity, 'P2048').map(metres).find(Boolean) || null;
  const elevation = values(entity, 'P2044').map(metres).find(Boolean) || null;
  const architects = values(entity, 'P84')
    .map((value) => value.id)
    .slice(0, 3);
  return { built, height, elevation, architects };
}

// ── The run ─────────────────────────────────────────────────────────────────────────────────

async function readModels() {
  const models = [];
  for (const entry of await readdir(modelsDir, { withFileTypes: true })) {
    const file = join(modelsDir, entry.name, 'model.json');
    if (entry.isDirectory() && existsSync(file)) models.push({ id: entry.name, ...JSON.parse(await readFile(file, 'utf8')) });
  }
  return models.sort((a, b) => a.id.localeCompare(b.id));
}

async function main() {
  await mkdir(cacheDir, { recursive: true });
  const models = await readModels();
  console.log(`${models.length} models; cache ${cacheDir}`);

  // The names' own articles, and the landmarks' items (their articles are the last resort)
  await resolveTitles(models.flatMap((model) => [model.name, OVERRIDES[model.id]].filter(Boolean)));
  await loadEntities([...models.map((model) => model.landmark), ...[...pageOf.values()].filter(Boolean).map((page) => page.item)]);

  const chosen = new Map(); // model id -> { title, item, how }
  const near = (page, model, km) => page && !REJECT.has(page.title) && distanceKm(entityOf.get(page.item), model) <= km;
  const needSearch = [];
  for (const model of models) {
    const override = OVERRIDES[model.id];
    const picked = override ? pageOf.get(override) : null;
    // A hand pick far from the spot is a slip (one with no position at all, a kind of building
    // such as the trullo, is taken as it is)
    const pickedKm = picked ? distanceKm(entityOf.get(picked.item), model) : Infinity;
    if (picked && (pickedKm <= OVERRIDE_MAX_KM || pickedKm === Infinity)) {
      chosen.set(model.id, { ...picked, how: 'override' });
      continue;
    }
    if (override) console.warn(`OVERRIDES: “${override}” for ${model.id} ${picked ? `is ${Math.round(pickedKm)} km away` : 'isn’t an article'}`);
    const page = pageOf.get(model.name);
    if (near(page, model, MAX_KM)) chosen.set(model.id, { ...page, how: 'name' });
    else needSearch.push(model);
  }

  // The rest: a part of the name, near the spot
  const tries = new Map(needSearch.map((model) => [model.id, nameVariants(model.name)]));
  await resolveTitles([...tries.values()].flat());
  await loadEntities([...tries.values()].flat().map((title) => pageOf.get(title)?.item));
  for (const model of needSearch) {
    const page = tries.get(model.id).map((title) => pageOf.get(title)).find((hit) => near(hit, model, VARIANT_MAX_KM));
    if (page) {
      chosen.set(model.id, { ...page, how: 'part' });
      continue;
    }
    // The landmark's own article
    const title = entityOf.get(model.landmark)?.sitelinks?.enwiki?.title;
    if (title && !REJECT.has(title)) chosen.set(model.id, { title, item: model.landmark, how: 'landmark' });
  }

  const texts = await extracts([...chosen.values()].map((page) => page.title));
  await loadEntities([...chosen.values()].map((page) => page.item));
  const facts = new Map([...chosen].map(([id, page]) => [id, factsOf(entityOf.get(page.item))]));
  await loadLabels([...facts.values()].flatMap((fact) => fact.architects));

  const entries = [];
  const report = [];
  for (const model of models) {
    const page = chosen.get(model.id);
    const text = page && texts.get(page.title) ? shortText(texts.get(page.title)) : '';
    if (!page || !text) {
      report.push(`NONE      ${model.id}  (${model.name})`);
      continue;
    }
    const fact = facts.get(model.id);
    const entry = { article: page.title, text };
    if (fact.built) entry.built = fact.built;
    if (fact.height) entry.height = fact.height;
    else if (fact.elevation) entry.elevation = fact.elevation;
    const architects = fact.architects.map((id) => labelOf.get(id)).filter(Boolean);
    if (architects.length) entry.architects = architects;
    entries.push([model.id, entry]);
    report.push(`${page.how.padEnd(9)} ${model.id}  (${model.name})  ->  ${page.title}`);
  }

  const lines = entries.map(([id, entry]) => `  ${JSON.stringify(id)}: ${JSON.stringify(entry)},`);
  const file = `// Generated by images/src/tools/model-facts.mjs from English Wikipedia and Wikidata. Don't edit
// by hand: change the tool's OVERRIDES or REJECT, then run it again.
//
// What each little 3D landmark model's card says (components/countryMap/LandmarkModelCard.jsx),
// by model id: \`article\`, the English Wikipedia article (its title); \`text\`, whole sentences
// from its start (CC BY-SA 4.0: the card credits the article and the licence); and from its
// Wikidata item, when known, \`built\` (its inception, often when building began: "1843", "13th century"; the card says "Dates from"), \`height\` or
// \`elevation\` in metres, and \`architects\`. Its own chunk, loaded when a card first opens.
export const TEXT_LICENCE = ['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'];

export const MODEL_FACTS = {
${lines.join('\n')}
};
`;
  await writeFile(outPath, file);
  await writeFile(join(cacheDir, 'report.txt'), `${report.join('\n')}\n`);
  const count = (how) => report.filter((line) => line.startsWith(how)).length;
  console.log(
    `Wrote ${entries.length} of ${models.length}: ${count('name')} by name, ${count('part')} by part of it, ${count('landmark')} the landmark's, ${count('override')} by hand, ${count('NONE')} none.`,
  );
  console.log(`Check ${join(cacheDir, 'report.txt')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
