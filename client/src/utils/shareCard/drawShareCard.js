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

// The map's drawing is shared with the map poster (utils/poster/drawMapPoster.js)
export const MAP_WIDTH = 2000; // the projection's width (utils/map/projection.js)
export const MAP_TOP = -5; // just above the northernmost land
export const MAP_BOTTOM_NO_ANTARCTICA = 860;
export const MAP_BOTTOM_WITH_ANTARCTICA = 1022;

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

export async function loadFonts() {
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

export const font = (size, family = 'TravelFont', weight = '') => `${weight ? `${weight} ` : ''}${size}px ${family}`;

/** Draw `text` centred at `y` at the largest size from `max` down to `min` that fits `width`, else cut short. */
export function fittedText(ctx, text, { x, y, width, max, min, family, weight, step = 2 }) {
  let size = max;
  ctx.font = font(size, family, weight);
  while (size > min && ctx.measureText(text).width > width) {
    size -= step;
    ctx.font = font(size, family, weight);
  }
  let shown = text;
  while (shown.length > 1 && ctx.measureText(shown).width > width) shown = `${shown.slice(0, -2).trimEnd()}…`;
  ctx.fillText(shown, x, y);
  return size;
}

/** The places' names, A to Z: countries, the UK's nations and special places (a region's country is listed already). */
export const namesOf = (codes) =>
  [...codes]
    .map((code) => COUNTRY_BY_CODE[code])
    .filter((place) => place && place.kind !== 'REGION')
    .map((place) => place.name)
    .sort((a, b) => a.localeCompare(b));

/**
 * The names as lines of at most `width`, joined by " · ", at most `maxLines`; the last says
 * "and N more" when they don't all fit.
 */
export function nameLines(ctx, names, width, maxLines) {
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

/**
 * The world map in `box` (its height follows the width). `palette` (sea, land, edges, ice,
 * frame) and the line widths and dot radius, in canvas pixels, default to the share card's;
 * the poster draws it bigger in its own colours. -> the map's height in pixels
 */
export function drawMap(ctx, { box, highlight, splitUk, colours, withAntarctica, palette = C, edgeWidth = 0.8, dotRadius = 5, frameWidth = 3 }) {
  const bottom = withAntarctica ? MAP_BOTTOM_WITH_ANTARCTICA : MAP_BOTTOM_NO_ANTARCTICA;
  const scale = box.width / MAP_WIDTH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.fillStyle = palette.sea;
  ctx.fillRect(box.x, box.y, box.width, box.height);

  ctx.translate(box.x, box.y - MAP_TOP * scale);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineWidth = edgeWidth / scale;
  for (const place of splitUk ? SHAPED_SPLIT_UK : SHAPED) {
    const antarctic = isAntarctic(place.code);
    if (antarctic && !withAntarctica) continue;
    const marked = highlight.has(place.code);
    ctx.fillStyle = marked ? fillFor(place.code, colours) : antarctic ? palette.ice : palette.land;
    ctx.strokeStyle = antarctic ? palette.iceEdge : palette.landEdge;
    for (const path of pathsOf(place.code)) {
      ctx.fill(path);
      ctx.stroke(path);
    }
  }
  // The micro-states and other dots, when marked (Monaco, Singapore, Goa)
  for (const place of DOTTED) {
    if (!highlight.has(place.code) || place.pinY > bottom) continue;
    ctx.beginPath();
    ctx.arc(place.pinX, place.pinY, dotRadius / scale, 0, Math.PI * 2);
    ctx.fillStyle = fillFor(place.code, colours);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = palette.brown;
  ctx.lineWidth = frameWidth;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  return (bottom - MAP_TOP) * scale;
}

// A five-pointed star's corners round (cx, cy), the outer ones `r` out
function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 ? r * 0.42 : r;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

/**
 * A country collection's medal (24 Nov 2026), standing in `box` where a card's map goes: a
 * ribbon of two red straps from the top, then the disc in its metal (`tier`: bronze, silver
 * or gold), with its rim, an inner ring, a star and the metal's name.
 */
export function drawMedal(ctx, { box, tier }) {
  const metal = C.medals[tier] || C.medals.gold;
  const cx = box.x + box.width / 2;
  const r = Math.min(box.height * 0.42, box.width * 0.32);
  const cy = box.y + box.height - r - 12;
  const top = box.y;
  const strap = r * 0.42;
  // The straps, crossing to the disc's top
  [
    [cx - r * 0.95, cx - r * 0.95 + strap, cx + r * 0.25, cx + r * 0.25 - strap, C.ribbon[0]],
    [cx + r * 0.95, cx + r * 0.95 - strap, cx - r * 0.25, cx - r * 0.25 + strap, C.ribbon[1]],
  ].forEach(([x1, x2, x3, x4, colour]) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x1, top);
    ctx.lineTo(x2, top);
    ctx.lineTo(x3, cy - r * 0.55);
    ctx.lineTo(x4, cy - r * 0.55);
    ctx.closePath();
    ctx.fill();
  });
  // The disc, its rim and an inner ring
  ctx.fillStyle = metal.face;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = metal.rim;
  ctx.lineWidth = r * 0.09;
  ctx.stroke();
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  // The star, and the metal's name under it
  ctx.fillStyle = metal.rim;
  starPath(ctx, cx, cy - r * 0.14, r * 0.38);
  ctx.fill();
  fittedText(ctx, String(tier).toUpperCase(), { x: cx, y: cy + r * 0.56, width: r * 1.2, max: Math.round(r * 0.3), min: 18, family: 'TravelFont' });
}

/**
 * The card as a PNG blob. `title` (the map's name, or "2026 in travel"), `kicker` (a small
 * line above it), `highlight` (place codes to colour in), `stats` ([{ value, label }], at
 * most three, drawn big under the map), `splitUk` (the UK as its four nations, as the map
 * shows it), `colours` (a map design's country colours, or null). `medal` (bronze, silver or
 * gold: a country collection's card) draws that medal where the map goes.
 */
export async function drawShareCard({ title, kicker = '', highlight = [], stats = [], splitUk = false, colours = null, medal = null }) {
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
  let mapHeight = box.height;
  if (medal) drawMedal(ctx, { box, tier: medal });
  else mapHeight = drawMap(ctx, { box, highlight: marked, splitUk, colours: ownColours, withAntarctica });

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
