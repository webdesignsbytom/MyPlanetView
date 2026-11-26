// The little 3D landmark models (22 Nov 2026, the user's wish): toy models made in Blender,
// drawn on the country maps at their real place, such as Big Ben at Westminster.
//
// Each model has a folder in images/src/models/<id>/ holding:
//   - <id>.py, the Blender script that builds and renders it (open <id>.blend to tweak it
//     by hand), run as: blender -b --factory-startup -P <id>.py -- <id>-1024.png 1024 <id>.blend
//     It writes <id>-1024.png (transparent) and <id>-1024.json (`anchor`: where the middle
//     of its grass tile falls in the picture, as fractions from the top left; and
//     `unitsPerPixel`). The set's shared look (shading, outline, tile, camera, sun) is
//     images/src/models/toon.py, which every model's script imports;
//   - model.json: `name`, `latitude` and `longitude` (the spot the tile's middle stands on),
//     `maps` (the country maps that show it, e.g. GB and England's XE), `landmark` (the
//     Wikidata item of the landmark it belongs to, as in the seed's landmark files), and
//     optionally `scale` (see below) and `onMap`: false for a model the country maps don't
//     draw, as its picture would overlap a more famous one's in the map's opening view (23 Nov
//     2026, the user's decision: every landmark gets its model, for other uses, but a crowded
//     map shows the most famous). `maps` still names its country's maps.
//
// Then, from the repo root: node images/src/tools/landmark-models.mjs (`--only id,id` or `--hq`
// to make only those models' pictures, the rest kept as they are)
// For each model it trims the render, puts a soft shadow under the tile (baked in, so the
// map draws no blur filter while it pans), and writes client/src/assets/map/landmarkModels/
// <id>-<height>.webp at two heights; then client/src/utils/map/landmarkModels.js, the list
// the country map draws (CountryMapView's LandmarkModels). Every model is drawn at one scale:
// its `size` is its picture's height in the scene's units over Big Ben's (REFERENCE_UNITS),
// so every grass tile is the same size on the map and a taller model stands taller. A low,
// wide landmark would be too small to read that way (the Colosseum came out half Big Ben's
// height, its arches a blur with a whole country in view), so none is drawn smaller than
// MIN_SIZE, tile and all (the Colosseum, the Pyramids, the Opera House, the Great Wall, the
// Taj Mahal, Christ on his mountain). model.json's `scale` (1 when left out) can still make
// one bigger or smaller by hand, before that floor.
//
// The models remade in the high-quality look (26 Nov 2026, the user's wish: "add them to the
// site"): a model with a render in images/src/models-hq/<id>/ (<id>-1024.png and its .json,
// made by its script there with hq.py; HQ-MODELS.md) is drawn from that render instead of its
// toon one, and marked `hq` in the list. Its model.json is still the one in images/src/models/.
// The dioramas have one scale of their own (HQ_REFERENCE_UNITS): every base the same width on the
// map, about 55 px at zoom 1, and a taller one stands taller. They have no floor: a diorama's
// base is nearly twice as wide as a toon tile at the toon set's scale, so even the lowest (about
// 33 px tall) reads.
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const modelsDir = resolve(root, 'images/src/models');
const hqDir = resolve(root, 'images/src/models-hq');
const assetsDir = resolve(root, 'client/src/assets/map/landmarkModels');
const listFile = resolve(root, 'client/src/utils/map/landmarkModels.js');

// The heights written: the small one for the usual view, the big one once zoomed in
const HEIGHTS = [160, 320];
// The shadow: an ellipse under the tile, this share of the tile's width across, blurred
const SHADOW = { width: 1.12, height: 0.16, blur: 0.025, opacity: 0.3 };
// A model whose picture (tile and shadow included) is this many of the scene's units tall is
// drawn at the map's own model height (size 1): Big Ben's, the first model
const REFERENCE_UNITS = 6.0;
// No toon model is drawn smaller than this share of Big Ben's height
const MIN_SIZE = 0.7;
// A diorama whose picture is this many of its scene's units tall (hq.py's base is 3 across, the
// shadow under it a little more) is drawn at the map's own model height (size 1): chosen so a
// diorama's picture takes about the room the toon model it replaced did (about 70 px wide at
// zoom 1, its base about 55), so the maps keep their spacing and the overlaps decided with the
// toon pictures (`onMap: false`) still hold
const HQ_REFERENCE_UNITS = 3.5;

