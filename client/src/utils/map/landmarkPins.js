// Which landmark pins the map draws at each zoom. There are 1,332 landmarks (16 Nov 2026:
// the 177 plus the UNESCO World Heritage Sites), 58 in Italy alone, so drawing them all
// would bury the map in dots and make every zoom re-render them. Instead each landmark gets
// the zoom it appears from, worked out once for the whole list:
//   - in priority order (below), a pin appears once it's at least PIN_SPACING / zoom map
//     units from every pin already showing at that zoom, so pins never crowd on screen,
//     and more appear as the map is zoomed in;
//   - from ALL_PINS_ZOOM every landmark shows, even two in the same town;
//   - priority: each country's first landmark before any country's second, and so on, so
//     every country has a pin early; within a country, the landmarks that aren't World
//     Heritage Sites (the well-known ones from the original list: the Eiffel Tower, the
//     Colosseum), then the smaller places (a building before a national park), then A–Z.
// A pin that has appeared stays as the zoom grows. The map draws them by zoom step
// (`pinZoomStep`), so the pins re-render a few times per doubling of the zoom, never per
// wheel tick or pinch frame.

/** Map units between two pins at zoom 1 (about 30 px on a laptop's screen, at any zoom). */
export const PIN_SPACING = 40;
/** From this zoom every landmark has its pin. */
export const ALL_PINS_ZOOM = 12;
// Zoom steps per doubling: the pins (and their size) change at each step
const STEPS_PER_DOUBLING = 4;

/** The zoom the pins are drawn for: `zoom` rounded down to a step. */
export const pinZoomStep = (zoom) => 2 ** (Math.floor(Math.log2(Math.max(zoom, 1e-3)) * STEPS_PER_DOUBLING) / STEPS_PER_DOUBLING);

/** A pin's radius in map units at a zoom: the old 5 px-ish dot, never above 3 units. */
export const pinRadius = (zoom) => Math.min(5 / zoom, 3);

const byName = (a, b) => a.name.localeCompare(b.name);
const withinCountry = (a, b) => Number(a.isUnesco) - Number(b.isUnesco) || a.matchRadiusM - b.matchRadiusM || byName(a, b);

/**
 * Each landmark's pin (`{ landmark, x, y, minZoom }`), sorted by the zoom it appears from.
 * Landmarks without a position are left out.
 */
export function placePins(landmarks) {
  const byCountry = new Map();
  for (const landmark of landmarks) {
    if (landmark.pinX == null || landmark.pinY == null) continue;
    if (!byCountry.has(landmark.countryCode)) byCountry.set(landmark.countryCode, []);
    byCountry.get(landmark.countryCode).push(landmark);
  }
  const ranked = [];
  for (const list of byCountry.values()) list.sort(withinCountry).forEach((landmark, rank) => ranked.push({ landmark, rank }));
  ranked.sort((a, b) => a.rank - b.rank || withinCountry(a.landmark, b.landmark));

  // The map never zooms out past 1 (the whole width), so only pins closer than PIN_SPACING
  // can ever crowd each other: a grid of that size finds them
  const grid = new Map();
  const cell = (cx, cy) => `${cx},${cy}`;
  const placed = [];
  for (const { landmark } of ranked) {
    const x = landmark.pinX;
    const y = landmark.pinY;
    const cx = Math.floor(x / PIN_SPACING);
    const cy = Math.floor(y / PIN_SPACING);
    let minZoom = 1;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const other of grid.get(cell(cx + dx, cy + dy)) || []) {
          const distance = Math.hypot(other.x - x, other.y - y);
          const needed = distance > 0 ? PIN_SPACING / distance : Infinity;
          // Too close only while both show: from the other's zoom up to `needed`
          if (needed > other.minZoom && needed > minZoom) minZoom = needed;
        }
      }
    }
    const pin = { landmark, x, y, minZoom: Math.min(minZoom, ALL_PINS_ZOOM) };
    placed.push(pin);
    // A pin showing only from ALL_PINS_ZOOM crowds nothing: every pin shows there anyway
    if (pin.minZoom < ALL_PINS_ZOOM) {
      const key = cell(cx, cy);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(pin);
    }
  }
  return placed.sort((a, b) => a.minZoom - b.minZoom);
}

/** How many pins (from `placePins`, sorted) show at a zoom. */
export function pinsShownAt(pins, zoom) {
  let lo = 0;
  let hi = pins.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pins[mid].minZoom <= zoom) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
