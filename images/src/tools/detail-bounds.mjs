// Writes client/src/utils/map/detailShapeBounds.js again from the detailed outlines already in
// client/src/utils/map/detailShapes/ (no Natural Earth file needed): country-outlines.mjs
// writes the same file with every run; this is for when only the bounds' grouping changes.
// Run from the repo root: node images/src/tools/detail-bounds.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { detailBoundsSource } from './lib/detailBounds.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DETAIL_DIR = path.join(ROOT, 'client/src/utils/map/detailShapes');
const DETAIL_BOUNDS = path.join(ROOT, 'client/src/utils/map/detailShapeBounds.js');

// 'M 1 2 3 4 …' (the tool's paths: a move, then points) -> [[1, 2], [3, 4], …]
const pointsOf = (d) => {
  const numbers = d.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number);
  const pts = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) pts.push([numbers[i], numbers[i + 1]]);
  return pts;
};

const parts = {};
for (const file of fs.readdirSync(DETAIL_DIR).filter((name) => /^[A-Z]{2}\.js$/.test(name))) {
  const { default: paths } = await import(pathToFileURL(path.join(DETAIL_DIR, file)).href);
  parts[file.slice(0, 2)] = paths.flatMap((d) => d.split(/(?=M)/).map(pointsOf));
}
fs.writeFileSync(DETAIL_BOUNDS, detailBoundsSource(parts, 'images/src/tools/country-outlines.mjs (or detail-bounds.mjs)'));
const boxes = Object.values(parts).length;
console.log(`detailShapeBounds.js: ${boxes} places`);
