// A postcard drawn on two canvases, front and back (26 Nov 2026, the user's wish: "a selection of
// images, and a selection of styles ... cool stamps and address area ... people can download them
// so they keep them forever"; docs/SITE-DESIGN.md "Postcards"). Landscape, 1200 × 800 (a 6 × 4
// inch card's shape). What's shown on screen is what's downloaded: both are these pictures.
// The front by its kind (postcardArt.js): a country's poster with "Greetings from" in big
// lettering and its 3D model; a landmark's photo as a print beside its model; or the sender's
// own photo across the whole card with the place's name on a strip. The back as a real
// postcard's: the message in a handwriting face on the left, a perforated stamp of the place
// with a round postmark (the place and the day) and wavy cancellation lines on the right, and
// "To:" over decorative address lines (a name only: never an address, the user's decision).
// The colours are the style's (brandColours.js POSTCARD_COLOURS): a canvas can't read the tokens.
import { POSTCARD_COLOURS, SHARE_CARD_COLOURS } from '@/utils/constants/brandColours';
import { DISPLAY_BUSINESS_URL } from '@/utils/constants/constants';
import { fittedText, font, loadFonts, textLines } from '@/utils/shareCard/drawShareCard';
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

/** Every picture a card's art names, loaded side by side: `{ poster, landmarkPhoto, model, photo, stampModel }`. */
export async function loadPostcardImages(art, load = loadImage) {
  const [poster, landmarkPhoto, model, photo, stampModel] = await Promise.all([
    load(art.poster?.url),
    load(art.landmarkPhoto?.url),
    load(art.model?.url),
    load(art.photoUrl),
    art.stampModel && art.stampModel.url !== art.model?.url ? load(art.stampModel.url) : null,
  ]);
  return { poster, landmarkPhoto, model, photo, stampModel: stampModel ?? (art.stampModel ? model : null) };
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

/**
 * A name in big lettering, on one or two lines: the largest size from `max` down whose lines all
 * fit `width` (two only when one won't do). -> `{ size, lines }`
 */
export function letteringLines(ctx, text, { width, max, min, family = 'TravelFont', maxLines = 2 }) {
  for (let size = max; size >= min; size -= 4) {
    ctx.font = font(size, family);
    for (let count = 1; count <= maxLines; count++) {
      const lines = textLines(ctx, text, width, count);
      if (lines.length <= count && lines.every((line) => ctx.measureText(line).width <= width) && !lines.at(-1).endsWith('…')) return { size, lines };
    }
  }
  ctx.font = font(min, family);
  return { size: min, lines: textLines(ctx, text, width, maxLines) };
}

/** Lettering with a printed shadow under it, as on an old "Greetings from" card. */
function shadowedText(ctx, text, x, y, { fill, shadow, offset = 4 }) {
  ctx.fillStyle = shadow;
  ctx.fillText(text, x + offset, y + offset);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
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

// The poster in a white frame, or the place's outline on the sea when it has none
function drawPosterPanel(ctx, art, images, box, p) {
  ctx.fillStyle = p.stamp;
  ctx.fillRect(box.x - 10, box.y - 10, box.w + 20, box.h + 20);
  if (images.poster) {
    drawCover(ctx, images.poster, box, { focusY: 0.35 });
    return;
  }
  ctx.fillStyle = SHARE_CARD_COLOURS.sea;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  drawOutline(ctx, art.outline, { x: box.x + 30, y: box.y + 30, w: box.w - 60, h: box.h - 60 }, { fill: art.colour, edge: SHARE_CARD_COLOURS.ink, edgeWidth: 2.5 });
}

// "Greetings from" over a name in big lettering, centred on `cx` from `top`. -> the bottom of the name
function drawGreetings(ctx, name, { cx, top, width, max, p }) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = p.lettering;
  fittedText(ctx, 'Greetings from', { x: cx, y: top + 50, width, max: 54, min: 30, family: 'TravelFont' });
  const { size, lines } = letteringLines(ctx, name, { width, max, min: 48 });
  ctx.font = font(size, 'TravelFont');
  let y = top + 70 + size;
  for (const line of lines) {
    shadowedText(ctx, line, cx, y, { fill: p.lettering, shadow: p.shadow, offset: Math.max(3, Math.round(size / 28)) });
    y += Math.round(size * 1.02);
  }
  return y - Math.round(size * 1.02);
}

function drawCountryFront(ctx, art, images, p, inset) {
  const box = { x: inset + 40, y: inset + 40, w: 0, h: H - (inset + 40) * 2 };
  box.w = Math.round(box.h * (2 / 3));
  drawPosterPanel(ctx, art, images, box, p);

  const left = box.x + box.w + 40;
  const right = W - inset - 40;
  const cx = (left + right) / 2;
  const bottom = drawGreetings(ctx, art.placeName, { cx, top: inset + 60, width: right - left, max: 130, p });
  // Under the name: its 3D model, else its outline (once: the poster's panel has it when there's no poster)
  const room = { x: left + 20, y: bottom + 40, w: right - left - 40, h: H - inset - 50 - (bottom + 40) };
  if (images.model && room.h > 80) {
    drawModel(ctx, images.model, art.model.aspect, { cx, bottom: room.y + room.h, height: room.h, maxWidth: room.w });
  } else if (images.poster && room.h > 80) {
    drawOutline(ctx, art.outline, room, { fill: art.colour, edge: p.shadow, edgeWidth: 2.5 });
  }
}

function drawLandmarkFront(ctx, art, images, p, inset) {
  const band = { top: H - inset - 190 };
  // The landmark's photo as a print, a little askew; else its model on the sky; else the poster
  const print = { x: inset + 46, y: inset + 46, w: 640, h: band.top - inset - 76 };
  if (images.landmarkPhoto) {
    ctx.save();
    ctx.translate(print.x + print.w / 2, print.y + print.h / 2);
    ctx.rotate(-0.03);
    ctx.fillStyle = p.shadow;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(-print.w / 2 - 8, -print.h / 2 - 2, print.w + 28, print.h + 28);
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.stamp;
    ctx.fillRect(-print.w / 2 - 14, -print.h / 2 - 14, print.w + 28, print.h + 28);
    drawCover(ctx, images.landmarkPhoto, { x: -print.w / 2, y: -print.h / 2, w: print.w, h: print.h });
    ctx.restore();
  } else if (images.model) {
    ctx.fillStyle = p.sky;
    ctx.fillRect(print.x, print.y, print.w, print.h);
    drawModel(ctx, images.model, art.model.aspect, { cx: print.x + print.w / 2, bottom: print.y + print.h - 20, height: print.h - 50, maxWidth: print.w - 60 });
  } else {
    drawPosterPanel(ctx, art, images, { ...print, w: Math.round(print.h * (2 / 3)) }, p);
  }

  // Beside it: the model (when the photo took the print), else the place's outline
  const side = { x: print.x + print.w + 50, y: inset + 56, w: W - inset - 40 - (print.x + print.w + 50), h: band.top - inset - 76 };
  if (images.landmarkPhoto && images.model) {
    drawModel(ctx, images.model, art.model.aspect, { cx: side.x + side.w / 2, bottom: side.y + side.h, height: side.h, maxWidth: side.w });
  } else {
    drawOutline(ctx, art.outline, side, { fill: art.colour, edge: p.shadow, edgeWidth: 2.5 });
  }

  // The band: "Greetings from" and the place, then the landmark's name in big lettering
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = p.lettering;
  ctx.font = font(40, 'TravelFont');
  ctx.fillText('Greetings from', inset + 46, band.top + 52);
  ctx.textAlign = 'right';
  ctx.fillStyle = p.rule;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
  fittedText(ctx, art.placeName.toUpperCase(), { x: W - inset - 46, y: band.top + 50, width: 420, max: 26, min: 16, family: 'Poppins', weight: '600' });
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  const { size, lines } = letteringLines(ctx, art.landmarkName, { width: W - (inset + 46) * 2, max: 104, min: 44, maxLines: 1 });
  ctx.font = font(size, 'TravelFont');
  shadowedText(ctx, lines[0] ?? '', inset + 46, band.top + 70 + size * 0.85, { fill: p.lettering, shadow: p.shadow, offset: Math.max(3, Math.round(size / 28)) });
}

function drawPhotoFront(ctx, art, images, p, inset) {
  const box = { x: inset, y: inset, w: W - inset * 2, h: H - inset * 2 };
  if (images.photo) drawCover(ctx, images.photo, box);
  else drawPosterPanel(ctx, art, images, box, p);
  // A strip of the card's paper across the foot, with the place's name on it
  const strip = { x: box.x, y: box.y + box.h - 150, w: box.w, h: 150 };
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = p.paper;
  ctx.fillRect(strip.x, strip.y, strip.w, strip.h);
  ctx.restore();
  ctx.fillStyle = p.rule;
  ctx.fillRect(strip.x, strip.y, strip.w, 3);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = p.lettering;
  ctx.font = font(38, 'TravelFont');
  ctx.fillText('Greetings from', strip.x + 34, strip.y + 50);
  const { size, lines } = letteringLines(ctx, art.placeName, { width: strip.w - 68, max: 84, min: 40, maxLines: 1 });
  ctx.font = font(size, 'TravelFont');
  shadowedText(ctx, lines[0] ?? '', strip.x + 34, strip.y + 56 + size * 0.85, { fill: p.lettering, shadow: p.shadow, offset: 3 });
}

/** The front of `card` (`style`) from its art and pictures. */
export function drawFront(ctx, card, art, images) {
  const style = card.style || POSTCARD_DEFAULT_STYLE;
  const p = paletteFor(style);
  const inset = insetFor(style);
  paintCard(ctx, style);
  if (art.kind === 'PHOTO') drawPhotoFront(ctx, art, images, p, inset);
  else if (art.kind === 'LANDMARK') drawLandmarkFront(ctx, art, images, p, inset);
  else drawCountryFront(ctx, art, images, p, inset);
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
