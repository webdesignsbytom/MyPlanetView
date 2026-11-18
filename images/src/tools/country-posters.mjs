// The country posters (the user's adventure posters, 16 Nov 2026), into the public bucket's
// copy and the client's poster list:
//   node images/src/tools/country-posters.mjs <folder of posters>        (from the repo root)
//   node images/src/tools/country-posters.mjs <folder> --dry-run         say what it would do
//
// Each file is "<country slug>-<title>.png" (or .jpg/.webp), the slug as in
// client/src/utils/map/countries.js (ALIASES below for the few named otherwise), a special
// place's too (antarctica, north-pole, south-pole...) and a UK nation's (england, scotland,
// wales, northern-ireland; 17 Nov 2026), whose own poster shows on a map that splits the UK
// (posterData.js postersFor). One per place is the user's way (17 Nov 2026). For each,
// it writes media/visitCountryPosters/<code>-<title>-800.avif and .webp (800px wide; files
// already there are kept), then sets that country's posters in
// client/src/utils/map/posterData.js to the folder's ones, A–Z by title (the first is the
// main one). Countries the folder has no poster for keep the ones they had. Re-run it as
// more posters arrive. New names, never the old ones: browsers cache posters for a year.
// Upload the new files with `npm run media:upload` (server/, the user runs it).
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT_DIR = join(root, 'media/visitCountryPosters');
const POSTER_DATA = join(root, 'client/src/utils/map/posterData.js');
const WIDTH = 800;

// File names that don't start with the country list's slug
const ALIASES = { 'cabo-verde': 'CV', 'cote-divoire': 'CI', 'dr-congo': 'CD', turkiye: 'TR' };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const folder = args.find((arg) => !arg.startsWith('--'));
if (!folder) {
  console.error('Usage: node images/src/tools/country-posters.mjs <folder of posters> [--dry-run]');
  process.exit(1);
}

const { COUNTRIES } = await import(pathToFileURL(join(root, 'client/src/utils/map/countries.js')).href);
// Longest first, so "dominican-republic" wins over "dominica", "guinea-bissau" over "guinea"
const prefixes = [
  ...COUNTRIES.map((country) => [country.slug, country.code]),
  ...Object.entries(ALIASES),
].sort((a, b) => b[0].length - a[0].length);

// code → [{ name, ratio, file }], A–Z by file name
const byCode = new Map();
const unmatched = [];
const files = (await readdir(folder)).filter((f) => ['.png', '.jpg', '.jpeg', '.webp'].includes(extname(f).toLowerCase())).sort();
for (const file of files) {
  const base = file.slice(0, -extname(file).length).toLowerCase();
  const hit = prefixes.find(([slug]) => base.startsWith(`${slug}-`));
  if (!hit) {
    unmatched.push(file);
    continue;
  }
  const [slug, code] = hit;
  const title = base.slice(slug.length + 1).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const { width, height } = await sharp(join(folder, file)).metadata();
  if (!byCode.has(code)) byCode.set(code, []);
  byCode.get(code).push({ name: `${code.toLowerCase()}-${title}`, ratio: `${width}/${height}`, file });
}

// The files: 800px AVIF (4:2:0, smaller than the WebP) and the WebP fallback
let made = 0;
if (!dryRun) await mkdir(OUT_DIR, { recursive: true });
for (const posters of byCode.values()) {
  for (const poster of posters) {
    const avifPath = join(OUT_DIR, `${poster.name}-${WIDTH}.avif`);
    const webpPath = join(OUT_DIR, `${poster.name}-${WIDTH}.webp`);
    if (existsSync(avifPath) && existsSync(webpPath)) continue;
    made += 1;
    if (dryRun) continue;
    const image = sharp(join(folder, poster.file)).resize({ width: WIDTH, withoutEnlargement: true });
    await writeFile(avifPath, await image.clone().avif({ quality: 50, effort: 6, chromaSubsampling: '4:2:0' }).toBuffer());
    await writeFile(webpPath, await image.clone().webp({ quality: 78, effort: 6 }).toBuffer());
    process.stdout.write('.');
  }
}
if (made && !dryRun) process.stdout.write('\n');

