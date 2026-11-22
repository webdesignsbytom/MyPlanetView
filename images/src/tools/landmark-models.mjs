// The little 3D landmark models (22 Nov 2026, the user's wish): toy models made in Blender,
// drawn on the country maps at their real place, such as Big Ben at Westminster.
//
// Each model has a folder in images/src/models/<id>/ holding:
//   - <id>.py, the Blender script that builds and renders it (open <id>.blend to tweak it
//     by hand), run as: blender -b --factory-startup -P <id>.py -- <id>-1024.png 1024 <id>.blend
//     It writes <id>-1024.png (transparent) and <id>-1024.json (`anchor`: where the middle
//     of its grass tile falls in the picture, as fractions from the top left);
//   - model.json: `name`, `latitude` and `longitude` (the spot the tile's middle stands on),
//     `maps` (the country maps that show it, e.g. GB and England's XE), and `landmark` (the
//     Wikidata item of the landmark it belongs to, as in the seed's landmark files).
//
// Then, from the repo root: node images/src/tools/landmark-models.mjs
// For each model it trims the render, puts a soft shadow under the tile (baked in, so the
// map draws no blur filter while it pans), and writes client/src/assets/map/landmarkModels/
// <id>-<height>.webp at two heights; then client/src/utils/map/landmarkModels.js, the list
// the country map draws (CountryMapView's LandmarkModels).
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const modelsDir = resolve(root, 'images/src/models');
const assetsDir = resolve(root, 'client/src/assets/map/landmarkModels');
const listFile = resolve(root, 'client/src/utils/map/landmarkModels.js');

// The heights written: the small one for the usual view, the big one once zoomed in
const HEIGHTS = [160, 320];
// The shadow: an ellipse under the tile, this share of the tile's width across, blurred
const SHADOW = { width: 1.12, height: 0.16, blur: 0.025, opacity: 0.3 };

const exists = (file) => access(file).then(() => true, () => false);
const quote = (text) => `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const list = (items) => `[${items.join(', ')}]`;
const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

async function buildModel(id) {
  const dir = join(modelsDir, id);
  const render = join(dir, `${id}-1024.png`);
  const info = JSON.parse(await readFile(join(dir, 'model.json'), 'utf8'));
  const { anchor } = JSON.parse(await readFile(join(dir, `${id}-1024.json`), 'utf8'));
  for (const key of ['name', 'latitude', 'longitude', 'maps']) {
    if (info[key] === undefined) throw new Error(`${id}/model.json has no ${key}`);
  }

  const source = await sharp(render).metadata();
  const { data: trimmed, info: trim } = await sharp(render).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
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
  const shadow = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><ellipse cx="${ax + padX}" cy="${shadowY}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="${SHADOW.opacity}"/></svg>`,
    ),
  )
    .blur(blur)
    .png()
    .toBuffer();
  const full = await sharp(shadow).composite([{ input: trimmed, left: padX, top: 0 }]).png().toBuffer();

  const files = {};
  for (const h of HEIGHTS) {
    const file = `${id}-${h}.webp`;
    await sharp(full).resize({ height: h, kernel: 'lanczos3' }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(join(assetsDir, file));
    files[h] = file;
  }
  return {
    id,
    name: info.name,
    latitude: info.latitude,
    longitude: info.longitude,
    maps: info.maps,
    landmark: info.landmark ?? null,
    aspect: Number((width / height).toFixed(4)),
    anchor: [Number(((ax + padX) / width).toFixed(4)), Number((ay / height).toFixed(4))],
    files,
  };
}

await mkdir(assetsDir, { recursive: true });
const ids = [];
for (const entry of await readdir(modelsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (await exists(join(modelsDir, entry.name, `${entry.name}-1024.png`))) ids.push(entry.name);
  else console.warn(`skipped ${entry.name}: no ${entry.name}-1024.png yet (run its Blender script)`);
}
ids.sort();
const models = [];
for (const id of ids) {
  models.push(await buildModel(id));
  console.log(`wrote ${id}: ${HEIGHTS.map((h) => `${id}-${h}.webp`).join(', ')}`);
}

const imports = models.flatMap((m) => HEIGHTS.map((h) => `import ${camel(m.id)}${h} from '@/assets/map/landmarkModels/${m.files[h]}';`));
const rows = models.map(
  (m) =>
    `  {\n    id: '${m.id}',\n    name: ${quote(m.name)},\n    latitude: ${m.latitude},\n    longitude: ${m.longitude},\n    maps: ${list(m.maps.map(quote))},\n    landmark: ${m.landmark ? quote(m.landmark) : 'null'},\n    aspect: ${m.aspect},\n    anchor: [${m.anchor.join(', ')}],\n    images: { ${HEIGHTS.map((h) => `${h}: ${camel(m.id)}${h}`).join(', ')} },\n  },`,
);
await writeFile(
  listFile,
  `// Generated by images/src/tools/landmark-models.mjs from images/src/models/. Don't edit by
// hand: change a model's model.json or its Blender script, then run the tool again.
//
// The little 3D landmark models the country maps draw (CountryMapView's LandmarkModels): each
// stands with its grass tile's middle (\`anchor\`, fractions of the picture from its top left)
// on \`latitude\`/\`longitude\`, on the country maps in \`maps\`. \`aspect\` is width over height;
// \`images\` the picture by its height in pixels. \`landmark\` is the Wikidata item of the
// landmark it belongs to.
${imports.join('\n')}

export const LANDMARK_MODEL_HEIGHTS = ${list(HEIGHTS)};

export const LANDMARK_MODELS = [
${rows.join('\n')}
];
`,
);
console.log(`wrote ${listFile} (${models.length} model${models.length === 1 ? '' : 's'})`);
