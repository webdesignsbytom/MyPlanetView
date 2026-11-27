// The photos that cover a postcard's front (27 Nov 2026, the user's wish: "a photo that covers the
// postcard ... a cool city photo, or a wilderness photo, or a famous landmark photo"): each
// landmark's own Commons photo (the one client/src/utils/map/landmarkPhotos.js already credits,
// picked and checked by landmark-photos.mjs), fetched again big enough to fill a card.
//
// Run from the repo root:   node images/src/tools/postcard-photos.mjs [--cache <dir>] [--only slug,slug] [--sheet]
//
// For each landmark with a photo it asks Commons for the file's 1,280 px copy (one of its standard
// thumbnail widths; the 960 px one where the original is no wider), and keeps it only when that
// fills a card without being blown up more than a little (CARD_W × CARD_H, MAX_UPSCALE): about
// nine in ten do. Each is cut to the card's
// shape round what's most striking in it (sharp's "attention"), and saved as one WebP. Every kept
// photo is sorted by its landmark's category in the seed data (server/prisma/seed/data/):
//   - c, a city: an old town;
//   - w, the wilderness: a park, natural site, mountain, range, island or archipelago;
//   - l, a landmark: a building, monument or site.
// City and wilderness photos are on every plan's postcards, landmark ones on a paid plan's (the
// user's decision, 26 Nov 2026: country postcards free, landmark postcards paid).
//
// It writes, and touches nothing else:
//   - media/postcardPhotos/<slug>-1200.webp, the copy of the public bucket's postcardPhotos/
//     folder (npm run media:upload sends it);
//   - client/src/utils/postcards/postcardPhotos.js, each kept slug and its group;
//   - server/src/data/postcardPhotos.json, each kept landmark's Wikidata item and its group, so
//     the server knows which are free;
//   - with --sheet, contact sheets of every kept photo in the cache folder, to look over.
// A slug whose photo is already in media/ is kept as it is unless --only names it.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = resolve(root, 'media/postcardPhotos');
const clientOut = resolve(root, 'client/src/utils/postcards/postcardPhotos.js');
const serverOut = resolve(root, 'server/src/data/postcardPhotos.json');

const args = process.argv.slice(2);
const argValue = (name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : null;
};
const cacheDir = resolve(argValue('--cache') || join(os.tmpdir(), 'mpv-postcard-photos'));
const only = new Set((argValue('--only') || '').split(',').filter(Boolean));
const sheets = args.includes('--sheet');

// The card's front, as client/src/utils/postcards/drawPostcard.js draws it
const CARD_W = 1200;
const CARD_H = 800;
// A copy is blown up at most this much to fill it (a 1,280 × 720 panorama is, by 1.11)
const MAX_UPSCALE = 1.15;
const FETCH_WIDTH = 1280;
// Where Commons has no 1,280 px copy (the original is no wider), it hands out the original file,
// whose server answered 429s with a 10-minute wait (27 Nov 2026): those take its 960 px copy
// instead, blown up by 1.25, a little softer
const SMALL_WIDTH = 960;
const SMALL_MAX_UPSCALE = 1.3;
const QUALITY = 72;
const UA = 'MyPlanetViewPostcardPhotos/1.0 (one-off build script)';

// The landmarks' categories (seed data comments), as a postcard's groups
const GROUP_OF = {
  'old town': 'c',
  park: 'w',
  natural: 'w',
  mountain: 'w',
  range: 'w',
  island: 'w',
  archipelago: 'w',
  building: 'l',
  monument: 'l',
  site: 'l',
};

// Photos never to use on a card (looked at on the contact sheets): none yet
const REJECT = new Set([]);

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// Wikimedia sometimes drops the connection or answers 429: tried again, more slowly each time
async function request(url, { tries = 12 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
    } catch (err) {
      if (attempt >= tries) throw err;
      await wait(1000 + 750 * attempt);
      continue;
    }
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < tries) {
      const after = Number(res.headers.get('retry-after'));
      await wait(after > 0 ? after * 1000 : Math.min(60000, 2000 * 2 ** attempt));
      continue;
    }
    throw new Error(`${res.status} for ${url.slice(0, 160)}`);
  }
}

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

