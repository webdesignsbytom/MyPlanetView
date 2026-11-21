// The share card (21 Nov 2026, the user's wish, from the business review: "one tap makes an
// image of your map ... for Instagram stories and WhatsApp"): a picture of a map in the
// poster look, drawn on a canvas in the browser, nothing sent anywhere. Portrait, 1080 × 1350
// (Instagram's 4:5; WhatsApp and stories show it whole). The places in `highlight` wear
// their pastel (or the map design's colour), the rest plain land; under the map, up to three
// big numbers. It never shows a photo, a pin or a name other than the title.
import { COUNTRIES, COUNTRY_BY_CODE } from '@/utils/map/countries';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { UK_NATION_SHAPES } from '@/utils/map/ukNationShapes';
import { REGION_PARENT } from '@/utils/map/regionPlaces';
import { isAntarctic, isPole } from '@/utils/map/specialPlaces';
import { pastelNumberFor } from '@/utils/map/visitStatus';
import { cleanCountryColours } from '@/utils/map/mapDesign';
import { SHARE_CARD_COLOURS as C } from '@/utils/constants/brandColours';
import { DISPLAY_BUSINESS_URL } from '@/utils/constants/constants';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

const MAP_WIDTH = 2000; // the projection's width (utils/map/projection.js)
const MAP_TOP = -5; // just above the northernmost land
const MAP_BOTTOM_NO_ANTARCTICA = 860;
const MAP_BOTTOM_WITH_ANTARCTICA = 1022;

const SHAPED = COUNTRIES.filter((c) => COUNTRY_SHAPES[c.code]);
const SHAPED_SPLIT_UK = [...SHAPED.filter((c) => c.code !== 'GB'), ...COUNTRIES.filter((c) => c.kind === 'NATION')];
const DOTTED = COUNTRIES.filter((c) => !COUNTRY_SHAPES[c.code] && !isPole(c.code) && c.kind !== 'NATION');
const shapesOf = (code) => COUNTRY_SHAPES[code] ?? UK_NATION_SHAPES[code] ?? [];

// Path2D objects are made once a session (the shapes never change)
const pathCache = new Map();
function pathsOf(code) {
  if (!pathCache.has(code)) pathCache.set(code, shapesOf(code).map((d) => new Path2D(d)));
  return pathCache.get(code);
}

async function loadFonts() {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load('84px TravelFont'),
      document.fonts.load('600 34px Poppins'),
      document.fonts.load('500 30px Poppins'),
    ]);
  } catch {
    // The card is still drawn, in the browser's own fonts
  }
}

const font = (size, family = 'TravelFont', weight = '') => `${weight ? `${weight} ` : ''}${size}px ${family}`;

/** Draw `text` centred at `y` at the largest size from `max` down to `min` that fits `width`, else cut short. */
function fittedText(ctx, text, { x, y, width, max, min, family, weight }) {
  let size = max;
  ctx.font = font(size, family, weight);
  while (size > min && ctx.measureText(text).width > width) {
    size -= 2;
    ctx.font = font(size, family, weight);
  }
  let shown = text;
  while (shown.length > 1 && ctx.measureText(shown).width > width) shown = `${shown.slice(0, -2).trimEnd()}…`;
  ctx.fillText(shown, x, y);
  return size;
}

/** The places' names, A to Z: countries, the UK's nations and special places (a region's country is listed already). */
const namesOf = (codes) =>
  [...codes]
    .map((code) => COUNTRY_BY_CODE[code])
    .filter((place) => place && place.kind !== 'REGION')
    .map((place) => place.name)
    .sort((a, b) => a.localeCompare(b));

/**
 * The names as lines of at most `width`, joined by " · ", at most `maxLines`; the last says
 * "and N more" when they don't all fit.
 */
