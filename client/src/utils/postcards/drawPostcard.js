// A postcard drawn on two canvases, front and back (26 Nov 2026, the user's wish: "a selection of
// images, and a selection of styles ... cool stamps and address area ... people can download them
// so they keep them forever"; docs/SITE-DESIGN.md "Postcards"). Landscape, 1200 × 800 (a 6 × 4
// inch card's shape). What's shown on screen is what's downloaded: both are these pictures.
// The front (27 Nov 2026, the user's wish: "a photo that covers the postcard ... a cool city
// photo, or a wilderness photo, or a famous landmark photo", after an old "Greetings from" card):
// the photo across the whole card, "Greetings from" on a ribbon, and the place's name in big 3D
// letters with the photo showing through them (postcardArt.js picks the photo). The back as a
// real postcard's: the message in a handwriting face on the left, a perforated stamp of the
// place with a round postmark (the place and the day) and wavy cancellation lines on the right,
// and "To:" over decorative address lines (a name only: never an address, the user's decision).
// The colours are the style's (brandColours.js POSTCARD_COLOURS): a canvas can't read the tokens.
import { POSTCARD_COLOURS, SHARE_CARD_COLOURS } from '@/utils/constants/brandColours';
import { DISPLAY_BUSINESS_URL } from '@/utils/constants/constants';
import { fittedText, font, loadFonts as loadCardFonts, textLines } from '@/utils/shareCard/drawShareCard';
import { POSTCARD_DEFAULT_STYLE } from './postcardRules';

export const POSTCARD_WIDTH = 1200;
export const POSTCARD_HEIGHT = 800;
const W = POSTCARD_WIDTH;
const H = POSTCARD_HEIGHT;

// The message and the names: a handwriting face from the device (the passport's signature's, as
// --font-signature in index.css: nothing to download)
export const HAND = "'Segoe Script', 'Snell Roundhand', 'Bradley Hand', 'Lucida Handwriting', 'Brush Script MT', cursive";

// How far in from the card's edge its picture and words start, per style (airmail's stripes are
// the widest edge)
const INSET = Object.freeze({ classic: 18, vintage: 22, airmail: 28, night: 18 });

export const paletteFor = (style) => POSTCARD_COLOURS[style] ?? POSTCARD_COLOURS[POSTCARD_DEFAULT_STYLE];
export const insetFor = (style) => INSET[style] ?? INSET[POSTCARD_DEFAULT_STYLE];

// ── Pictures ─────────────────────────────────────────────────────────────────

/**
 * A picture for the canvas, or null when it can't be had (it's drawn without it). Another site's
 * file is asked for with CORS, so the canvas can still be saved as a picture.
 */
export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    try {
      if (!/^(blob:|data:)/i.test(src) && new URL(src, window.location.href).origin !== window.location.origin) img.crossOrigin = 'anonymous';
    } catch {
      // A relative address: this site's own
    }
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Every picture a card's art names, loaded side by side: `{ cover, poster, stampModel }` (one load for one address). */
export async function loadPostcardImages(art, load = loadImage) {
  const urls = [art.cover?.url, art.poster?.url, art.stampModel?.url];
  const loaded = await Promise.all([...new Set(urls.filter(Boolean))].map(async (url) => [url, await load(url)]));
  const byUrl = new Map(loaded);
  const of = (url) => (url ? byUrl.get(url) ?? null : null);
  return { cover: of(urls[0]), poster: of(urls[1]), stampModel: of(urls[2]) };
}

const sizeOf = (img) => ({ w: img?.naturalWidth || img?.width || 1, h: img?.naturalHeight || img?.height || 1 });

/** Draw `img` to fill `box`, cropped round its middle (as CSS's object-fit: cover). */
export function drawCover(ctx, img, { x, y, w, h }, { focusY = 0.5 } = {}) {
  const { w: iw, h: ih } = sizeOf(img);
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) * focusY, sw, sh, x, y, w, h);
}

/** A model's picture standing on `bottom` at `cx`, `height` tall but never wider than `maxWidth`. -> the box it took */
export function drawModel(ctx, img, aspect, { cx, bottom, height, maxWidth }) {
  const h = Math.min(height, maxWidth / (aspect || 1));
  const w = h * (aspect || 1);
  ctx.drawImage(img, cx - w / 2, bottom - h, w, h);
  return { x: cx - w / 2, y: bottom - h, w, h };
}

