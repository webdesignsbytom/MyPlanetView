// The map as a printed poster (22 Nov 2026, the user's wish, from the business review: "your
// map as a printed poster: the best fit" of the things to sell). The print-ready file is made
// here, in the browser, as the share card is (it reuses its map drawing): landscape, at a
// paper size and 300 dpi, the map's name over the world with the places visited or lived in
// coloured in, a line of numbers, and the places' names under it if wanted. Printing and
// posting it needs a print partner later; any print shop takes the file meanwhile.
import { POSTER_COLOURS } from '@/utils/constants/brandColours';
import { DISPLAY_BUSINESS_URL } from '@/utils/constants/constants';
import { cleanCountryColours } from '@/utils/map/mapDesign';
import { MAP_STYLES } from '@/utils/map/mapStyles';
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
// The pictured seas, as big as the site has them (the map style's own background)
import oldMapSea from '@/assets/images/map-styles/old-map-1792.webp';
import starryNightSea from '@/assets/images/map-styles/starry-night-2560.webp';
import engravedOceanSea from '@/assets/images/map-styles/engraved-ocean-1774.webp';

// Paper sizes, landscape (width × height in millimetres)
export const POSTER_SIZES = Object.freeze([
  { id: 'A4', label: 'A4 (29.7 × 21 cm)', mm: [297, 210] },
  { id: 'A3', label: 'A3 (42 × 29.7 cm)', mm: [420, 297] },
  { id: 'A2', label: 'A2 (59.4 × 42 cm)', mm: [594, 420] },
  { id: '70x50', label: '70 × 50 cm', mm: [700, 500] },
]);
// A size of the person's own (27 Nov 2026, the user's wish): each side in centimetres, either
// way round (a tall one too), within these
export const CUSTOM_SIZE = 'custom';
export const CUSTOM_CM_MIN = 10;
export const CUSTOM_CM_MAX = 150;

// The looks: every map style, named as Settings names them (27 Nov 2026, the user's wish: "all
// the map types as the look options"), then the sepia "Old paper". A pictured style's sea is
// its own picture (`picture`); the colours are POSTER_COLOURS'.
const SEA_PICTURES = { 'old-map': oldMapSea, starry: starryNightSea, engraved: engravedOceanSea };
export const POSTER_LOOKS = Object.freeze([
  ...MAP_STYLES.map((style) => Object.freeze({ id: style.id, label: style.label, picture: SEA_PICTURES[style.id] ?? null })),
  Object.freeze({ id: 'paper', label: 'Old paper', picture: null }),
]);
export const posterLook = (id) => POSTER_LOOKS.find((look) => look.id === id) ?? POSTER_LOOKS[0];

// Print quality; a browser that can't draw a canvas that big (phones' are smaller) gets the
// next that fits (100 dpi only for the biggest custom sizes)
export const PRINT_DPI = 300;
const FALLBACK_DPI = [300, 250, 200, 150, 100];

/** A paper size, by its id or as a size itself (a custom one): `{ id, label, mm }`. */
export const posterSize = (size) => (size && typeof size === 'object' && size.mm ? size : (POSTER_SIZES.find((known) => known.id === size) ?? POSTER_SIZES[1]));

const cmWords = (cm) => cm.toLocaleString('en-GB', { maximumFractionDigits: 1 });

/** A custom size from its sides in centimetres (to a millimetre): "60 × 40 cm". */
export function customSize(widthCm, heightCm) {
  const width = Math.round(widthCm * 10) / 10;
  const height = Math.round(heightCm * 10) / 10;
  return Object.freeze({
    id: CUSTOM_SIZE,
    label: `${cmWords(width)} × ${cmWords(height)} cm`,
    file: `${width}x${height}cm`,
    mm: Object.freeze([Math.round(width * 10), Math.round(height * 10)]),
  });
}

/**
 * The custom size typed in the two boxes (centimetres; a comma for the decimal point too):
 * `{ size }`, or `{ error }` in words when a side is missing, not a number or out of range.
 */
