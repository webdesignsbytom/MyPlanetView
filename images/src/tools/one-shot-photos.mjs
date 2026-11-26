// A photo for every item of Life's One Shots (24 Nov 2026, the user's wish: "photo"), from
// Wikimedia Commons, credited as its licence asks, as the landmark photos are
// (landmark-photos.mjs, whose ways this copies).
//
// Run from the repo root:   node images/src/tools/one-shot-photos.mjs [--cache <dir>] [--only key,key] [--refresh]
//
// For each item of server/src/utils/constants/oneShots.js it picks a file, first match wins:
//   1. OVERRIDES below (a Commons file picked by hand);
//   2. with the item's `photo` (a search, where its article's picture would be a map or a
//      diagram), Commons' search for it, then the article's lead image;
//   3. otherwise the lead image of its English Wikipedia article (`wiki`; free licences
//      only), then Commons' search for its name.
// A file counts only as a JPEG, PNG, TIFF or WebP at least 400 px wide, under a free
// licence that asks only for a credit, its name not a map, plan, logo or diagram, and not in
// REJECT (picks found wrong on the contact sheet).
//
// It writes, and touches nothing else:
//   - media/oneShotPhotos/<key>-<width>.avif and .webp (480 px wide at most, 640 tall), the
//     copy of the public bucket's oneShotPhotos/ folder (npm run media:upload sends it);
//   - client/src/utils/oneShots/oneShotPhotos.js, the credits the client shows;
//   - contact.jpg in the cache folder: every pick with its key, to check by eye.
// An item already in the credits whose images exist keeps its pick (a re-run only fills
// gaps); --only redoes the keys given, --refresh redoes them all. The APIs' answers and the
// downloads are kept in --cache (default: the OS temp folder).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const catalogue = resolve(root, 'server/src/utils/constants/oneShots.js');
const outDir = resolve(root, 'media/oneShotPhotos');
const manifestPath = resolve(root, 'client/src/utils/oneShots/oneShotPhotos.js');

const args = process.argv.slice(2);
const argValue = (name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : null;
};
const cacheDir = resolve(argValue('--cache') || join(os.tmpdir(), 'mpv-one-shot-photos'));
const only = new Set((argValue('--only') || '').split(',').filter(Boolean));
const refresh = args.includes('--refresh');

// Hand-picked files (key -> Commons file name)
const OVERRIDES = {
  // A line on the map, so no search found a picture (26 Nov 2026): an iceberg just north of it,
  // by Detaille Island, from a ship crossing it
  'antarctic-circle': 'Antarctic Circle Icberg.JPG',
};

// Files never to pick (found wrong on the contact sheet, 24 Nov 2026): maps, a painting, a
// firefly for glowing water, a roller coaster for a bullet train, a station for a coast road
const REJECT = new Set([
  'Photinus pyralis Firefly glowing.jpg',
  'Tulip Fields near The Hague - Claude Monet.jpg',
  'Ways of St. James in Europe.png',
  'KKH.png',
  'Drake passage en.png',
  'Amazon River ESA387332.jpg',
  'Pacific Coast Highway Line 450X freeway station.JPG',
  'Capitol Bullet Train 2.jpg',
  'Den Haag - Madurodam - Bloembollenvelden Lisse.jpg',
  'Seat back on an N700 type Shinkansen bullet train (49495413136).jpg',
  'Cape Horn, Chile (ASTER).jpg',
  "Capitol Bullet Train 1.jpg",
]);

const MAX_WIDTH = 480;
const MAX_HEIGHT = 640;
const FETCH_WIDTH = 960;
const UA = 'MyPlanetViewOneShotPhotos/1.0 (one-off build script)';
const OK_TYPES = new Set(['image/jpeg', 'image/png', 'image/tiff', 'image/webp']);
const NOT_A_PHOTO = /\b(map|karte|carte|mapa|mappa|location|locator|plan|logo|flag|coat[ _]of[ _]arms|diagram|scheme|sketch|range|distribution|chart|graph|illustration|drawing|skeleton|skull)\b/i;
const FREE_LICENCE = /^(cc[ -]|cc0|public domain|pd\b|pd-|fal\b|free art|gfdl|attribution|kogl|ogl\b|open government|copyrighted free use)/i;

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