function nameLines(ctx, names, width, maxLines) {
  const lines = [];
  let line = '';
  for (let i = 0; i < names.length; i++) {
    const next = line ? `${line} · ${names[i]}` : names[i];
    if (ctx.measureText(next).width <= width || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = names[i];
    if (lines.length === maxLines) {
      // Out of room: the last line makes way for the count of the rest
      let last = lines.pop();
      let shownCount = lines.reduce((n, l) => n + l.split(' · ').length, 0) + last.split(' · ').length;
      const more = () => ` · and ${names.length - shownCount} more`;
      while (last.includes(' · ') && ctx.measureText(`${last}${more()}`).width > width) {
        last = last.slice(0, last.lastIndexOf(' · '));
        shownCount -= 1;
      }
      lines.push(`${last}${more()}`);
      return lines;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The colour a highlighted place wears: the design's (a region its country's), else its pastel. */
function fillFor(code, colours) {
  if (colours[code]) return colours[code];
  const parent = REGION_PARENT[code];
  if (parent && colours[parent]) return colours[parent];
  if (code === 'AQ') return C.ice;
  return C.visits[pastelNumberFor(code) - 1] ?? C.visits[0];
}

function drawMap(ctx, { box, highlight, splitUk, colours, withAntarctica }) {
  const bottom = withAntarctica ? MAP_BOTTOM_WITH_ANTARCTICA : MAP_BOTTOM_NO_ANTARCTICA;
  const scale = box.width / MAP_WIDTH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.fillStyle = C.sea;
  ctx.fillRect(box.x, box.y, box.width, box.height);

  ctx.translate(box.x, box.y - MAP_TOP * scale);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.8 / scale;
  for (const place of splitUk ? SHAPED_SPLIT_UK : SHAPED) {
    const antarctic = isAntarctic(place.code);
    if (antarctic && !withAntarctica) continue;
    const marked = highlight.has(place.code);
    ctx.fillStyle = marked ? fillFor(place.code, colours) : antarctic ? C.ice : C.land;
    ctx.strokeStyle = antarctic ? C.iceEdge : C.landEdge;
    for (const path of pathsOf(place.code)) {
      ctx.fill(path);
      ctx.stroke(path);
    }
  }
  // The micro-states and other dots, when marked (Monaco, Singapore, Goa)
  for (const place of DOTTED) {
    if (!highlight.has(place.code) || place.pinY > bottom) continue;
    ctx.beginPath();
    ctx.arc(place.pinX, place.pinY, 5 / scale, 0, Math.PI * 2);
    ctx.fillStyle = fillFor(place.code, colours);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  return (bottom - MAP_TOP) * scale;
}

/**
 * The card as a PNG blob. `title` (the map's name, or "2026 in travel"), `kicker` (a small
 * line above it), `highlight` (place codes to colour in), `stats` ([{ value, label }], at
 * most three, drawn big under the map), `splitUk` (the UK as its four nations, as the map
 * shows it), `colours` (a map design's country colours, or null).
 */
export async function drawShareCard({ title, kicker = '', highlight = [], stats = [], splitUk = false, colours = null }) {
  await loadFonts();
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  const marked = new Set(highlight);
  const ownColours = cleanCountryColours(colours);

  // The poster frame, then the paper
  ctx.fillStyle = C.frame;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = C.paper;
  ctx.fillRect(32, 32, CARD_WIDTH - 64, CARD_HEIGHT - 64);
  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(50, 50, CARD_WIDTH - 100, CARD_HEIGHT - 100);
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const middle = CARD_WIDTH / 2;
  if (kicker) {
    ctx.fillStyle = C.brown;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
    fittedText(ctx, kicker.toUpperCase(), { x: middle, y: 124, width: 900, max: 30, min: 20, family: 'Poppins', weight: '600' });
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  ctx.fillStyle = C.title;
  fittedText(ctx, title, { x: middle, y: 214, width: 920, max: 84, min: 44, family: 'TravelFont' });

  // The map, Antarctica only when it's one of the places
  const withAntarctica = marked.has('AQ') || marked.has('XS');
  const box = { x: 70, y: 262, width: CARD_WIDTH - 140, height: 0 };
  box.height = ((withAntarctica ? MAP_BOTTOM_WITH_ANTARCTICA : MAP_BOTTOM_NO_ANTARCTICA) - MAP_TOP) * (box.width / MAP_WIDTH);
  const mapHeight = drawMap(ctx, { box, highlight: marked, splitUk, colours: ownColours, withAntarctica });

  // Up to three big numbers, evenly across, then the places' names: together, centred in
  // the room between the map and the foot
  const shown = stats.slice(0, 3);
  const roomTop = box.y + mapHeight + 30;
  const roomBottom = CARD_HEIGHT - 175;
  const statsHeight = shown.length ? 190 : 0;
  ctx.font = font(28, 'Poppins', '500');
  const names = namesOf(marked);
  const lines = names.length ? nameLines(ctx, names, CARD_WIDTH - 180, Math.max(1, Math.floor((roomBottom - roomTop - statsHeight - 20) / 40))) : [];
  const blockHeight = statsHeight + (lines.length ? 20 + lines.length * 40 : 0);
  const blockTop = roomTop + Math.max(0, (roomBottom - roomTop - blockHeight) / 2);

  const column = (CARD_WIDTH - 140) / Math.max(1, shown.length);
  shown.forEach((stat, i) => {
    const x = 70 + column * i + column / 2;
    const value = typeof stat.value === 'number' ? stat.value.toLocaleString('en-GB') : String(stat.value);
    ctx.fillStyle = C.title;
    fittedText(ctx, value, { x, y: blockTop + 110, width: column - 30, max: withAntarctica ? 110 : 130, min: 50, family: 'TravelFont' });
    ctx.fillStyle = C.ink;
    fittedText(ctx, stat.label, { x, y: blockTop + 165, width: column - 20, max: 34, min: 22, family: 'Poppins', weight: '600' });
  });

  ctx.fillStyle = C.brown;
  ctx.font = font(28, 'Poppins', '500');
  lines.forEach((text, i) => ctx.fillText(text, middle, blockTop + statsHeight + 20 + 28 + i * 40));

  // The site, at the foot
  ctx.fillStyle = C.strip;
  ctx.fillRect(50, CARD_HEIGHT - 150, CARD_WIDTH - 100, 100);
  ctx.fillStyle = C.brown;
  ctx.fillRect(50, CARD_HEIGHT - 150, CARD_WIDTH - 100, 3);
  ctx.fillStyle = C.ink;
  fittedText(ctx, DISPLAY_BUSINESS_URL, { x: middle, y: CARD_HEIGHT - 86, width: 900, max: 36, min: 24, family: 'Poppins', weight: '600' });

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The picture couldn’t be made.'))), 'image/png'),
  );
}
