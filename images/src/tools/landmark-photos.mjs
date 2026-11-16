// A photo for every landmark, from Wikimedia Commons, for the country ticket's landmark
// list (client/src/components/map/CountryLandmarks.jsx).
//
// Run from the repo root:   node images/src/tools/landmark-photos.mjs [--cache <dir>] [--only slug,slug] [--refresh]
//
// For each landmark in server/prisma/seed/data/landmarks.js and landmarksUnesco.js (keyed
// by slug, made as the seed makes it), it picks a file, first match wins:
//   1. OVERRIDES below (picked by hand where the automatic one was poor);
//   2. the landmark's Wikidata item's image (P18);
//   3. for a UNESCO line with "site Q…" (a part standing in for a serial site), that
//      site's image;
//   4. the item's (then the site's) aerial view (P8592);
//   5. the lead image of the item's (then the site's) English Wikipedia article, free
//      licences only (PageImages, pilicense=free).
// A file counts only if Commons has it as a JPEG, PNG, TIFF or WebP at least 400 px wide,
// under a free licence we can credit (CC, CC0, public domain), and its name isn't a map,
// plan, logo or flag.
//
// It writes, and touches nothing else:
//   - media/landmarkPhotos/<slug>-<width>.avif and .webp (480 px wide at most, 640 tall),
//     the copy of the public bucket's landmarkPhotos/ folder (upload it there);
//   - client/src/utils/map/landmarkPhotos.js, the credits (author, licence, Commons file)
//     the client shows with each photo.
// A landmark already in that file whose images exist keeps its pick (so a re-run only
// fills gaps); --only redoes the slugs given, --refresh redoes them all. Downloads are
// cached in --cache (default: the OS temp folder), and so are the APIs' answers
// (wikidata.json, lead.json, commons.json there): delete those for fresh ones.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const dataDir = resolve(root, 'server/prisma/seed/data');
const outDir = resolve(root, 'media/landmarkPhotos');
const manifestPath = resolve(root, 'client/src/utils/map/landmarkPhotos.js');

const args = process.argv.slice(2);
const argValue = (name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : null;
};
const cacheDir = resolve(argValue('--cache') || join(os.tmpdir(), 'mpv-landmark-photos'));
const only = new Set((argValue('--only') || '').split(',').filter(Boolean));
const refresh = args.includes('--refresh');

// Hand-picked files (slug -> Commons file name), where the automatic pick was a poor
// photo of the place
const OVERRIDES = {};

const MAX_WIDTH = 480;
const MAX_HEIGHT = 640;
const FETCH_WIDTH = 960; // one of Commons' standard thumbnail widths
const UA = 'MyPlanetViewLandmarkPhotos/1.0 (one-off build script)';
const OK_TYPES = new Set(['image/jpeg', 'image/png', 'image/tiff', 'image/webp']);
const NOT_A_PHOTO = /\b(map|karte|carte|mapa|mappa|location|locator|plan|grundriss|logo|flag|coat[ _]of[ _]arms|wappen|diagram|scheme|sketch)\b/i;
const FREE_LICENCE = /^(cc[ -]|cc0|public domain|pd\b|pd-)/i;

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// Wikimedia's API hosts sometimes drop the connection from here (about half the time
// on 16 Nov 2026, every edge alike), so a failed connection is simply tried again
async function request(url, { body, accept = 'application/json', tries = 20 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: {
          'User-Agent': UA,
          Accept: accept,
          ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
        body,
        signal: AbortSignal.timeout(45000),
      });
    } catch (err) {
      if (attempt >= tries) throw err;
      await wait(1000 + 500 * attempt);
      continue;
    }
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < tries) {
      const after = Number(res.headers.get('retry-after'));
      await wait(after > 0 ? after * 1000 : Math.min(60000, 1500 * 2 ** attempt));
      continue;
    }
    throw new Error(`${res.status} for ${url.slice(0, 160)}`);
  }
}

const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// Run `work` over `items`, `limit` at a time
async function eachLimited(items, limit, work) {
  let next = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await work(item);
    }
  });
  await Promise.all(runners);
}

const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// "Special:FilePath/Foo%20bar.jpg" -> "Foo bar.jpg"
const fileFromPath = (url) => decodeURIComponent(url.split('/Special:FilePath/')[1] || '').replace(/_/g, ' ');

const plainText = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();

const shorten = (text, max = 100) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

// ---------------------------------------------------------------------------------------
// The landmarks, as the seed stores them