export function parseCustomSize(widthText, heightText) {
  const sides = [widthText, heightText].map((text) => String(text ?? '').trim().replace(',', '.'));
  const [width, height] = sides.map((text) => (/^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN));
  if (!sides[0] || !sides[1]) return { error: 'Type the width and the height in centimetres.' };
  if (!Number.isFinite(width) || !Number.isFinite(height)) return { error: 'The width and the height are numbers of centimetres, such as 60 or 42.5.' };
  if ([width, height].some((cm) => cm < CUSTOM_CM_MIN || cm > CUSTOM_CM_MAX)) {
    return { error: `Each side is ${CUSTOM_CM_MIN} to ${CUSTOM_CM_MAX} cm.` };
  }
  return { size: customSize(width, height) };
}

/** The file name's part for a size: "A3", "60x40cm". */
export const posterFilePart = (size) => posterSize(size).file ?? posterSize(size).id;

/** A paper size's pixels at `dpi`: `{ width, height }`. */
export function posterPixels(size, dpi = PRINT_DPI) {
  const [w, h] = posterSize(size).mm;
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

/** The best this browser can do for a paper size (an id or a size): `{ width, height, dpi }`, or null. */
export function printablePixels(size) {
  for (const dpi of FALLBACK_DPI) {
    const pixels = posterPixels(size, dpi);
    if (canvasFits(pixels.width, pixels.height)) return { ...pixels, dpi };
  }
  return null;
}

// The pictured seas, each loaded once a visit (a failed one is tried again next time)
const pictures = new Map();
function loadPicture(url) {
  if (!pictures.has(url)) {
    const loading = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    }).then((image) => {
      if (!image) pictures.delete(url);
      return image;
    });
    pictures.set(url, loading);
  }
  return pictures.get(url);
}

/**
 * Draw the poster on a new canvas of `width` × `height` (landscape, or tall for a custom
 * size). `title` (the map's name), `subtitle` (a line of numbers), `highlight` (the places to
 * colour in), `splitUk`, `colours` (a map design's country colours, or null), `look` (a
 * POSTER_LOOKS id: a map style's, or 'paper') and `showNames` (the places' names under the
 * map). A pictured sea that can't load leaves the style's plain sea colour. -> the canvas
 */
export async function drawMapPoster({ width, height, title, subtitle = '', highlight = [], splitUk = false, colours = null, look = 'animated', showNames = true }) {
  const shown = posterLook(look);
  const [, seaPicture] = await Promise.all([loadFonts(), shown.picture ? loadPicture(shown.picture) : null]);
  const palette = POSTER_COLOURS[shown.id] ?? POSTER_COLOURS.animated;
  // The layout's unit: a thousandth of the height on the usual landscape sheets (to 1.4 : 1),
  // of the width over 1.4 on a narrower one, so a square or tall custom size keeps its
  // lettering and margins in proportion
  const u = Math.min(height, width / 1.4) / 1000;
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

  const middle = width / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

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
  const room = bottom - top - box.height;
  box.y = top + room / 2;
  // On a square or tall custom sheet the world, as wide as the sheet, leaves room above and
  // below it: the title and the numbers come down with it, so they sit together in the middle
  // (the usual landscape sheets, 1.4 : 1 and wider, as they were)
  const drop = width < height * 1.4 ? Math.max(0, room / 2) : 0;

  // The title, and the numbers under it
  ctx.fillStyle = palette.title;
  fittedText(ctx, title || 'My travels', { x: middle, y: 160 * u + drop, width: width - 260 * u, max: 112 * u, min: 48 * u, family: 'TravelFont', step: 2 * u });
  if (subtitle) {
    ctx.fillStyle = palette.brown;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${4 * u}px`;
    fittedText(ctx, subtitle.toUpperCase(), { x: middle, y: 222 * u + drop, width: width - 300 * u, max: 34 * u, min: 18 * u, family: 'Poppins', weight: '600', step: u });
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  drawMap(ctx, {
    box,
    highlight: marked,
    splitUk,
    colours: cleanCountryColours(colours),
    withAntarctica,
    palette,
    seaPicture,
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