const exists = (file) => access(file).then(() => true, () => false);
const quote = (text) => `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const list = (items) => `[${items.join(', ')}]`;
const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

async function buildModel(id, makePictures) {
  const dir = join(modelsDir, id);
  const hq = await exists(join(hqDir, id, `${id}-1024.png`));
  const renderDir = hq ? join(hqDir, id) : dir;
  const render = join(renderDir, `${id}-1024.png`);
  const info = JSON.parse(await readFile(join(dir, 'model.json'), 'utf8'));
  const { anchor, unitsPerPixel } = JSON.parse(await readFile(join(renderDir, `${id}-1024.json`), 'utf8'));
  if (!unitsPerPixel) throw new Error(`${id}-1024.json has no unitsPerPixel: render the model again`);
  for (const key of ['name', 'latitude', 'longitude', 'maps']) {
    if (info[key] === undefined) throw new Error(`${id}/model.json has no ${key}`);
  }

  const files = Object.fromEntries(HEIGHTS.map((h) => [h, `${id}-${h}.webp`]));
  // A model whose pictures are kept (--only, --hq) is still measured from its render
  const make = makePictures || !(await Promise.all(HEIGHTS.map((h) => exists(join(assetsDir, files[h]))))).every(Boolean);
  const source = await sharp(render).metadata();
  const trimmedRender = sharp(render).trim({ threshold: 1 });
  const { data: trimmed, info: trim } = await (make ? trimmedRender.png() : trimmedRender.raw()).toBuffer({ resolveWithObject: true });
  // The anchor in the trimmed picture (trimOffset* are the crop's corner, negative)
  const ax = anchor[0] * source.width + trim.trimOffsetLeft;
  const ay = anchor[1] * source.height + trim.trimOffsetTop;

  // Room for the shadow round the tile: the trimmed picture's width is the tile's
  const tileW = trim.width;
  const rx = (tileW * SHADOW.width) / 2;
  const ry = tileW * SHADOW.height * 0.5;
  const shadowY = trim.height - ry * 0.55;
  const blur = tileW * SHADOW.blur;
  const padX = Math.ceil(Math.max(0, rx - tileW / 2) + blur * 3);
  const padBottom = Math.ceil(Math.max(0, shadowY + ry - trim.height) + blur * 3);
  const width = trim.width + padX * 2;
  const height = trim.height + padBottom;
  if (make) await writePictures(files, { width, height, ax, padX, shadowY, rx, ry, blur, trimmed });
  const units = height * unitsPerPixel;
  return {
    id,
    hq,
    made: make,
    name: info.name,
    latitude: info.latitude,
    longitude: info.longitude,
    maps: info.maps,
    landmark: info.landmark ?? null,
    onMap: info.onMap !== false,
    aspect: Number((width / height).toFixed(4)),
    units,
    // model.json's `scale` is for the toon pictures it was set against
    size: Number((hq ? units / HQ_REFERENCE_UNITS : Math.max(MIN_SIZE, (units / REFERENCE_UNITS) * (info.scale ?? 1))).toFixed(3)),
    anchor: [Number(((ax + padX) / width).toFixed(4)), Number((ay / height).toFixed(4))],
    files,
  };
}

/** The trimmed render with its shadow baked in under the tile, at each height. */
async function writePictures(files, { width, height, ax, padX, shadowY, rx, ry, blur, trimmed }) {
  const shadow = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><ellipse cx="${ax + padX}" cy="${shadowY}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="${SHADOW.opacity}"/></svg>`,
    ),
  )
    .blur(blur)
    .png()
    .toBuffer();
  const full = await sharp(shadow).composite([{ input: trimmed, left: padX, top: 0 }]).png().toBuffer();
  for (const h of HEIGHTS) {
    await sharp(full).resize({ height: h, kernel: 'lanczos3' }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(join(assetsDir, files[h]));
  }
}