async function loadLandmarks() {
  const { LANDMARKS } = await import(pathToFileURL(resolve(dataDir, 'landmarks.js')).href);
  const { UNESCO_LANDMARKS } = await import(pathToFileURL(resolve(dataDir, 'landmarksUnesco.js')).href);
  // "wikidataId: 'Q…' … // WHS 569, 2005; site Q3664670" -> the inscription's own item
  const siteOf = new Map();
  const text = await readFile(resolve(dataDir, 'landmarksUnesco.js'), 'utf8');
  for (const line of text.split('\n')) {
    const item = line.match(/wikidataId: '(Q\d+)'/);
    const site = line.match(/\/\/.*\bsite (Q\d+)/);
    if (item && site) siteOf.set(item[1], site[1]);
  }
  return [...LANDMARKS, ...UNESCO_LANDMARKS].map((landmark) => ({
    slug: slugify(landmark.name),
    name: landmark.name,
    item: landmark.wikidataId,
    site: siteOf.get(landmark.wikidataId) || null,
  }));
}

async function loadManifest() {
  if (!existsSync(manifestPath)) return { LICENCES: [], LANDMARK_PHOTOS: {} };
  return import(`${pathToFileURL(manifestPath).href}?t=${Date.now()}`);
}

// The APIs' answers, kept in the cache folder (one JSON file per kind), so a re-run asks
// only for what it hasn't got
async function loadStore(name) {
  const path = join(cacheDir, `${name}.json`);
  const data = existsSync(path) ? JSON.parse(await readFile(path, 'utf8')) : {};
  return { data, save: () => writeFile(path, JSON.stringify(data)) };
}

// ---------------------------------------------------------------------------------------
// Wikidata: images, aerial views and English Wikipedia articles

async function wikidataFacts(items, store) {
  const asked = items.filter((item) => !(item in store.data));
  for (const batch of chunks(asked, 250)) {
    const facts = new Map(batch.map((item) => [item, { images: [], aerial: [], article: null }]));
    const query = `SELECT ?item ?image ?aerial ?article WHERE {
      VALUES ?item { ${batch.map((q) => `wd:${q}`).join(' ')} }
      OPTIONAL { ?item wdt:P18 ?image }
      OPTIONAL { ?item wdt:P8592 ?aerial }
      OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
    }`;
    const res = await request('https://query.wikidata.org/sparql', {
      body: new URLSearchParams({ query }).toString(),
      accept: 'application/sparql-results+json',
    });
    const json = await res.json();
    for (const row of json.results.bindings) {
      const fact = facts.get(row.item.value.split('/').pop());
      if (!fact) continue;
      const image = row.image && fileFromPath(row.image.value);
      const aerial = row.aerial && fileFromPath(row.aerial.value);
      if (image && !fact.images.includes(image)) fact.images.push(image);
      if (aerial && !fact.aerial.includes(aerial)) fact.aerial.push(aerial);
      if (row.article) fact.article = decodeURIComponent(row.article.value.split('/wiki/')[1]).replace(/_/g, ' ');
    }
    for (const [item, fact] of facts) store.data[item] = fact;
    await store.save();
    await wait(500);
  }
  return new Map(items.map((item) => [item, store.data[item]]));
}

// English Wikipedia's lead image per article (free licences only)
async function leadImages(titles, store) {
  const asked = titles.filter((title) => !(title in store.data));
  for (const batch of chunks(asked, 50)) {
    const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      prop: 'pageimages',
      piprop: 'name',
      pilicense: 'free',
      redirects: '1',
      format: 'json',
      formatversion: '2',
      titles: batch.join('|'),
    })}`;
    const json = await (await request(url)).json();
    const renamed = new Map();
    for (const step of [...(json.query?.normalized || []), ...(json.query?.redirects || [])]) renamed.set(step.from, step.to);
    const byTitle = new Map((json.query?.pages || []).map((page) => [page.title, page.pageimage]));
    for (const title of batch) {
      let at = title;
      for (let hops = 0; renamed.has(at) && hops < 3; hops += 1) at = renamed.get(at);
      const image = byTitle.get(at);
      store.data[title] = image ? image.replace(/_/g, ' ') : null;
    }
    await store.save();
    await wait(300);
  }
  return new Map(titles.filter((title) => store.data[title]).map((title) => [title, store.data[title]]));
}

// ---------------------------------------------------------------------------------------
// Commons: type, size, licence, author and a thumbnail URL per file

async function fileInfo(files, store) {
  const asked = files.filter((file) => !(file in store.data));
  let done = 0;
  for (const batch of chunks(asked, 50)) {
    const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|mime|size|extmetadata',
      iiurlwidth: String(FETCH_WIDTH),
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|AttributionRequired',
      format: 'json',
      formatversion: '2',
      titles: batch.map((file) => `File:${file}`).join('|'),
    })}`;
    const json = await (await request(url)).json();
    const renamed = new Map((json.query?.normalized || []).map((step) => [step.from, step.to]));
    const byTitle = new Map((json.query?.pages || []).map((page) => [page.title, page]));
    for (const file of batch) {
      const title = renamed.get(`File:${file}`) || `File:${file}`;
      const page = byTitle.get(title);
      const ii = page && !page.missing && page.imageinfo?.[0];
      if (!ii) {
        store.data[file] = null;
        continue;
      }
      const meta = ii.extmetadata || {};
      const author = plainText(meta.Artist?.value) || plainText(meta.Credit?.value) || 'Unknown author';
      store.data[file] = {
        file: title.replace(/^File:/, ''),
        mime: ii.mime,
        width: ii.width,
        height: ii.height,
        thumb: ii.thumburl || ii.url,
        licence: plainText(meta.LicenseShortName?.value),
        licenceUrl: (meta.LicenseUrl?.value || '').replace(/^http:/, 'https:'),
        author: shorten(author),
      };
    }
    await store.save();
    done += batch.length;
    if (done % 500 < 50) console.log(`  ${done} of ${asked.length} files checked`);
    await wait(300);
  }
  return new Map(files.filter((file) => store.data[file]).map((file) => [file, store.data[file]]));
}