async function request(url, { body, accept = 'application/json', tries = 20 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: { 'User-Agent': UA, Accept: accept, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
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

async function eachLimited(items, limit, work) {
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const item = items[next];
        next += 1;
        await work(item);
      }
    }),
  );
}

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

// A Commons "Artist" made readable as a credit (as landmark-photos.mjs does)
function cleanAuthor(raw) {
  let author = String(raw);
  const named =
    author.match(/^No machine-readable author provided\.\s*(.+?)\s+assumed/i) ||
    author.match(/original uploader was\s+(.+?)\s+at\s+/i) ||
    author.match(/Picture by\s+(.+)$/i);
  if (named) author = named[1];
  author = author
    .replace(/~commonswiki/g, '')
    .replace(/\(\s*(talk|Archived)[^)]*\)/gi, '')
    .replace(/\s*\d{1,2}:\d{2},\s*\d{1,2}\.?\s+\w+\.?\s+\d{4}\s*\((UTC|CEST|CET)\)/g, '')
    .replace(/https?:\/\/(?:www\.)?flickr\.com\/photos\/([^/\s]+)\/?/gi, '$1 (Flickr)')
    .replace(/\s*\+?\s*https?:\/\/\S+/g, '')
    .replace(/\s+You are free to use[\s\S]*$/i, '')
    .replace(/,\s*assent by email[\s\S]*$/i, '')
    .replace(/\s+-\s*(?=\S+ \(Flickr\)$)/, ', ')
    .replace(/\s+[-–.]\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return author || 'Unknown author';
}

const shorten = (text, max = 100) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

async function loadStore(name) {
  const path = join(cacheDir, `${name}.json`);
  const data = existsSync(path) ? JSON.parse(await readFile(path, 'utf8')) : {};
  return { data, save: () => writeFile(path, JSON.stringify(data)) };
}

async function loadManifest() {
  if (!existsSync(manifestPath)) return { ONE_SHOT_LICENCES: [], ONE_SHOT_PHOTOS: {} };
  return import(`${pathToFileURL(manifestPath).href}?t=${Date.now()}`);
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
    const byTitle = new Map((json.query?.pages || []).map((page) => [page.title, page]));
    for (const title of batch) {
      let at = title;
      for (let hops = 0; renamed.has(at) && hops < 3; hops += 1) at = renamed.get(at);
      const page = byTitle.get(at);
      store.data[title] = page && !page.missing ? (page.pageimage ? page.pageimage.replace(/_/g, ' ') : '') : null;
    }
    await store.save();
    await wait(300);
  }
  return new Map(titles.map((title) => [title, store.data[title]]));
}