/** The place's outline (countryOutline's `{ paths, viewBox }`) fitted in `box`, in `fill` with a dark edge. */
export function drawOutline(ctx, outline, box, { fill, edge, edgeWidth = 2 }) {
  if (!outline?.paths?.length || typeof Path2D === 'undefined') return;
  const [vx, vy, vw, vh] = String(outline.viewBox).split(' ').map(Number);
  const scale = Math.min(box.w / vw, box.h / vh);
  ctx.save();
  ctx.translate(box.x + (box.w - vw * scale) / 2, box.y + (box.h - vh * scale) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-vx, -vy);
  ctx.fillStyle = fill;
  ctx.strokeStyle = edge;
  ctx.lineWidth = edgeWidth / scale;
  ctx.lineJoin = 'round';
  for (const d of outline.paths) {
    const path = new Path2D(d);
    ctx.fill(path);
    ctx.stroke(path);
  }
  ctx.restore();
}

// ── Words ────────────────────────────────────────────────────────────────────

/**
 * The message laid out in `box` (`{ w, h }`): its own line breaks kept, each paragraph wrapped,
 * at the largest size from `max` down to `min` whose lines all fit; at `min` the last line is
 * cut short. -> `{ size, lineHeight, lines }`
 */
export function messageLayout(ctx, message, { w, h, max = 40, min = 22, family = HAND }) {
  const paragraphs = String(message || '').split('\n');
  for (let size = max; size >= min; size -= 2) {
    ctx.font = font(size, family);
    const lineHeight = Math.round(size * 1.4);
    const room = Math.max(1, Math.floor(h / lineHeight));
    const lines = paragraphs.flatMap((p) => (p.trim() ? textLines(ctx, p, w, 99) : ['']));
    const fits = lines.length <= room && lines.every((line) => ctx.measureText(line).width <= w);
    if (fits || size - 2 < min) {
      if (lines.length <= room) return { size, lineHeight, lines };
      const kept = lines.slice(0, room);
      kept[room - 1] = textLines(ctx, `${kept[room - 1]} …`, w, 1)[0];
      return { size, lineHeight, lines: kept };
    }
  }
  return { size: min, lineHeight: Math.round(min * 1.4), lines: [] };
}

/** `text` round the top of a circle (centre `cx`, `cy`, radius `r`), centred on its top. */
export function arcText(ctx, text, { cx, cy, r }) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  // Rotated by 0 is straight up from the centre: the text's middle goes there
  let angle = -total / r / 2;
  ctx.save();
  ctx.translate(cx, cy);
  chars.forEach((c, i) => {
    const step = widths[i] / r;
    ctx.save();
    ctx.rotate(angle + step / 2);
    ctx.translate(0, -r);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    angle += step;
  });
  ctx.restore();
}

// ── The card ─────────────────────────────────────────────────────────────────