const usable = (info) =>
  info &&
  OK_TYPES.has(info.mime) &&
  info.width >= 400 &&
  FREE_LICENCE.test(info.licence) &&
  !NOT_A_PHOTO.test(info.file.replace(/[_-]/g, ' '));

// ---------------------------------------------------------------------------------------

async function main() {
  const landmarks = await loadLandmarks();
  const manifest = await loadManifest();
  const kept = new Map();
  for (const landmark of landmarks) {
    const entry = manifest.LANDMARK_PHOTOS[landmark.slug];
    if (!entry || refresh || only.has(landmark.slug) || OVERRIDES[landmark.slug]) continue;
    const [width, , , licenceAt, file] = entry;
    const name = `${landmark.slug}-${width}`;
    if (existsSync(join(outDir, `${name}.avif`)) && existsSync(join(outDir, `${name}.webp`))) {
      kept.set(landmark.slug, { entry, licence: manifest.LICENCES[licenceAt], file });
    }
  }
  const todo = landmarks.filter((landmark) => !kept.has(landmark.slug));
  console.log(`${landmarks.length} landmarks: ${kept.size} kept, ${todo.length} to find`);

  // Candidates per landmark, in order of preference: Wikidata's images first; then, for the
  // landmarks none of those suit, the English Wikipedia articles' lead images
  await mkdir(cacheDir, { recursive: true });
  const items = [...new Set(todo.flatMap((landmark) => [landmark.item, landmark.site].filter(Boolean)))];
  const facts = await wikidataFacts(items, await loadStore('wikidata'));
  console.log(`wikidata: ${items.length} items`);
  const none = { images: [], aerial: [], article: null };
  const commons = await loadStore('commons');
  const picks = new Map();
  const pickFrom = async (lists) => {
    const files = [...new Set([...lists.values()].flat())];
    const info = await fileInfo(files, commons);
    for (const [slug, list] of lists) {
      const pick = list.map((file) => info.get(file)).find(usable);
      if (pick) picks.set(slug, pick);
    }
  };

  const first = new Map();
  for (const landmark of todo) {
    const own = facts.get(landmark.item) || none;
    const site = (landmark.site && facts.get(landmark.site)) || none;
    const list = [OVERRIDES[landmark.slug], ...own.images, ...site.images, ...own.aerial, ...site.aerial].filter(Boolean);
    first.set(landmark.slug, [...new Set(list)]);
  }
  await pickFrom(first);
  console.log(`from Wikidata: ${picks.size} of ${todo.length}`);

  const left = todo.filter((landmark) => !picks.has(landmark.slug));
  const articleOf = (q) => (q && (facts.get(q) || none).article) || null;
  const titles = [...new Set(left.flatMap((landmark) => [articleOf(landmark.item), articleOf(landmark.site)]).filter(Boolean))];
  const lead = await leadImages(titles, await loadStore('lead'));
  const second = new Map(
    left.map((landmark) => [
      landmark.slug,
      [...new Set([articleOf(landmark.item), articleOf(landmark.site)].map((title) => title && lead.get(title)).filter(Boolean))],
    ]),
  );
  await pickFrom(second);
  const missing = todo
    .filter((landmark) => !picks.has(landmark.slug))
    .map((landmark) => `${landmark.slug} (${landmark.item}${landmark.site ? `, site ${landmark.site}` : ''})`);
  console.log(`with Wikipedia's lead images: ${picks.size}, none found for ${missing.length}`);

  // Download and convert
  await mkdir(outDir, { recursive: true });
  const made = new Map();
  const failed = [];
  let done = 0;
  await eachLimited([...picks], 3, async ([slug, pick]) => {
    try {
      const cached = join(cacheDir, `${createHash('sha1').update(pick.file).digest('hex').slice(0, 16)}.orig`);
      let buffer;
      if (existsSync(cached)) buffer = await readFile(cached);
      else {
        buffer = Buffer.from(await (await request(pick.thumb, { accept: 'image/*' })).arrayBuffer());
        await writeFile(cached, buffer);
        await wait(250);
      }
      const image = sharp(buffer, { failOn: 'none' })
        .rotate()
        .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true });
      const { data: avif, info: size } = await image
        .clone()
        .avif({ quality: 50, effort: 5, chromaSubsampling: '4:2:0' })
        .toBuffer({ resolveWithObject: true });
      const webp = await image.clone().webp({ quality: 74, effort: 5 }).toBuffer();
      const name = `${slug}-${size.width}`;
      await writeFile(join(outDir, `${name}.avif`), avif);
      await writeFile(join(outDir, `${name}.webp`), webp);
      made.set(slug, { ...pick, w: size.width, h: size.height, avifBytes: avif.length, webpBytes: webp.length });
    } catch (err) {
      failed.push(`${slug}: ${err.message}`);
    }
    done += 1;
    if (done % 100 === 0) console.log(`  ${done} of ${picks.size}`);
  });

  // The credits file: every landmark with a photo, A–Z by slug
  const licences = [];
  const licenceIndex = (name, url) => {
    let at = licences.findIndex(([n, u]) => n === name && u === url);
    if (at < 0) at = licences.push([name, url]) - 1;
    return at;
  };
  const rows = [];
  for (const landmark of [...landmarks].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const old = kept.get(landmark.slug);
    const fresh = made.get(landmark.slug);
    if (old) {
      const [w, h, author] = old.entry;
      rows.push([landmark.slug, [w, h, author, licenceIndex(...old.licence), old.file]]);
    } else if (fresh) {
      rows.push([landmark.slug, [fresh.w, fresh.h, fresh.author, licenceIndex(fresh.licence, fresh.licenceUrl), fresh.file]]);
    }
  }
  const output = `// GENERATED by images/src/tools/landmark-photos.mjs: don't edit by hand. Re-run it from the repo
// root (node images/src/tools/landmark-photos.mjs) when landmarks change; it keeps these
// picks and fills the gaps (OVERRIDES in the script changes one).
//
// A photo per landmark from Wikimedia Commons, credited as its licence asks. The files are
// in the public bucket (copied in the repo's media/ folder) as
// landmarkPhotos/<slug>-<width>.avif and .webp.
// ${rows.length} of ${landmarks.length} landmarks have one.

// [licence name, licence URL ('' when it has none, as for public domain)]
export const LICENCES = ${JSON.stringify(licences, null, 0).replace(/\],\[/g, '],\n  [').replace(/^\[\[/, '[\n  [').replace(/\]\]$/, '],\n]')};

// slug: [width, height, author, licence (its place in LICENCES), Commons file name]
export const LANDMARK_PHOTOS = {
${rows.map(([slug, entry]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(entry)},`).join('\n')}
};
`;
  await writeFile(manifestPath, output);

  const report = { made: made.size, kept: kept.size, missing, failed, sources: Object.fromEntries([...made].map(([slug, m]) => [slug, m.file])) };
  await writeFile(join(cacheDir, 'report.json'), JSON.stringify(report, null, 2));
  const avifTotal = [...made.values()].reduce((sum, m) => sum + m.avifBytes, 0);
  const webpTotal = [...made.values()].reduce((sum, m) => sum + m.webpBytes, 0);
  const avifBigger = [...made].filter(([, m]) => m.avifBytes >= m.webpBytes).map(([slug]) => slug);
  console.log(`made ${made.size} (AVIF ${(avifTotal / 1e6).toFixed(1)} MB, WebP ${(webpTotal / 1e6).toFixed(1)} MB), kept ${kept.size}`);
  console.log(`AVIF not smaller than WebP: ${avifBigger.length}${avifBigger.length ? ` (${avifBigger.slice(0, 10).join(', ')})` : ''}`);
  console.log(`no photo: ${missing.length}${missing.length ? `\n  ${missing.join('\n  ')}` : ''}`);
  console.log(`failed: ${failed.length}${failed.length ? `\n  ${failed.join('\n  ')}` : ''}`);
  console.log(`report: ${join(cacheDir, 'report.json')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
