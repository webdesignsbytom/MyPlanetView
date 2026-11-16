// A user's map viewing preferences (Profile.mapSettings). Pure, so it's unit-tested.

export const MAP_STYLES = Object.freeze(['animated', 'old-map', 'jupiter', 'galaxy']);
// 'detailed' shows country names, grid lines and landmarks at every zoom
export const MAP_TYPES = Object.freeze(['regular', 'detailed']);
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
  // The map page in greys (off unless turned on)
  'blackAndWhite',
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
  for (const flag of MAP_SETTING_FLAGS) {
    if (input[flag] === undefined) continue;
    if (typeof input[flag] !== 'boolean') return { ok: false };
    value[flag] = input[flag];
  }
  return { ok: true, value };
}
