// The map as a printed poster (22 Nov 2026, the user's wish, from the business review: "your
// map as a printed poster: the best fit" of the things to sell). The print-ready file is made
// here, in the browser, as the share card is (it reuses its map drawing): landscape, at a
// paper size and 300 dpi, the map's name over the world with the places visited or lived in
// coloured in, a line of numbers, and the places' names under it if wanted. Printing and
// posting it needs a print partner later; any print shop takes the file meanwhile.
import { POSTER_COLOURS } from '@/utils/constants/brandColours';
import { DISPLAY_BUSINESS_URL } from '@/utils/constants/constants';
import { cleanCountryColours } from '@/utils/map/mapDesign';
import {
  MAP_BOTTOM_NO_ANTARCTICA,
  MAP_BOTTOM_WITH_ANTARCTICA,
  MAP_TOP,
  MAP_WIDTH,
  drawMap,
  fittedText,
  font,
  loadFonts,
  nameLines,
  namesOf,
} from '@/utils/shareCard/drawShareCard';
import { pngWithDpi } from './pngDpi';

// Paper sizes, landscape (width × height in millimetres)
export const POSTER_SIZES = Object.freeze([
  { id: 'A4', label: 'A4 (29.7 × 21 cm)', mm: [297, 210] },
  { id: 'A3', label: 'A3 (42 × 29.7 cm)', mm: [420, 297] },
  { id: 'A2', label: 'A2 (59.4 × 42 cm)', mm: [594, 420] },
  { id: '70x50', label: '70 × 50 cm', mm: [700, 500] },
]);
export const POSTER_LOOKS = Object.freeze([
  { id: 'atlas', label: 'Blue sea' },
  { id: 'paper', label: 'Old paper' },
]);
// Print quality; a browser that can't draw a canvas that big (phones' are smaller) gets the
// next that fits
export const PRINT_DPI = 300;
const FALLBACK_DPI = [300, 250, 200, 150];

export const posterSize = (id) => POSTER_SIZES.find((size) => size.id === id) ?? POSTER_SIZES[1];

/** A paper size's pixels at `dpi`: `{ width, height }`. */
export function posterPixels(sizeId, dpi = PRINT_DPI) {
  const [w, h] = posterSize(sizeId).mm;
  return { width: Math.round((w / 25.4) * dpi), height: Math.round((h / 25.4) * dpi) };
}

/** Can this browser draw (and read back) a canvas this big? */
function canvasFits(width, height) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillRect(width - 1, height - 1, 1, 1);
    const ok = ctx.getImageData(width - 1, height - 1, 1, 1).data[3] !== 0;
    canvas.width = 0;
    canvas.height = 0;
    return ok;
  } catch {
    return false;
  }
}

/** The best this browser can do for a paper size: `{ width, height, dpi }`, or null. */
export function printablePixels(sizeId) {
  for (const dpi of FALLBACK_DPI) {
    const pixels = posterPixels(sizeId, dpi);
    if (canvasFits(pixels.width, pixels.height)) return { ...pixels, dpi };
  }
  return null;
}

/**
 * Draw the poster on a new canvas of `width` × `height` (landscape). `title` (the map's
 * name), `subtitle` (a line of numbers), `highlight` (the places to colour in), `splitUk`,
 * `colours` (a map design's country colours, or null), `look` ('atlas' or 'paper') and
 * `showNames` (the places' names under the map). -> the canvas
 */
export async function drawMapPoster({ width, height, title, subtitle = '', highlight = [], splitUk = false, colours = null, look = 'atlas', showNames = true }) {
  await loadFonts();
  const palette = POSTER_COLOURS[look] ?? POSTER_COLOURS.atlas;
  const u = height / 1000; // the layout's unit: a thousandth of the height
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const marked = new Set(highlight);

  // The paper and its frame: a thick line and a thin one inside it
  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = palette.frame;
  ctx.lineWidth = 7 * u;
  ctx.strokeRect(28 * u, 28 * u, width - 56 * u, height - 56 * u);
  ctx.lineWidth = 2 * u;
  ctx.strokeRect(44 * u, 44 * u, width - 88 * u, height - 88 * u);

  // The title, and the numbers under it
  const middle = width / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = palette.title;
  fittedText(ctx, title || 'My travels', { x: middle, y: 160 * u, width: width - 260 * u, max: 112 * u, min: 48 * u, family: 'TravelFont', step: 2 * u });
  if (subtitle) {
    ctx.fillStyle = palette.brown;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${4 * u}px`;
    fittedText(ctx, subtitle.toUpperCase(), { x: middle, y: 222 * u, width: width - 300 * u, max: 34 * u, min: 18 * u, family: 'Poppins', weight: '600', step: u });
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  // The places' names under the map (up to three lines), measured first to leave them room
  const nameSize = 22 * u;
  ctx.font = font(nameSize, 'Poppins', '500');
  const names = showNames ? namesOf(marked) : [];
  const lines = names.length ? nameLines(ctx, names, width - 300 * u, 3) : [];
  const namesHeight = lines.length ? 28 * u + lines.length * 34 * u : 0;

  // The world, as big as fits between the numbers and the foot; Antarctica only when it's
  // one of the places
  const withAntarctica = marked.has('AQ') || marked.has('XS');
  const extent = (withAntarctica ? MAP_BOTTOM_WITH_ANTARCTICA : MAP_BOTTOM_NO_ANTARCTICA) - MAP_TOP;
  const top = 262 * u;
  const bottom = height - 118 * u - namesHeight;
  const boxWidth = Math.min(width - 180 * u, ((bottom - top) * MAP_WIDTH) / extent);
  const box = { x: (width - boxWidth) / 2, y: 0, width: boxWidth, height: (boxWidth * extent) / MAP_WIDTH };
  box.y = top + (bottom - top - box.height) / 2;
  drawMap(ctx, {
    box,
    highlight: marked,
    splitUk,
    colours: cleanCountryColours(colours),
    withAntarctica,
    palette,
    edgeWidth: Math.max(1, width * 0.0005),
    dotRadius: width * 0.003,
    frameWidth: 3 * u,
  });

  ctx.fillStyle = palette.ink;
  ctx.font = font(nameSize, 'Poppins', '500');
  lines.forEach((text, i) => ctx.fillText(text, middle, box.y + box.height + 28 * u + 24 * u + i * 34 * u));

  // The site, small, at the foot
  ctx.fillStyle = palette.brown;
  ctx.font = font(20 * u, 'Poppins', '600');
  ctx.fillText(DISPLAY_BUSINESS_URL, middle, height - 70 * u);
  return canvas;
}

/** The canvas as a PNG that says its print resolution (`dpi`). */
export async function posterPng(canvas, dpi = PRINT_DPI) {
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((made) => (made ? resolve(made) : reject(new Error('The poster couldn’t be made: try a smaller size.'))), 'image/png'),
  );
  return new Blob([pngWithDpi(new Uint8Array(await blob.arrayBuffer()), dpi)], { type: 'image/png' });
}
