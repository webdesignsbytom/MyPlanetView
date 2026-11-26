// The pictures on Settings' map style and map type cards (MapStylePicker, MapTypePicker): a
// strip cut from the middle of each style's picture, the shape of a card (about 4:1, 64 px
// tall), 320 and 640 wide, as AVIF and WebP. The cards loaded the 800 to 949 pixel copies
// before (26 Nov 2026, the audit).
//
// From the repo root, after a style's picture changes or a style is added:
//   node images/src/tools/style-previews.mjs
// It reads only client/src/assets/images/map-styles/ and writes
// preview-<name>-<width>.avif|webp there (never named like a background's own set, which
// getImageSets would mix in).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DIR = path.join(ROOT, 'client/src/assets/images/map-styles');
// Every picture a card shows: the styles' backgrounds and previews (utils/map/mapStyles.js),
// and the map types' (utils/map/mapTypes.js)
const NAMES = ['old-map', 'starry-night', 'engraved-ocean', 'regular', 'detailed'];
const WIDTHS = [320, 640];
const ASPECT = 4; // width over height
const FORMATS = [
  ['avif', { quality: 55, effort: 5, chromaSubsampling: '4:2:0' }],
  ['webp', { quality: 72 }],
];

// The biggest copy there is of a set, best a JPEG (the least compressed), as the source
async function sourceOf(name, files) {
  const own = files
    .map((file) => file.match(new RegExp(`^${name}-(\\d+)\\.(jpg|webp|avif)$`)))
    .filter(Boolean)
    .map((m) => ({ file: m[0], width: Number(m[1]), rank: ['jpg', 'webp', 'avif'].indexOf(m[2]) }))
    .sort((a, b) => b.width - a.width || a.rank - b.rank);
  if (!own.length) throw new Error(`No picture for ${name} in ${DIR}`);
  return path.join(DIR, own[0].file);
}

const files = await fs.readdir(DIR);
for (const name of NAMES) {
  const source = await sourceOf(name, files);
  for (const width of WIDTHS) {
    for (const [ext, options] of FORMATS) {
      const out = path.join(DIR, `preview-${name}-${width}.${ext}`);
      await sharp(source)
        .resize(width, Math.round(width / ASPECT), { fit: 'cover', position: 'centre' })
        [ext](options)
        .toFile(out);
      const { size } = await fs.stat(out);
      console.log(`${path.basename(out)}  ${(size / 1024).toFixed(1)} KB  (from ${path.basename(source)})`);
    }
  }
}
