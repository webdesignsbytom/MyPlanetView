// The home page draft's turning globe (dev only, /dev/home; the user's design in main-home/):
// the Earth drawn on a canvas from an equirectangular texture, with each card's country
// outlined, a pin on its place and a line from the card to the pin. The outlines, pins and
// lines share one orthographic projection (d3-geo).
import { geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-50m.json';
import { HOME_DRAFT_PLACES } from './destinations';
import { GLOBE_COLOURS } from './globeColours';

const RADIANS = Math.PI / 180;
// The globe leans this far towards the viewer, so the north reads better
const TILT_DEGREES = 12;
const TILT = TILT_DEGREES * RADIANS;
// The longitude facing the viewer when the page opens
export const START_LONGITUDE = 157;
// Degrees the globe turns in a second (the design's 3.08, 10% faster: the user's wish, 27 Nov 2026)
export const TURN_SPEED = 3.388;
// Seconds between one card changing and the next
export const CARD_SECONDS = 4.4;
// A place that has been on a card isn't shown again for this long (ms)
export const RECENT_MS = 12000;
// How many cards there are
export const CARD_COUNT = 3;

/** A longitude (or a difference of two) in -180 to 180. */
export const wrap = (degrees) => ((((degrees + 540) % 360) + 360) % 360) - 180;

// The cards the page opens with, as the globe starts over the Pacific
export const INITIAL_CARDS = ['392', '764', '036'].map((id) => HOME_DRAFT_PLACES.find((place) => place.id === id));

// world-atlas can give one code several features (a country and its territories): one shape per code
const COUNTRIES = new Map();
for (const item of feature(world, world.objects.countries).features) {
  const id = String(item.id).padStart(3, '0');
  if (!COUNTRIES.has(id)) COUNTRIES.set(id, { type: 'GeometryCollection', geometries: [] });
  COUNTRIES.get(id).geometries.push(item.geometry);
}

/** A country's outline by its ISO numeric code, or undefined. */
export const countryShape = (id) => COUNTRIES.get(id);

/**
 * The globe on `canvas`, painted from `image` (an equirectangular texture whose width is a power
 * of two). The camera never moves, so where each pixel samples the texture is worked out once
 * per size; only the horizontal offset changes as the Earth turns.
 */
export function makePlanet(canvas, image) {
  const context = canvas.getContext('2d');
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const reader = source.getContext('2d', { willReadFrequently: true });
  reader.drawImage(image, 0, 0);
  const texture = new Uint32Array(reader.getImageData(0, 0, source.width, source.height).data.buffer);
  const texWidth = source.width;
  const projection = geoOrthographic();
  const path = geoPath(projection, context);
  let width, height, r, cx, cy, ratio, frame, pixels, indices, offsets, shade, rim;

  function resize() {
    const box = canvas.getBoundingClientRect();
    ratio = Math.min(devicePixelRatio || 1, 1.45, 1250 / Math.max(1, box.width));
    width = canvas.width = Math.max(1, Math.round(box.width * ratio));
    height = canvas.height = Math.max(1, Math.round(box.height * ratio));
    // The globe sits against the right-hand edge, mostly off it
    r = Math.min(height * 0.47, width * 0.62);
    cx = width * 0.977;
    cy = height * 0.49;
    projection
      .translate([cx, cy])
      .scale(r)
      .precision(0.65 * ratio);
    frame = context.createImageData(width, height);
    pixels = new Uint32Array(frame.data.buffer);
    indices = new Int32Array(width * height);
    indices.fill(-1);
    offsets = new Uint16Array(width * height);
    for (let y = 0; y < height; y++) {
      const north = (cy - y) / r;
      for (let x = Math.max(0, Math.floor(cx - r)); x < width; x++) {
        const east = (x - cx) / r;
        const zz = 1 - east * east - north * north;
        if (zz <= 0) continue;
        const z = Math.sqrt(zz);
        const lat = Math.asin(north * Math.cos(TILT) + z * Math.sin(TILT));
        const lon = Math.atan2(east, z * Math.cos(TILT) - north * Math.sin(TILT));
        const i = y * width + x;
        offsets[i] = Math.floor((lon / (2 * Math.PI) + 0.5) * texWidth);
        indices[i] = Math.min(source.height - 1, Math.floor((0.5 - lat / Math.PI) * source.height)) * texWidth;
      }
    }
    shade = context.createLinearGradient(cx - r, cy - r, cx + r * 0.32, cy + r * 0.25);
    GLOBE_COLOURS.shade.forEach((colour, i) => shade.addColorStop([0, 0.42, 1][i], colour));
    rim = context.createRadialGradient(cx, cy, r * 0.88, cx, cy, r + 1);
    GLOBE_COLOURS.rim.forEach((colour, i) => rim.addColorStop([0, 0.82, 0.98, 1][i], colour));
  }

  /** The globe turned to `lon`, with `cards`' countries, pins and lines to their `anchors` (CSS px). */
  function draw(lon, cards, anchors) {
    const shift = Math.floor((lon / 360) * texWidth);
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(height, cy + r + 1); y++) {
      for (let i = y * width + Math.max(0, Math.floor(cx - r)); i < (y + 1) * width; i++) {
        if (indices[i] >= 0) pixels[i] = texture[indices[i] + ((offsets[i] + shift) & (texWidth - 1))];
      }
    }
    context.putImageData(frame, 0, 0);
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.fillStyle = shade;
    context.fill();
    context.fillStyle = rim;
    context.fill();
    context.save();
    context.shadowBlur = 12 * ratio;
    context.shadowColor = GLOBE_COLOURS.glow;
    context.lineWidth = 1.3 * ratio;
    context.strokeStyle = GLOBE_COLOURS.edge;
    context.stroke();
    context.restore();
    projection.rotate([-lon, -TILT_DEGREES]);
    cards.forEach((place, slot) => {
      if (!place) return;
      const geometry = countryShape(place.id);
      const delta = wrap(place.point[0] - lon) * RADIANS;
      const lat = place.point[1] * RADIANS;
      const facing = Math.sin(lat) * Math.sin(TILT) + Math.cos(lat) * Math.cos(TILT) * Math.cos(delta);
      const [x, y] = projection(place.point);
      if (facing < 0.045 || x > width - 3 * ratio) return;
      if (geometry) {
        context.beginPath();
        path(geometry);
        context.fillStyle = GLOBE_COLOURS.countryFill;
        context.fill();
        context.strokeStyle = GLOBE_COLOURS.countryEdge;
        context.lineWidth = 1.9 * ratio;
        context.stroke();
      }
      const anchor = anchors[slot];
      if (!anchor) return;
      const ax = anchor[0] * ratio;
      const ay = anchor[1] * ratio;
      // Out from the card, a slant, then level into the pin
      const lead = Math.max(0, (x - ax) * 0.2);
      const elbow = Math.min(Math.abs(y - ay) * 0.8, Math.max(0, (x - ax) * 0.55));
      context.beginPath();
      context.moveTo(ax, ay);
      context.lineTo(ax + lead, ay);
      context.lineTo(ax + lead + elbow, y);
      context.lineTo(x, y);
      context.lineWidth = 2.3 * ratio;
      context.strokeStyle = GLOBE_COLOURS.leader;
      context.stroke();
      context.beginPath();
      context.arc(x, y, 6 * ratio, 0, Math.PI * 2);
      context.strokeStyle = GLOBE_COLOURS.pinRing;
      context.stroke();
      context.beginPath();
      context.arc(x, y, 2.6 * ratio, 0, Math.PI * 2);
      context.fillStyle = GLOBE_COLOURS.pinDot;
      context.fill();
    });
  }

  resize();
  return {
    resize,
    draw,
    /** How far down the canvas `place` is with the globe turned to `lon`. */
    screenY(place, lon) {
      return projection.rotate([-lon, -TILT_DEGREES])(place.point)[1];
    },
    /** Whether `place` is on the side facing the viewer, in the part left of the screen's edge. */
    canShow(place, lon) {
      const delta = wrap(place.point[0] - lon);
      const [x] = projection.rotate([-lon, -TILT_DEGREES])(place.point);
      return delta > -72 && delta < 12 && x < width - 12 * ratio;
    },
  };
}