// The poster list: one line per country in POSTERS_BY_CODE, A–Z by code
const raw = await readFile(POSTER_DATA, 'utf8');
const crlf = raw.includes('\r\n');
const source = raw.replace(/\r\n/g, '\n');
const start = source.indexOf('export const POSTERS_BY_CODE = {\n');
const end = source.indexOf('\n};', start);
if (start < 0 || end < 0) throw new Error('POSTERS_BY_CODE not found in posterData.js');
const head = 'export const POSTERS_BY_CODE = {\n';
const lines = new Map();
for (const line of source.slice(start + head.length, end).split('\n')) {
  const match = line.match(/^ {2}([A-Z]{2}): /);
  if (match) lines.set(match[1], line);
  else if (line.trim()) throw new Error(`Unexpected line in POSTERS_BY_CODE: ${line}`);
}
const replaced = [...byCode.keys()].filter((code) => lines.has(code));
const added = [...byCode.keys()].filter((code) => !lines.has(code));
// The posters these replace (their names, from the old lines)
const oldNames = replaced.flatMap((code) => [...lines.get(code).matchAll(/name: '([^']+)'/g)].map((m) => m[1]));
for (const [code, posters] of byCode) {
  lines.set(code, `  ${code}: [${posters.map((p) => `{ name: '${p.name}', ratio: '${p.ratio}' }`).join(', ')}],`);
}
const body = [...lines.keys()].sort().map((code) => lines.get(code)).join('\n');
const next = `${source.slice(0, start)}${head}${body}${source.slice(end)}`;
if (!dryRun && next !== source) await writeFile(POSTER_DATA, crlf ? next.replace(/\n/g, '\r\n') : next);

// The replaced posters' files go (17 Nov 2026: 114 of them sat unused in media/ and the
// bucket), unless a poster is still listed or the mock's stand-in photos name it
// (image: { kind: 'asset', name }); `npm run media:upload -- --prune` then removes them
// from the bucket
const MOCK_DIR = join(root, 'client/src/dev/mock');
const mockText = (await readdir(MOCK_DIR, { recursive: true }))
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(join(MOCK_DIR, f), 'utf8'))
  .join('\n');
const stillListed = new Set([...body.matchAll(/name: '([^']+)'/g)].map((m) => m[1]));
const removable = oldNames.filter((name) => !stillListed.has(name) && !mockText.includes(`name: '${name}'`));

// The example travel offers use posters as their pictures (imageKey): one whose poster
// goes now uses its country's new main poster (17 Nov 2026: eight offers were left
// pointing at deleted files). Then regenerate the mock's copy and re-import the offers.
const OFFERS = join(root, 'server/prisma/seed/data/offers.example.json');
const offersText = await readFile(OFFERS, 'utf8');
const nextOffers = offersText.replace(/visitCountryPosters\/([a-z0-9-]+)-800\.avif/g, (all, name) => {
  if (!removable.includes(name)) return all;
  const posters = byCode.get(name.slice(0, 2).toUpperCase());
  return posters ? `visitCountryPosters/${posters[0].name}-800.avif` : all;
});
if (nextOffers !== offersText) {
  if (!dryRun) await writeFile(OFFERS, nextOffers);
  console.log(`offers.example.json ${dryRun ? 'would use' : 'now uses'} the new posters (then: node scripts/generate-mock-offers.mjs in client/, and npm run db:offers -- prisma/seed/data/offers.example.json)`);
}
let removed = 0;
for (const name of removable) {
  for (const ext of ['avif', 'webp']) {
    const file = join(OUT_DIR, `${name}-${WIDTH}.${ext}`);
    if (!existsSync(file)) continue;
    removed += 1;
    if (!dryRun) await unlink(file);
  }
}

console.log(`${files.length} files: ${byCode.size} countries (${replaced.length} replaced, ${added.length} new), ${made} poster files ${dryRun ? 'to make' : 'made'}`);
if (added.length) console.log(`new: ${added.sort().join(' ')}`);
console.log(`${lines.size} countries have a poster`);
if (removed) console.log(`${removed} replaced poster files ${dryRun ? 'to delete' : 'deleted'} (then: npm run media:upload -- --prune)`);
if (unmatched.length) console.log(`no country for:\n  ${unmatched.join('\n  ')}`);