await mkdir(assetsDir, { recursive: true });
const ids = [];
for (const entry of await readdir(modelsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (await exists(join(modelsDir, entry.name, `${entry.name}-1024.png`))) ids.push(entry.name);
  else console.warn(`skipped ${entry.name}: no ${entry.name}-1024.png yet (run its Blender script)`);
}
ids.sort();
// Which models' pictures to make: all of them, or only `--only id,id`, or `--hq` (every model with
// a high-quality render). A whole run encodes 885 models' pictures and takes about an hour; the
// list is always written whole, every model measured from its render, and a picture missing on
// disk is always made.
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > -1 ? new Set((process.argv[onlyAt + 1] ?? '').split(',').filter(Boolean)) : null;
const hqOnly = process.argv.includes('--hq');
for (const id of only ?? []) if (!ids.includes(id)) throw new Error(`--only ${id}: no model of that id with a render`);
const models = [];
for (const id of ids) {
  const hq = await exists(join(hqDir, id, `${id}-1024.png`));
  const model = await buildModel(id, only ? only.has(id) : hqOnly ? hq : true);
  models.push(model);
  const what = model.made ? `wrote ${id}${model.hq ? ' (HQ)' : ''}: ${HEIGHTS.map((h) => `${id}-${h}.webp`).join(', ')}` : `measured ${id}${model.hq ? ' (HQ)' : ''}`;
  console.log(`${what} (${model.units.toFixed(2)} units tall, size ${model.size})`);
}
// An HQ render with no model of the same id here would never be drawn
for (const entry of await readdir(hqDir, { withFileTypes: true })) {
  if (entry.isDirectory() && (await exists(join(hqDir, entry.name, `${entry.name}-1024.png`))) && !ids.includes(entry.name)) {
    console.warn(`skipped the HQ render of ${entry.name}: images/src/models/${entry.name}/ has no model of that id`);
  }
}

const imports = models.flatMap((m) => HEIGHTS.map((h) => `import ${camel(m.id)}${h} from '@/assets/map/landmarkModels/${m.files[h]}';`));
const rows = models.map(
  (m) =>
    `  {\n    id: '${m.id}',\n${m.hq ? '    hq: true,\n' : ''}    name: ${quote(m.name)},\n    latitude: ${m.latitude},\n    longitude: ${m.longitude},\n    maps: ${list(m.maps.map(quote))},\n    landmark: ${m.landmark ? quote(m.landmark) : 'null'},\n${m.onMap ? '' : '    onMap: false,\n'}    aspect: ${m.aspect},\n    size: ${m.size},\n    anchor: [${m.anchor.join(', ')}],\n    images: { ${HEIGHTS.map((h) => `${h}: ${camel(m.id)}${h}`).join(', ')} },\n  },`,
);
await writeFile(
  listFile,
  `// Generated by images/src/tools/landmark-models.mjs from images/src/models/. Don't edit by
// hand: change a model's model.json or its Blender script, then run the tool again.
//
// The little 3D landmark models the country maps draw (CountryMapView's LandmarkModels): each
// stands with its grass tile's middle (\`anchor\`, fractions of the picture from its top left)
// on \`latitude\`/\`longitude\`, on the country maps in \`maps\`. \`aspect\` is width over height,
// \`size\` its height against Big Ben's (every model at one scale), \`images\` the picture by
// its height in pixels. \`landmark\` is the Wikidata item of the
// landmark it belongs to. \`onMap: false\` (only written then) marks a model the maps don't draw:
// a more famous one's picture would overlap it (utils/map/landmarkModelSize.js modelsOnMap).
// \`hq: true\` (only written then) marks a model remade in the high-quality look (a diorama on a
// round base, images/src/models-hq/): the dioramas have one scale of their own, every base the
// same width on the map.
${imports.join('\n')}

export const LANDMARK_MODEL_HEIGHTS = ${list(HEIGHTS)};

export const LANDMARK_MODELS = [
${rows.join('\n')}
];
`,
);
console.log(`wrote ${listFile} (${models.length} model${models.length === 1 ? '' : 's'})`);
