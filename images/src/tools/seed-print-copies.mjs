// Makes each seed photo's PRINT copy, as the browser makes one for an Economy map
// (client/src/utils/photos/makePhotoCopies.js): the original drawn with its longest side
// at most 2,400 px, a JPEG with no metadata, quality 85 (then 75, 65) to stay within the
// server's 5 MB. Writes seed-photos/<slug>/print.jpg and adds `PRINT` to each entry's
// `files` in seed-photos/photos.json; the seed uploads it instead of the ORIGINAL when
// the map's owner is on Economy (server/prisma/seed/photos.js).
//   node images/src/tools/seed-print-copies.mjs      (from the repo root)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DIR = path.join(ROOT, 'seed-photos');
const PRINT_EDGE = 2400;
const PRINT_QUALITIES = [85, 75, 65];
const PRINT_MAX_BYTES = 5 * 1024 * 1024;

const manifestFile = path.join(DIR, 'photos.json');
const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));

for (const entry of manifest) {
  const original = path.join(DIR, entry.slug, entry.files.ORIGINAL.file);
  let made = null;
  for (const quality of PRINT_QUALITIES) {
    // sharp writes no metadata unless asked, as a canvas drops it
    const { data, info } = await sharp(original)
      .rotate()
      .resize({ width: PRINT_EDGE, height: PRINT_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    if (data.length <= PRINT_MAX_BYTES) {
      made = { data, info };
      break;
    }
  }
  if (!made) throw new Error(`${entry.slug}: no print copy within 5 MB`);
  await fs.writeFile(path.join(DIR, entry.slug, 'print.jpg'), made.data);
  // PRINT after ORIGINAL, keeping the other files' order
  entry.files = {
    ...entry.files,
    PRINT: { file: 'print.jpg', contentType: 'image/jpeg', bytes: made.data.length, width: made.info.width, height: made.info.height },
  };
  console.log(`${entry.slug}: ${made.info.width}×${made.info.height}, ${(made.data.length / 1024).toFixed(0)} KB`);
}

await fs.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated ${path.relative(ROOT, manifestFile)}`);