// Commons' search: the first few bitmap files
async function searchCommons(queries, store) {
  for (const query of queries.filter((q) => !(q in store.data))) {
    const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      list: 'search',
      srnamespace: '6',
      srlimit: '8',
      srsearch: `${query.replace(/[()]/g, ' ')} filetype:bitmap`,
      format: 'json',
      formatversion: '2',
    })}`;
    const json = await (await request(url)).json();
    store.data[query] = (json.query?.search || []).map((hit) => hit.title.replace(/^File:/, ''));
    await store.save();
    await wait(300);
  }
  return new Map(queries.map((query) => [query, store.data[query] || []]));
}

// Commons: type, size, licence, author and a thumbnail URL per file
async function fileInfo(files, store) {
  const asked = files.filter((file) => !(file in store.data));
  for (const batch of chunks(asked, 50)) {
    const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|mime|size|extmetadata',
      iiurlwidth: String(FETCH_WIDTH),
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl',
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
      store.data[file] = {
        file: title.replace(/^File:/, ''),
        mime: ii.mime,
        width: ii.width,
        height: ii.height,
        thumb: ii.thumburl || ii.url,
        licence: plainText(meta.LicenseShortName?.value),
        licenceUrl: (meta.LicenseUrl?.value || '').replace(/^http:/, 'https:'),
        author: plainText(meta.Artist?.value) || plainText(meta.Credit?.value) || 'Unknown author',
      };
    }
    await store.save();
    await wait(300);
  }
  return new Map(files.filter((file) => store.data[file]).map((file) => [file, store.data[file]]));
}

const usable = (info) =>
  info &&
  !REJECT.has(info.file) &&
  OK_TYPES.has(info.mime) &&
  info.width >= 400 &&
  FREE_LICENCE.test(info.licence) &&
  !NOT_A_PHOTO.test(info.file.replace(/[_-]/g, ' '));

const escapeXml = (text) => String(text).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

// Every pick in a grid with its key, to look over
async function contactSheet(entries) {
  const cell = 200;
  const label = 28;
  const columns = 10;
  const rows = Math.ceil(entries.length / columns);
  const tiles = await Promise.all(
    entries.map(async ([key, file], index) => {
      const picture = await sharp(file).resize(cell, cell, { fit: 'cover' }).jpeg().toBuffer();
      const text = Buffer.from(
        `<svg width="${cell}" height="${label}"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="19" font-size="14" font-family="sans-serif">${escapeXml(key)}</text></svg>`,
      );
      const x = (index % columns) * cell;
      const y = Math.floor(index / columns) * (cell + label);
      return [
        { input: picture, left: x, top: y },
        { input: text, left: x, top: y + cell },
      ];
    }),
  );
  await sharp({ create: { width: columns * cell, height: rows * (cell + label), channels: 3, background: '#ffffff' } })
    .composite(tiles.flat())
    .jpeg({ quality: 70 })
    .toFile(join(cacheDir, 'contact.jpg'));
}

async function main() {
  const { ONE_SHOTS } = await import(pathToFileURL(catalogue).href);
  const manifest = await loadManifest();
  const kept = new Map();
  for (const shot of ONE_SHOTS) {
    const entry = manifest.ONE_SHOT_PHOTOS[shot.key];
    if (!entry || refresh || only.has(shot.key) || OVERRIDES[shot.key]) continue;
    const [width, , , licenceAt, file] = entry;
    const name = `${shot.key}-${width}`;
    if (existsSync(join(outDir, `${name}.avif`)) && existsSync(join(outDir, `${name}.webp`))) {
      kept.set(shot.key, { entry, licence: manifest.ONE_SHOT_LICENCES[licenceAt], file });
    }
  }
  const todo = ONE_SHOTS.filter((shot) => !kept.has(shot.key));
  console.log(`${ONE_SHOTS.length} items: ${kept.size} kept, ${todo.length} to find`);
  await mkdir(cacheDir, { recursive: true });

  const lead = await leadImages([...new Set(todo.map((shot) => shot.wiki))], await loadStore('lead'));
  const missingArticles = todo.filter((shot) => lead.get(shot.wiki) === null).map((shot) => `${shot.key} (${shot.wiki})`);
  const searched = await searchCommons([...new Set(todo.map((shot) => shot.photo || shot.name))], await loadStore('search'));
  const candidates = new Map(
    todo.map((shot) => {
      const article = lead.get(shot.wiki) ? [lead.get(shot.wiki)] : [];
      const search = searched.get(shot.photo || shot.name) || [];
      const list = [OVERRIDES[shot.key], ...(shot.photo ? [...search, ...article] : [...article, ...search])].filter(Boolean);
      return [shot.key, [...new Set(list)]];
    }),
  );
  const info = await fileInfo([...new Set([...candidates.values()].flat())], await loadStore('commons'));
  const picks = new Map();
  for (const [key, list] of candidates) {
    const pick = list.map((file) => info.get(file)).find(usable);
    if (pick) picks.set(key, pick);
  }
  const missing = todo.filter((shot) => !picks.has(shot.key)).map((shot) => shot.key);
  console.log(`picked ${picks.size} of ${todo.length}`);

  await mkdir(outDir, { recursive: true });
  const made = new Map();
  const failed = [];
  const originals = new Map();
  await eachLimited([...picks], 3, async ([key, pick]) => {
    try {
      const cached = join(cacheDir, `${createHash('sha1').update(pick.file).digest('hex').slice(0, 16)}.orig`);
      if (!existsSync(cached)) {
        // A few tries only: a file Wikimedia keeps refusing is reported, and a re-run fills it
        await writeFile(cached, Buffer.from(await (await request(pick.thumb, { accept: 'image/*', tries: 4 })).arrayBuffer()));
        await wait(250);
      }
      originals.set(key, cached);
      const image = sharp(await readFile(cached), { failOn: 'none' })
        .rotate()
        .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true });
      const { data: avif, info: size } = await image
        .clone()
        .avif({ quality: 50, effort: 5, chromaSubsampling: '4:2:0' })
        .toBuffer({ resolveWithObject: true });
      const webp = await image.clone().webp({ quality: 74, effort: 5 }).toBuffer();
      const name = `${key}-${size.width}`;
      await writeFile(join(outDir, `${name}.avif`), avif);
      await writeFile(join(outDir, `${name}.webp`), webp);
      made.set(key, { ...pick, w: size.width, h: size.height });
    } catch (err) {
      failed.push(`${key}: ${err.message}`);
    }
  });

  const licences = [];
  const licenceIndex = (name, url) => {
    let at = licences.findIndex(([n, u]) => n === name && u === url);
    if (at < 0) at = licences.push([name, url]) - 1;
    return at;
  };
  const rows = [];
  for (const shot of [...ONE_SHOTS].sort((a, b) => a.key.localeCompare(b.key))) {
    const old = kept.get(shot.key);
    const fresh = made.get(shot.key);
    if (old) {
      const [w, h, author] = old.entry;
      rows.push([shot.key, [w, h, shorten(cleanAuthor(author)), licenceIndex(...old.licence), old.file]]);
    } else if (fresh) {
      rows.push([shot.key, [fresh.w, fresh.h, shorten(cleanAuthor(fresh.author)), licenceIndex(fresh.licence, fresh.licenceUrl), fresh.file]]);
    }
  }
  const output = `// GENERATED by images/src/tools/one-shot-photos.mjs: don't edit by hand. Re-run it from the repo
