// The sea's depths, as an atlas tints them: lighter over the continental shelves (shallower
// than 200 m), the open ocean as it is, a touch darker over the deep basins and trenches.
// One image the map draws over its sea and under the countries (client/src/components/map/
// SeaDepths.jsx), so panning costs one bitmap a frame.
//
// SOURCE: Natural Earth's 1:10m bathymetry (public domain, naturalearthdata.com), the
// layers for 200, 1,000, 2,000, 3,000, 4,000, 5,000 and 6,000 m: each layer is the sea
// deeper than its depth. Download them (GeoJSON, from github.com/nvkelso/natural-earth-vector,
// geojson/ne_10m_bathymetry_<K_200…E_6000>.geojson) into one folder, then from the repo root:
//   node images/src/tools/sea-depths.mjs <that folder> [--preview <file.png>]
// It writes client/src/assets/map/sea-depths.webp: the whole map from the North Pole line
// to the South Pole line (x 0–2000, y MAP_TOP–MAP_BOTTOM in map units), SCALE pixels a
// unit. It's a tint with alpha (light cyan over shallow water, transparent over the open
// ocean, dark blue over the deep), not a fixed colour, so the animated sea's darkening
// and lightening still shows through. Depths shade into each other (a light blur), with
// no bright rim at the coast. --preview also writes it over the sea with the land on top.
import { readFile, mkdir } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const shapesFile = resolve(root, 'client/src/utils/map/countryShapes.js');
const projectionFile = resolve(root, 'client/src/utils/map/projection.js');
const output = resolve(root, 'client/src/assets/map/sea-depths.webp');

const args = process.argv.slice(2);
const dataDir = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : null;
const previewAt = args.indexOf('--preview');
const preview = previewAt >= 0 ? resolve(args[previewAt + 1]) : null;
if (!dataDir) {
  console.error('Usage: node images/src/tools/sea-depths.mjs <bathymetry folder> [--preview <file.png>]');
  process.exit(1);
}

// Pixels per map unit (a unit is about 20 km at the equator): the tints are soft, so a
// little under the screen's own size at full zoom-out is enough
const SCALE = 1.25;
// How far one depth shades into the next (map units)
const SOFTEN = 1.6;
const LAYERS = ['K_200', 'J_1000', 'I_2000', 'H_3000', 'G_4000', 'F_5000', 'E_6000'];
// The tint per depth step: 0 is shallower than 200 m (the shelves), 7 deeper than 6,000 m.
// Matched to an atlas's sea (open ocean about #1d9dda, shelves about #55beeb, the deep
// about #1c8ccb) over the default style's --map-sea.
const SHALLOW = [140, 222, 250];
const DEEP = [0, 40, 90];
const TINTS = [
  [SHALLOW, 0.5],
  [SHALLOW, 0.22],
  [SHALLOW, 0.08],
  [SHALLOW, 0],
  [DEEP, 0.04],
  [DEEP, 0.08],
  [DEEP, 0.12],
  [DEEP, 0.16],
];
// For --preview only: the default style's sea and land (index.css)
const PREVIEW_SEA = '#1d9dda';
const PREVIEW_LAND = '#f4f1e8';

const { COUNTRY_SHAPES } = await import(pathToFileURL(shapesFile).href);
const { MAP_WIDTH, MAP_TOP, MAP_BOTTOM, projectToMap } = await import(pathToFileURL(projectionFile).href);
const width = Math.round(MAP_WIDTH * SCALE);
const height = Math.round((MAP_BOTTOM - MAP_TOP) * SCALE);
const viewBox = `0 ${MAP_TOP} ${MAP_WIDTH} ${MAP_BOTTOM - MAP_TOP}`;

// A GeoJSON ring as an SVG path in map units (consecutive repeats dropped)
function ringPath(ring) {
  let d = '';
  let last = '';
  for (const [lng, lat] of ring) {
    const point = projectToMap(Math.max(-90, Math.min(90, lat)), Math.max(-180, Math.min(180, lng)));
    if (!point) continue;
    const here = `${point.x} ${point.y}`;
    if (here === last) continue;
    d += `${d ? 'L' : 'M'}${here}`;
    last = here;
  }
  return d ? `${d}Z` : '';
}