const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/** Every landmark with a photo: `{ slug, wikidataId, group, file }`. */
async function landmarksWithPhotos() {
  // The data files and the slug rule alone (never the seed's own module, which loads the
  // database's settings): a slug as the seed makes it
  const { LANDMARK_PHOTOS } = await import(pathToFileURL(resolve(root, 'client/src/utils/map/landmarkPhotos.js')).href);
  const { LANDMARKS } = await import(pathToFileURL(resolve(root, 'server/prisma/seed/data/landmarks.js')).href);
  const { UNESCO_LANDMARKS } = await import(pathToFileURL(resolve(root, 'server/prisma/seed/data/landmarksUnesco.js')).href);
  const { slugify } = await import(pathToFileURL(resolve(root, 'server/src/utils/slug.js')).href);
  return [...LANDMARKS, ...UNESCO_LANDMARKS]
    .map((l) => ({ slug: slugify(l.name), wikidataId: l.wikidataId, group: GROUP_OF[l.category] || 'l' }))
    .filter((row) => LANDMARK_PHOTOS[row.slug])
    .map((row) => ({ ...row, file: LANDMARK_PHOTOS[row.slug][4] }));
}

/** Commons' `width` px copy of each file: `file -> { url, width, height }` (cached in the cache folder). */
async function thumbnails(files, width = FETCH_WIDTH) {
  const cachePath = join(cacheDir, `thumbs-${width}.json`);
  const cached = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {};
  const missing = files.filter((file) => !(file in cached));
  for (const part of chunks(missing, 50)) {
    const titles = part.map((file) => `File:${file}`).join('|');
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&iiurlwidth=${width}&titles=${encodeURIComponent(titles)}`;
    const json = await (await request(url)).json();
    // Commons gives each title back as it normalised it ("_" to " "): match both ways
    const named = new Map();
    for (const n of json.query?.normalized || []) named.set(n.to, n.from);
    for (const page of Object.values(json.query?.pages || {})) {
      const info = page.imageinfo?.[0];
      const asked = (named.get(page.title) || page.title).replace(/^File:/, '');
      cached[asked] = info ? { url: info.thumburl || info.url, width: info.thumbwidth || info.width, height: info.thumbheight || info.height } : null;
      cached[page.title.replace(/^File:/, '')] = cached[asked];
    }
    for (const file of part) if (!(file in cached)) cached[file] = null;
    await writeFile(cachePath, JSON.stringify(cached));
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  return cached;
}

const fills = (thumb, most = MAX_UPSCALE) => Boolean(thumb) && Math.max(CARD_W / thumb.width, CARD_H / thumb.height) <= most;
// A real copy (on the thumbnail server), not the original file
const isCopy = (thumb) => Boolean(thumb) && thumb.url.includes('/thumb/');

const cachedPath = (url) => join(cacheDir, 'files', `${createHash('sha1').update(url).digest('hex')}.img`);

async function download(url) {
  const name = cachedPath(url);
  if (existsSync(name)) return readFile(name);
  const buffer = Buffer.from(await (await request(url)).arrayBuffer());
  await writeFile(name, buffer);
  return buffer;
}

async function main() {
  await mkdir(join(cacheDir, 'files'), { recursive: true });
  await mkdir(outDir, { recursive: true });
  const landmarks = await landmarksWithPhotos();
  console.log(`${landmarks.length} landmarks with a photo`);
  const big = await thumbnails([...new Set(landmarks.map((l) => l.file))]);
  // Where the 1,280 px answer is the original file itself, ask for the 960 px copy
  const needSmall = [...new Set(landmarks.filter((l) => big[l.file] && !isCopy(big[l.file])).map((l) => l.file))];
  const small = needSmall.length ? await thumbnails(needSmall, SMALL_WIDTH) : {};
  const thumbs = {};
  for (const l of landmarks) {
    // An original already downloaded (before the 429s) is used as it is
    if (big[l.file] && !isCopy(big[l.file]) && existsSync(cachedPath(big[l.file].url)) && fills(big[l.file])) {
      thumbs[l.file] = big[l.file];
      continue;
    }
    const pick = isCopy(big[l.file]) ? big[l.file] : small[l.file];
    if (pick && isCopy(pick) && fills(pick, isCopy(big[l.file]) ? MAX_UPSCALE : SMALL_MAX_UPSCALE)) thumbs[l.file] = pick;
  }
  const usable = landmarks.filter((l) => !REJECT.has(l.slug) && thumbs[l.file]);
  console.log(`${usable.length} big enough to fill a card`);

  const kept = [];
  const failed = [];
  await eachLimited(usable, 3, async (landmark) => {
    const target = join(outDir, `${landmark.slug}-${CARD_W}.webp`);
    try {
      if (!existsSync(target) || only.has(landmark.slug)) {
        const buffer = await download(thumbs[landmark.file].url);
        await sharp(buffer, { failOn: 'none' })
          .rotate()
          .resize(CARD_W, CARD_H, { fit: 'cover', position: sharp.strategy.attention })
          .webp({ quality: QUALITY, effort: 5 })
          .toFile(target);
      }
      kept.push(landmark);
      if (kept.length % 50 === 0) console.log(`${kept.length} made`);
    } catch (err) {
      failed.push(`${landmark.slug}: ${err.message}`);
    }
  });
  kept.sort((a, b) => a.slug.localeCompare(b.slug));

  const groups = { c: 0, w: 0, l: 0 };
  for (const landmark of kept) groups[landmark.group] += 1;
  const header = `// GENERATED by images/src/tools/postcard-photos.mjs: don't edit by hand; re-run the tool.
//
// The landmarks whose Commons photo covers a postcard's front (media/postcardPhotos/<slug>-1200.webp,
// the public bucket's postcardPhotos/ folder; the credit is landmarkPhotos.js's), each with its
// group: c a city, w the wilderness (both on every plan's postcards), l a landmark (a paid plan's).
// ${kept.length} photos: ${groups.c} cities, ${groups.w} wilderness, ${groups.l} landmarks.
`;
  const body = kept.map((l) => `  ${JSON.stringify(l.slug)}: '${l.group}',`).join('\n');
  await writeFile(clientOut, `${header}export const POSTCARD_PHOTOS = {\n${body}\n};\n`);
  await writeFile(serverOut, `${JSON.stringify(Object.fromEntries(kept.map((l) => [l.wikidataId, l.group])), null, 0)}\n`);
  console.log(`Wrote ${kept.length} (${groups.c} c, ${groups.w} w, ${groups.l} l); ${failed.length} failed`);
  for (const line of failed) console.log(`  ${line}`);

  if (sheets) {
    // Contact sheets, 48 a sheet, each labelled with its slug, to look over
    for (const [index, part] of chunks(kept, 48).entries()) {
      const tiles = await Promise.all(
        part.map(async (l) => ({
          input: await sharp(join(outDir, `${l.slug}-${CARD_W}.webp`)).resize(300, 200).toBuffer(),
          slug: l.slug,
        })),
      );
      const columns = 8;
      const composite = tiles.flatMap((tile, i) => {
        const left = (i % columns) * 300;
        const top = Math.floor(i / columns) * 230;
        const label = Buffer.from(`<svg width="300" height="30"><rect width="300" height="30" fill="white"/><text x="4" y="20" font-size="13" font-family="sans-serif">${tile.slug.slice(0, 40)}</text></svg>`);
        return [
          { input: tile.input, left, top },
          { input: label, left, top: top + 200 },
        ];
      });
      await sharp({ create: { width: columns * 300, height: Math.ceil(tiles.length / columns) * 230, channels: 3, background: '#ffffff' } })
        .composite(composite)
        .jpeg({ quality: 70 })
        .toFile(join(cacheDir, `sheet-${String(index + 1).padStart(2, '0')}.jpg`));
    }
    console.log(`Contact sheets in ${cacheDir}`);
  }
}

await main();