/**
 * The next card to change and the place to put on it. The card is one whose place has turned
 * out of view, else `nextSlot`. The place is one in view with its photo ready, not on a card,
 * and not shown in the last RECENT_MS if another will do: first one that keeps the lines in
 * top-to-bottom order, then the one shown longest ago, then the one nearest the middle of the
 * view. `engine` is makePlanet's (its `canShow` and `screenY`).
 */
export function chooseNextCard({ places, cards, ready, recent, now, lon, engine, nextSlot }) {
  const choices = places.filter((place) => ready.has(place.id) && engine.canShow(place, lon) && !cards.includes(place));
  let slot = cards.findIndex((card) => card && !engine.canShow(card, lon));
  if (slot < 0) slot = nextSlot;
  const eligible = choices.filter((place) => !recent.has(place.id) || now - recent.get(place.id) > RECENT_MS);
  const inversions = (candidate) => {
    const y = engine.screenY(candidate, lon);
    return cards.reduce((count, other, index) => {
      if (!other || index === slot) return count;
      const otherY = engine.screenY(other, lon);
      return count + Number(index < slot ? otherY > y : otherY < y);
    }, 0);
  };
  eligible.sort(
    (a, b) =>
      inversions(a) - inversions(b) ||
      (recent.get(a.id) ?? -1) - (recent.get(b.id) ?? -1) ||
      Math.abs(wrap(a.point[0] - lon) + 12) - Math.abs(wrap(b.point[0] - lon) + 12),
  );
  return { slot, place: eligible[0] || choices[0] || null };
}
