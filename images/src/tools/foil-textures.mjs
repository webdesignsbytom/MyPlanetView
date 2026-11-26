// The metallic finishes' foil (a map design's gold, silver or bronze for the places been to;
// 25 Nov 2026, the user's wish: "shiny colours like gold and silver" that look like real metal,
// not a diagonal gradient). One even shade of the metal everywhere (the same day, the user: "it
// should all be the same shade of gold": broad bands of light and dark left Greenland dark,
// Australia patchy and South Africa pale), with only a fine grain and the faintest ripple in it:
// the shine is the edges' lighting, which every place gets alike. Never lit bumps, which read as a
// hill-shaded relief map. Each brightness goes through the metal's ramp, dark to near white, so
// the grain shimmers as metal does rather than as a tint.
//
// From the repo root (reads no env file):
//   node images/src/tools/foil-textures.mjs
// It writes client/src/assets/map/foil-<gold|silver|bronze>.webp: one picture of the whole map
// (x 0 to 2000, y the North Pole line to the South Pole line), which components/map/VisitedFoil.jsx
// lays under the countries and cuts to the places been to, with the edge's lighting
// (components/map/FoilEdgeFilter.jsx) on top. One picture, not a repeating pattern: a pattern was
// redrawn on every frame of a pan once zoomed in. Seeded, so a re-run writes the same pictures.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = resolve(root, 'client/src/assets/map');

// The map's shape (2000 by 1037.2 map units), at 1.28 pixels a unit: about the screen's own
// size with the whole world in view
const WIDTH = 2560;
const HEIGHT = 1328;
// Band sizes: cells across the picture for the sheet's bands, the flow that bends them, and the
// grain (the cells kept about square)
const SHEET = [8, 16, 32];
const FLOW = [8, 16];
const GRAIN = [640, 1280];
// The look: the metal's shade (its brightness through the ramp), how far the ripple strays from it
// either way, how its few bands flow, and the grain
const LOOK = { shade: 0.66, ripple: 0.025, warp: 0.22, bands: 7, phase: 0.6, grain: 0.04 };
// Each metal from its deepest shadow to a highlight's white (brightness 0 to 1)
const RAMPS = {
  gold: [
    [0, '2e1c02'],
    [0.2, '6e4807'],
    [0.4, 'a8740c'],
    [0.55, 'd09b1c'],
    [0.68, 'e8b934'],
    [0.8, 'f6d35e'],
    [0.9, 'fde89a'],
    [0.97, 'fff6d6'],
    [1, 'ffffff'],
  ],
  silver: [
    [0, '1f2328'],
    [0.2, '4a5058'],
    [0.4, '7d848c'],
    [0.58, 'a9afb6'],
    [0.72, 'c9ced4'],
    [0.85, 'e4e8ec'],
    [0.95, 'f6f8fa'],
    [1, 'ffffff'],
  ],
  bronze: [
    [0, '2a0f04'],
    [0.2, '5c250b'],
    [0.4, '8f4516'],
    [0.55, 'b5622a'],
    [0.68, 'cf7d40'],
    [0.8, 'e59d63'],
    [0.9, 'f4c29a'],
    [0.97, 'fde3cf'],
    [1, 'ffffff'],
  ],
};

const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

// Gradient noise with `across` cells across the picture and as many down as keep them square, the
// lattice wrapping round (so a warped lookup past the edge comes back in)
function gridNoise(across, seed) {
  const down = Math.max(1, Math.round((across * HEIGHT) / WIDTH));
  const random = seeded(seed);
  const gradients = new Float32Array(across * down * 2);
  for (let i = 0; i < across * down; i++) {
    const angle = random() * Math.PI * 2;
    gradients[2 * i] = Math.cos(angle);
    gradients[2 * i + 1] = Math.sin(angle);
  }
  const wrap = (n, size) => ((n % size) + size) % size;
  const dot = (ix, iy, dx, dy) => {
    const k = wrap(iy, down) * across + wrap(ix, across);
    return gradients[2 * k] * dx + gradients[2 * k + 1] * dy;
  };
  return (px, py) => {
    const x = (px / WIDTH) * across;
    const y = (py / HEIGHT) * down;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const u = fade(fx);
    const v = fade(fy);
    return lerp(lerp(dot(x0, y0, fx, fy), dot(x0 + 1, y0, fx - 1, fy), u), lerp(dot(x0, y0 + 1, fx, fy - 1), dot(x0 + 1, y0 + 1, fx - 1, fy - 1), u), v);
  };
}

const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
const throughRamp = (ramp, b) => {
  const at = Math.min(1, Math.max(0, b));
  for (let i = 1; i < ramp.length; i++) {
    if (at <= ramp[i][0]) {
      const [from, low] = ramp[i - 1];
      const [to, high] = ramp[i];
      const t = (at - from) / (to - from);
      const a = rgb(low);
      const c = rgb(high);
      return a.map((value, k) => Math.round(value + (c[k] - value) * t));
    }
  }
  return rgb(ramp.at(-1)[1]);
};

// The brightness at each pixel, the same for every metal (so the three look alike but for their
// colour)
function brightness() {
  const fbm = (layers, x, y) => layers.reduce((sum, layer, i) => sum + layer(x, y) / 2 ** i, 0);
  const sheet = SHEET.map((across, i) => gridNoise(across, 41 + i));
  const warpX = FLOW.map((across, i) => gridNoise(across, 51 + i));
  const warpY = FLOW.map((across, i) => gridNoise(across, 61 + i));
  const grain = GRAIN.map((across, i) => gridNoise(across, 71 + i));
  // The flow's reach, in pixels: as far, for the size of the bands, as on the tile it was tuned on
  const reach = (LOOK.warp * WIDTH) / (SHEET[0] / 2);
  const values = new Float32Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const wx = fbm(warpX, x, y) * reach;
      const wy = fbm(warpY, x, y) * reach;
      const b = LOOK.shade + LOOK.ripple * Math.sin(fbm(sheet, x + wx, y + wy) * LOOK.bands + LOOK.phase);
      values[y * WIDTH + x] = b + (grain[0](x, y) + 0.6 * grain[1](x, y)) * LOOK.grain;
    }
  }
  return values;
}

await mkdir(outDir, { recursive: true });
const values = brightness();
for (const [metal, ramp] of Object.entries(RAMPS)) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
  values.forEach((b, i) => pixels.set(throughRamp(ramp, b), i * 3));
  const file = resolve(outDir, `foil-${metal}.webp`);
  const info = await sharp(pixels, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
    .webp({ quality: 80, effort: 6 })
    .toFile(file);
  console.log(`${file}: ${Math.round(info.size / 1024)} KB`);
}
