// A user's map viewing preferences (Profile.mapSettings). Pure, so it's unit-tested.

// Jupiter clouds and Galaxy were taken out on 16 Nov 2026 (the user's wish): a profile
// that saved one keeps it until the next save, and the client opens it as the animated sea
// 'mono' is Black and white, the world map in greys (19 Nov 2026: it was the switch
// blackAndWhite, which is now dropped like any unknown key)
export const MAP_STYLES = Object.freeze(['animated', 'mono', 'old-map', 'starry']);
// 'detailed' shows country names, grid lines and landmarks at every zoom
export const MAP_TYPES = Object.freeze(['regular', 'detailed']);
// The landmark pins (17 Nov 2026): when zoomed in, at every zoom, only the passport's
// stamped ones, or none (the client's LANDMARK_PIN_MODES)
export const LANDMARK_PIN_MODES = Object.freeze(['zoomed', 'always', 'stamped', 'off']);
export const MAP_SETTING_FLAGS = Object.freeze([
  'showGrid',
  'showGridLabels',
  'animatedSea',
  'sunAndMoon',
  'showCountryNames',
  'hoverPreview',
  // From my_planet: the visited / not-visited filters and the map's banner
  'showVisited',
  'showUnvisited',
  'showUserBanner',
  // Draw Antarctica and the south poles (on unless turned off); only the view changes
  'showAntarctica',
  // The pinned-note mark beside places with moments (on unless turned off)
  'showMoments',
  // The luggage tag under the map's title with the nearest unmet goal (on unless turned off)
  'showGoalTag',
  // The tips the map opens with, once a visit (on unless turned off)
  'showTips',
]);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

/**
 * Keep only the known settings; anything else is dropped.
 * A known key with the wrong kind of value is refused.
 * -> { ok: true, value } or { ok: false }.
 */
export function cleanMapSettings(input) {
  if (!isPlainObject(input)) return { ok: false };
  const value = {};
  if (input.style !== undefined) {
    if (!MAP_STYLES.includes(input.style)) return { ok: false };
    value.style = input.style;
  }
  if (input.mapType !== undefined) {
    if (!MAP_TYPES.includes(input.mapType)) return { ok: false };
    value.mapType = input.mapType;
  }
  if (input.landmarkPins !== undefined) {
    if (!LANDMARK_PIN_MODES.includes(input.landmarkPins)) return { ok: false };
    value.landmarkPins = input.landmarkPins;
  }
  for (const flag of MAP_SETTING_FLAGS) {
    if (input[flag] === undefined) continue;
    if (typeof input[flag] !== 'boolean') return { ok: false };
    value[flag] = input[flag];
  }
  return { ok: true, value };
}