// root (node images/src/tools/one-shot-photos.mjs) when Life's One Shots change; it keeps
// these picks and fills the gaps (OVERRIDES and REJECT in the script change one).
//
// A photo per item of Life's One Shots from Wikimedia Commons, credited as its licence asks.
// The files are in the public bucket (copied in the repo's media/ folder) as
// oneShotPhotos/<key>-<width>.avif and .webp.
// ${rows.length} of ${ONE_SHOTS.length} items have one.

// [licence name, licence URL ('' when it has none, as for public domain)]
export const ONE_SHOT_LICENCES = ${JSON.stringify(licences, null, 0).replace(/\],\[/g, '],\n  [').replace(/^\[\[/, '[\n  [').replace(/\]\]$/, '],\n]')};

// key: [width, height, author, licence (its place in ONE_SHOT_LICENCES), Commons file name]
export const ONE_SHOT_PHOTOS = {
${rows.map(([key, entry]) => `  ${JSON.stringify(key)}: ${JSON.stringify(entry)},`).join('\n')}
};
`;
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, output);

  const sheet = [...ONE_SHOTS].filter((shot) => originals.has(shot.key)).map((shot) => [shot.key, originals.get(shot.key)]);
  if (sheet.length) await contactSheet(sheet);
  await writeFile(join(cacheDir, 'report.json'), JSON.stringify({ missing, missingArticles, failed, sources: Object.fromEntries([...made].map(([k, m]) => [k, m.file])) }, null, 2));
  console.log(`made ${made.size}, kept ${kept.size}`);
  console.log(`articles not found: ${missingArticles.length}${missingArticles.length ? `\n  ${missingArticles.join('\n  ')}` : ''}`);
  console.log(`no photo: ${missing.length}${missing.length ? `\n  ${missing.join('\n  ')}` : ''}`);
  console.log(`failed: ${failed.length}${failed.length ? `\n  ${failed.join('\n  ')}` : ''}`);
  console.log(`contact sheet: ${join(cacheDir, 'contact.jpg')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