/** The card's paper and edge in its style. */
export function paintCard(ctx, style) {
  const p = paletteFor(style);
  const inset = insetFor(style);
  ctx.fillStyle = p.edge;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = p.paper;
  ctx.fillRect(inset, inset, W - inset * 2, H - inset * 2);

  if (style === 'airmail') {
    // Red and blue stripes slanting round the edge, white between
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.rect(inset - 6, inset - 6, W - (inset - 6) * 2, H - (inset - 6) * 2);
    ctx.clip('evenodd');
    for (let x = -H, i = 0; x < W + H; x += 36, i++) {
      ctx.fillStyle = p.stripes[i % 2];
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 18, H);
      ctx.lineTo(x + 18 + H, 0);
      ctx.lineTo(x + H, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  if (style === 'vintage') {
    // A faint linen weave, then a double rule
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = p.weave;
    for (let y = inset; y < H - inset; y += 6) ctx.fillRect(inset, y, W - inset * 2, 1);
    for (let x = inset; x < W - inset; x += 6) ctx.fillRect(x, inset, 1, H - inset * 2);
    ctx.restore();
  }
  if (style === 'vintage' || style === 'night') {
    ctx.strokeStyle = style === 'night' ? p.lettering : p.rule;
    ctx.lineWidth = 2;
    ctx.strokeRect(inset + 8, inset + 8, W - (inset + 8) * 2, H - (inset + 8) * 2);
    ctx.lineWidth = 1;
    ctx.strokeRect(inset + 14, inset + 14, W - (inset + 14) * 2, H - (inset + 14) * 2);
  }
}

const makeCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

// The photo over the whole card inside its edge; a place with none has its poster, else its
// outline on the sea
function drawCoverPicture(ctx, art, images, box, p) {
  if (images.cover) {
    drawCover(ctx, images.cover, box, { focusY: art.cover?.isPoster ? 0.42 : 0.5 });
  } else {
    ctx.fillStyle = SHARE_CARD_COLOURS.sea;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    drawOutline(ctx, art.outline, { x: box.x + 60, y: box.y + 60, w: box.w - 120, h: box.h - 120 }, { fill: art.colour, edge: SHARE_CARD_COLOURS.ink, edgeWidth: 3 });
  }
  // The style's wash (vintage's old brown, night's navy), then the whole photo a little darker
  // and more so towards the edges, so the letters (the photo brighter) stand out
  if (p.tint) {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = p.tint;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = p.shadow;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
  ctx.save();
  if (typeof ctx.createRadialGradient === 'function') {
    const shade = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.7);
    shade.addColorStop(0, `${p.shadow}00`);
    shade.addColorStop(1, `${p.shadow}8c`);
    ctx.fillStyle = shade;
  } else {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = p.shadow;
  }
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

/**
 * The place's name in big block capitals: one line when it fits, else two or three, at the
 * largest size from `max` down whose lines fit `width`. -> `{ size, lines }`
 */
export function blockLetterLines(ctx, name, { width, max = 250, min = 56, maxLines = 3 }) {
  const text = String(name || '').toUpperCase();
  for (let size = max; size >= min; size -= 6) {
    ctx.font = font(size, 'Poppins', '700');
    for (let count = 1; count <= maxLines; count++) {
      const lines = textLines(ctx, text, width, count);
      if (lines.length <= count && lines.every((line) => ctx.measureText(line).width <= width) && !lines.at(-1).endsWith('…')) {
        // Two short lines read better than one tiny one; a one-line name stays big
        if (count === 1 || size >= 90) return { size, lines };
      }
    }
  }
  ctx.font = font(min, 'Poppins', '700');
  return { size: min, lines: textLines(ctx, text, width, maxLines) };
}

/**
 * The big letters as an old "Greetings from" card has them: a deep 3D side, a thick outline, and
 * the card's own photo showing through their faces (brighter, a little closer up).
 */
function drawBlockLetters(ctx, lines, size, { cx, top, lineGap }, images, art, box, p) {
  const depth = Math.max(7, Math.round(size * 0.1));
  const baseline = (i) => top + size * 0.82 + i * lineGap;
  ctx.save();
  ctx.font = font(size, 'Poppins', '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  // The side, stepped down and to the right
  ctx.fillStyle = p.extrude;
  lines.forEach((line, i) => {
    for (let d = depth; d >= 1; d -= 1) ctx.fillText(line, cx + d * 0.8, baseline(i) + d);
  });
  // The outline
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = Math.max(8, size * 0.1);
  lines.forEach((line, i) => ctx.strokeText(line, cx, baseline(i)));
  ctx.restore();

  // The faces: the photo, closer up, brighter and more vivid, cut to the letters (with the
  // style's wash, lighter)
  const faces = makeCanvas(W, H);
  const f = faces.getContext('2d');
  if (images.cover) {
    const zoom = 1.18;
    const zw = box.w * zoom;
    const zh = box.h * zoom;
    if ('filter' in f) f.filter = 'saturate(1.35) brightness(1.12) contrast(1.05)';
    drawCover(f, images.cover, { x: cx - zw / 2, y: top + (lines.length * lineGap) / 2 - zh / 2, w: zw, h: zh });
    if ('filter' in f) f.filter = 'none';
    if (p.tint) {
      f.globalCompositeOperation = 'color';
      f.globalAlpha = 0.3;
      f.fillStyle = p.tint;
      f.fillRect(0, 0, W, H);
    }
    f.globalCompositeOperation = 'screen';
    f.globalAlpha = 0.16;
    f.fillStyle = p.outline;
    f.fillRect(0, 0, W, H);
    f.globalAlpha = 1;
  } else {
    f.fillStyle = p.ribbonInk;
    f.fillRect(0, 0, W, H);
  }
  // Cut to every line at once (a mask of them all): cut one line at a time, each would wipe the
  // lines before it
  const mask = makeCanvas(W, H);
  const m = mask.getContext('2d');
  m.font = font(size, 'Poppins', '700');
  m.textAlign = 'center';
  m.textBaseline = 'alphabetic';
  m.fillStyle = p.outline;
  lines.forEach((line, i) => m.fillText(line, cx, baseline(i)));
  f.globalCompositeOperation = 'destination-in';
  f.drawImage(mask, 0, 0);
  ctx.drawImage(faces, 0, 0);
  // A thin dark line inside the outline, as printed
  ctx.save();
  ctx.font = font(size, 'Poppins', '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = p.extrude;
  ctx.lineWidth = Math.max(1.5, size * 0.012);
  lines.forEach((line, i) => ctx.strokeText(line, cx, baseline(i)));
  ctx.restore();
}

/** A ribbon with notched ends, its words in the travel face: "Greetings from" over the letters. */
function drawRibbon(ctx, text, { x, y, size }, p) {
  ctx.save();
  ctx.font = font(size, 'TravelFont');
  const width = ctx.measureText(text).width + size * 1.2;
  const height = size * 1.35;
  const notch = height * 0.35;
  ctx.translate(x, y);
  ctx.rotate(-0.05);
  // The tails behind, a shade darker
  ctx.fillStyle = p.extrude;
  for (const side of [-1, 1]) {
    const from = side < 0 ? -notch * 1.4 : width - notch * 0.2;
    ctx.beginPath();
    ctx.moveTo(from, height * 0.2);
    ctx.lineTo(from + notch * 1.6, height * 0.2);
    ctx.lineTo(from + notch * 1.6, height * 1.15);
    ctx.lineTo(from, height * 1.15);
    ctx.lineTo(from + (side < 0 ? notch * 0.7 : notch * 0.9), height * 0.68);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = p.ribbon;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = p.ribbonInk;
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, width - 10, height - 10);
  ctx.fillStyle = p.ribbonInk;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 + size * 0.06);
  ctx.restore();
  return { width, height };
}

/** Words written over the photo, with a dark edge so they read on any picture. */
function outlinedText(ctx, text, x, y, { size, family = 'TravelFont', fill, edge }) {
  ctx.save();
  ctx.font = font(size, family);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * The front of `card` (`style`) from its art and pictures: its photo over the whole card (a city,
 * the wilderness, a landmark or the sender's own; 27 Nov 2026, the user's wish, after an old
 * "Greetings from" card), "Greetings from" on a ribbon, the place's name in big 3D letters with
 * the photo through them, and under them what the photo is of (a landmark's name).
 */
export function drawFront(ctx, card, art, images) {
  const style = card.style || POSTCARD_DEFAULT_STYLE;
  const p = paletteFor(style);
  const inset = insetFor(style);
  paintCard(ctx, style);
  const box = { x: inset, y: inset, w: W - inset * 2, h: H - inset * 2 };
  drawCoverPicture(ctx, art, images, box, p);

  const width = box.w - 140;
  const { size, lines } = blockLetterLines(ctx, art.placeName, { width });
  const lineGap = Math.round(size * 0.98);
  const blockHeight = lines.length * lineGap;
  const ribbonSize = Math.round(Math.min(58, Math.max(38, size * 0.3)));
  const subtitleSize = art.subtitle ? Math.round(Math.min(56, Math.max(34, size * 0.26))) : 0;
  const total = ribbonSize * 1.6 + blockHeight + (subtitleSize ? subtitleSize * 1.5 : 0);
  const top = Math.max(box.y + 40, (H - total) / 2) + ribbonSize * 1.6;

  // The widest line's left edge: the ribbon starts above it
  ctx.font = font(size, 'Poppins', '700');
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const left = W / 2 - widest / 2;
  drawRibbon(ctx, 'Greetings from', { x: Math.max(box.x + 30, left - 10), y: top - ribbonSize * 1.75, size: ribbonSize }, p);
  drawBlockLetters(ctx, lines, size, { cx: W / 2, top, lineGap }, images, art, box, p);

  if (art.subtitle) {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    const right = Math.min(box.x + box.w - 30, W / 2 + widest / 2 + 10);
    ctx.font = font(subtitleSize, 'TravelFont');
    let shown = art.subtitle;
    const room = box.w - 80;
    while (shown.length > 3 && ctx.measureText(shown).width > room) shown = `${shown.slice(0, -2).trimEnd()}…`;
    outlinedText(ctx, shown, right, top + blockHeight + subtitleSize * 0.95, { size: subtitleSize, fill: p.ribbonInk, edge: p.ribbon });
    ctx.restore();
  }
}

// The stamp: a perforated paper stamp with the place's picture and name
function drawStamp(ctx, art, images, box, p) {
  ctx.fillStyle = p.stamp;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  // A faint edge, so a white stamp shows on a white card; the holes then cut it into perforations
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = p.rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();
  // Its perforated edge: half-holes of the card's paper all round
  ctx.fillStyle = p.paper;
  const hole = 6;
  for (let x = box.x + 10; x <= box.x + box.w - 6; x += 16) {
    for (const y of [box.y, box.y + box.h]) {
      ctx.beginPath();
      ctx.arc(x, y, hole, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let y = box.y + 10; y <= box.y + box.h - 6; y += 16) {
    for (const x of [box.x, box.x + box.w]) {
      ctx.beginPath();
      ctx.arc(x, y, hole, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const pic = { x: box.x + 16, y: box.y + 16, w: box.w - 32, h: box.h - 62 };
  const model = images.stampModel;
  if (model && art.stampModel) {
    ctx.fillStyle = p.sky;
    ctx.fillRect(pic.x, pic.y, pic.w, pic.h);
    drawModel(ctx, model, art.stampModel.aspect, { cx: pic.x + pic.w / 2, bottom: pic.y + pic.h - 6, height: pic.h - 16, maxWidth: pic.w - 12 });
  } else if (images.poster) {
    drawCover(ctx, images.poster, pic, { focusY: 0.3 });
  } else {
    ctx.fillStyle = SHARE_CARD_COLOURS.sea;
    ctx.fillRect(pic.x, pic.y, pic.w, pic.h);
    drawOutline(ctx, art.outline, { x: pic.x + 10, y: pic.y + 10, w: pic.w - 20, h: pic.h - 20 }, { fill: art.colour, edge: SHARE_CARD_COLOURS.ink, edgeWidth: 1.5 });
  }
  ctx.strokeStyle = p.shadow;
  ctx.lineWidth = 1;
  ctx.strokeRect(pic.x, pic.y, pic.w, pic.h);
  ctx.fillStyle = p.shadow;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fittedText(ctx, art.placeName.toUpperCase(), { x: box.x + box.w / 2, y: box.y + box.h - 22, width: box.w - 32, max: 16, min: 10, family: 'Poppins', weight: '600' });
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// The postmark: two rings, the place round the top, the day in the middle, and wavy lines across
// the stamp beside it
function drawPostmark(ctx, art, sentAt, { cx, cy, r, linesTo }, p) {
  const day = new Date(sentAt);
  const valid = !Number.isNaN(day.getTime());
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.strokeStyle = p.postmark;
  ctx.fillStyle = p.postmark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // The place round the top half of the ring: smaller for a long name, cut short past the smallest
  let place = art.placeName.toUpperCase();
  const room = (r - 12) * Math.PI * 0.9;
  let size = 15;
  ctx.font = font(size, 'Poppins', '600');
  while (size > 10 && ctx.measureText(place).width > room) ctx.font = font(--size, 'Poppins', '600');
  while (place.length > 2 && ctx.measureText(place).width > room) place = `${place.slice(0, -2).trimEnd()}…`;
  arcText(ctx, place, { cx, cy, r: r - 12 });
  if (valid) {
    ctx.font = font(22, 'Poppins', '600');
    ctx.fillText(`${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}`, cx, cy - 8);
    ctx.font = font(18, 'Poppins', '500');
    ctx.fillText(String(day.getUTCFullYear()), cx, cy + 18);
  }
  // The cancellation: four waves from the ring across the stamp
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const y0 = cy - 27 + i * 18;
    ctx.beginPath();
    for (let x = cx + r - 4; x <= linesTo; x += 4) {
      const y = y0 + Math.sin((x - cx) / 14) * 5;
      if (x === cx + r - 4) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** The back of `card`: the message, the stamp and postmark, "To:" and the address lines, the credit. */
export function drawBack(ctx, card, art, images) {
  const style = card.style || POSTCARD_DEFAULT_STYLE;
  const p = paletteFor(style);
  const inset = insetFor(style);
  paintCard(ctx, style);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillStyle = p.rule;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';
  ctx.font = font(28, 'Poppins', '600');
  ctx.fillText('POST CARD', W / 2, inset + 62);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  if (style === 'airmail') {
    ctx.fillStyle = p.stripes[1];
    ctx.fillRect(inset + 30, inset + 30, 190, 42);
    ctx.fillStyle = p.paper;
    ctx.font = font(18, 'Poppins', '600');
    ctx.fillText('BY AIR MAIL', inset + 125, inset + 58);
  }

  // The line down the middle
  const middle = 640;
  ctx.fillStyle = p.rule;
  ctx.fillRect(middle, inset + 100, 2, H - inset * 2 - 170);

  // The message, then who it's from
  ctx.textAlign = 'left';
  ctx.fillStyle = p.ink;
  const box = { x: inset + 46, y: inset + 110, w: middle - inset - 46 - 40, h: 470 };
  const { size, lineHeight, lines } = messageLayout(ctx, card.message, { w: box.w, h: box.h });
  ctx.font = font(size, HAND);
  lines.forEach((line, i) => ctx.fillText(line, box.x, box.y + size + i * lineHeight));
  if (card.fromName) {
    ctx.textAlign = 'right';
    fittedText(ctx, card.fromName, { x: middle - 40, y: H - inset - 96, width: box.w - 60, max: 44, min: 26, family: HAND });
  }

  // The stamp and postmark
  const stamp = { x: W - inset - 46 - 168, y: inset + 92, w: 168, h: 208 };
  drawStamp(ctx, art, images, stamp, p);
  drawPostmark(ctx, art, card.sentAt, { cx: stamp.x - 26, cy: stamp.y + 150, r: 76, linesTo: stamp.x + stamp.w - 10 }, p);

  // "To:" and the address lines (a name only)
  const lineLeft = middle + 44;
  const lineRight = W - inset - 46;
  const first = 452;
  ctx.textAlign = 'left';
  ctx.fillStyle = p.rule;
  ctx.font = font(24, 'Poppins', '600');
  ctx.fillText('To:', lineLeft, first - 12);
  if (card.toName) {
    ctx.fillStyle = p.ink;
    fittedText(ctx, card.toName, { x: lineLeft + 56, y: first - 12, width: lineRight - lineLeft - 56, max: 44, min: 24, family: HAND });
  }
  ctx.fillStyle = p.rule;
  for (let i = 0; i < 4; i++) ctx.fillRect(lineLeft, first + i * 66, lineRight - lineLeft, 2);

  // The landmark photo's credit, and the site
  ctx.textAlign = 'center';
  ctx.fillStyle = p.rule;
  fittedText(ctx, art.credit ? `${art.credit}  ·  ${DISPLAY_BUSINESS_URL}` : DISPLAY_BUSINESS_URL, {
    x: W / 2,
    y: H - inset - 26,
    width: W - inset * 2 - 80,
    max: 17,
    min: 11,
    family: 'Poppins',
    weight: '500',
  });
}

/** The faces the card uses: the share card's, and the bold of the big letters. */
export async function loadFonts() {
  await loadCardFonts();
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  try {
    await document.fonts.load('700 200px Poppins');
  } catch {
    // Drawn in the browser's own bold
  }
}

const canvasOf = () => {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  return canvas;
};

/**
 * Both sides of a card, drawn: `{ front, back }` canvases. `images` are its art's pictures
 * (loadPostcardImages); loaded here when not given. Waits for the site's fonts first.
 */
export async function drawPostcard(card, art, images = null) {
  const [, pictures] = await Promise.all([loadFonts(), images ?? loadPostcardImages(art)]);
  const front = canvasOf();
  const back = canvasOf();
  drawFront(front.getContext('2d'), card, art, pictures);
  drawBack(back.getContext('2d'), card, art, pictures);
  return { front, back };
}

/** A canvas as a PNG blob. */
export const canvasPng = (canvas) =>
  new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The picture couldn’t be made.'))), 'image/png'));