async function layerMask(name) {
  const json = JSON.parse(await readFile(join(dataDir, `ne_10m_bathymetry_${name}.geojson`), 'utf8'));
  const paths = [];
  for (const feature of json.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    for (const polygon of polygons) paths.push(`<path d="${polygon.map(ringPath).join('')}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><rect x="0" y="${MAP_TOP}" width="${MAP_WIDTH}" height="${MAP_BOTTOM - MAP_TOP}" fill="#000"/><g fill="#fff" fill-rule="evenodd">${paths.join('')}</g></svg>`;
  return sharp(Buffer.from(svg), { limitInputPixels: false })
    .greyscale()
    .extractChannel(0)
    .raw()
    .toBuffer();
}

const masks = [];
for (const name of LAYERS) {
  masks.push(await layerMask(name));
  console.log(`  ${name}`);
}

// The world's outline (the projection's curved sides, ±180°). The map fills a rectangle,
// so past those sides (the four corners, widest towards the poles) the sea needs a floor
// too, or the corners are flat and the outline shows. Real data wrapped round from the
// other side would bring Siberia and Antarctica in as pale patches (their land isn't drawn
// there), so the corners get a made-up deep-ocean floor instead (OPEN_SEA, from smooth
// noise, between OPEN_SEA_DEPTH's depths), stepped into contours and softened exactly as
// the real layers are, and blended into the real data over OUTLINE_SOFTEN map units.
const OUTLINE_SOFTEN = 14;
const OPEN_SEA_DEPTH = [2.6, 7];
const edge = [];
for (let lat = -90; lat <= 90; lat += 1) edge.push([-180, lat]);
for (let lat = 90; lat >= -90; lat -= 1) edge.push([180, lat]);
const inside = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><rect x="0" y="${MAP_TOP}" width="${MAP_WIDTH}" height="${MAP_BOTTOM - MAP_TOP}" fill="#000"/><path fill="#fff" d="${ringPath(edge)}"/></svg>`,
  ),
)
  .greyscale()
  .blur(OUTLINE_SOFTEN * SCALE)
  .extractChannel(0)
  .raw()
  .toBuffer();

// Smooth noise: random grids of a few sizes, each enlarged smoothly and added up (the
// coarse ones weigh most), from a fixed seed so every run makes the same floor
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = seeded(20261116);
const noise = new Float32Array(width * height);
for (const [cols, weight] of [[10, 1], [20, 0.6], [40, 0.38], [80, 0.22], [160, 0.12]]) {
  const rows = Math.round(cols / 2);
  const grid = Buffer.from(Array.from({ length: cols * rows }, () => Math.round(random() * 255)));
  const big = await sharp(grid, { raw: { width: cols, height: rows, channels: 1 } })
    .resize(width, height, { kernel: 'cubic', fit: 'fill' })
    .extractChannel(0)
    .raw()
    .toBuffer();
  for (let i = 0; i < noise.length; i += 1) noise[i] += (big[i] / 255) * weight;
}
let low = Infinity;
let high = -Infinity;
for (const value of noise) {
  if (value < low) low = value;
  if (value > high) high = value;
}
// The depths blended: the real data's (how many layers cover each pixel) inside the
// outline, the noise's outside. The blend ramps from 0 at the outline to 1 a little inside
// it, so the real data is never read where it has none (past the outline). Only then is
// the blend cut into the depth steps and softened, once, so contours run on across the
// outline instead of stopping at it.
const [shallowest, deepest] = OPEN_SEA_DEPTH;
const blended = new Float32Array(width * height);
for (let i = 0; i < blended.length; i += 1) {
  let real = 0;
  for (const mask of masks) real += mask[i] / 255;
  const open = shallowest + ((noise[i] - low) / (high - low)) * (deepest - shallowest);
  const w = Math.min(1, Math.max(0, (inside[i] / 255 - 0.5) * 2));
  blended[i] = real * w + open * (1 - w);
}
const depths = new Float32Array(width * height);
for (let level = 1; level <= LAYERS.length; level += 1) {
  const step = Buffer.alloc(width * height);
  for (let i = 0; i < step.length; i += 1) step[i] = blended[i] > level - 0.5 ? 255 : 0;
  const soft = await sharp(step, { raw: { width, height, channels: 1 } })
    .blur(SOFTEN * SCALE)
    .extractChannel(0)
    .raw()
    .toBuffer();
  for (let i = 0; i < depths.length; i += 1) depths[i] += soft[i] / 255;
}

// Per pixel: its depth (fractional where the steps have been softened), and the tint
// between the two steps it falls between
const rgba = Buffer.alloc(width * height * 4);
for (let i = 0; i < width * height; i += 1) {
  const depth = depths[i];
  const step = Math.min(TINTS.length - 2, Math.floor(depth));
  const t = depth - step;
  const [c0, a0] = TINTS[step];
  const [c1, a1] = TINTS[step + 1];
  // Premultiplied, so a colour fading to nothing doesn't drag the other towards black
  const a = a0 + (a1 - a0) * t;
  if (a <= 0) continue;
  for (let k = 0; k < 3; k += 1) rgba[i * 4 + k] = Math.round((c0[k] * a0 * (1 - t) + c1[k] * a1 * t) / a);
  rgba[i * 4 + 3] = Math.round(a * 255);
}

await mkdir(dirname(output), { recursive: true });
const raw = { raw: { width, height, channels: 4 } };
const info = await sharp(rgba, raw).webp({ quality: 74, alphaQuality: 70, effort: 6, smartSubsample: true }).toFile(output);
console.log(`${output}: ${width}x${height}, ${(info.size / 1024).toFixed(0)} KB`);

if (preview) {
  const land = Object.values(COUNTRY_SHAPES)
    .flat()
    .map((d) => `<path d="${d}"/>`)
    .join('');
  const landPng = await sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><g fill="${PREVIEW_LAND}" stroke="#b91c1c" stroke-width="0.4">${land}</g></svg>`),
  )
    .png()
    .toBuffer();
  await sharp({ create: { width, height, channels: 4, background: PREVIEW_SEA } })
    .composite([{ input: await sharp(rgba, raw).png().toBuffer() }, { input: landPng }])
    .png()
    .toFile(preview);
  console.log(`preview: ${preview}`);
}
