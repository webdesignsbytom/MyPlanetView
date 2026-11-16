// A person's map viewing preferences. Saved to their profile (PUT /api/users/map-settings)
// when signed in, and to this browser either way. The server keeps the same keys
// (server/src/utils/mapSettings.js).
import { MAP_STYLE_IDS } from './mapStyles.js';
import { MAP_TYPE_IDS } from './mapTypes.js';

export const MAP_SETTINGS_STORAGE_KEY = 'myPlanetViewMapSettings';

// The landmark pins (components/map/LandmarkPins.jsx, 17 Nov 2026, the user's wish: finer
// control of the dots): from zoom 3, more as the map zooms in (the default); at every zoom;
// only the landmarks stamped in the map's passport, at every zoom; or none. On either map
// type: the Detailed type no longer forces them on.
export const LANDMARK_PIN_MODES = [
  { id: 'zoomed', label: 'When zoomed in' },
  { id: 'always', label: 'Always, at every zoom' },
  { id: 'stamped', label: 'Only the landmarks in your passport' },
  { id: 'off', label: 'Off' },
];
export const LANDMARK_PIN_MODE_IDS = LANDMARK_PIN_MODES.map((mode) => mode.id);

export const DEFAULT_MAP_SETTINGS = {
  style: 'animated',
  mapType: 'regular',
  landmarkPins: 'zoomed',
  showGrid: true,
  showGridLabels: false,
  animatedSea: true,
  sunAndMoon: true,
  showCountryNames: false,
  hoverPreview: true,
  showVisited: true,
  showUnvisited: true,
  showUserBanner: true,
  // Antarctica, the South Pole and the Magnetic South Pole, and the map's extent down to
  // them (projection.js mapExtent). Only the view changes: visits and stats don't.
  showAntarctica: true,
  // The pinned note beside places with moments (components/map/MomentMarks.jsx)
  showMoments: true,
  // The luggage tag under the map's title with the nearest goal's progress
  // (components/achievements/GoalTag.jsx)
  showGoalTag: true,
  // The whole map page in greys (a greyscale filter: the sea's depths, the countries, the
  // tags and every panel), except the photo viewer and slideshow, where photos keep their
  // colour; the trip page's map too
  blackAndWhite: false,
};

// Grouped as the settings panel shows them.
// `detailed`: the Detailed map type always shows it, so its switch is locked on there.
// `wideOnly`: only drawn on wide screens (lg and up), so its switch is hidden elsewhere.
export const MAP_SETTING_TOGGLES = [
  { key: 'blackAndWhite', label: 'Black and white', group: 'colour' },
  { key: 'showVisited', label: 'Countries you have been to', group: 'countries' },
  { key: 'showUnvisited', label: 'Countries you have not been to', group: 'countries' },
  { key: 'showAntarctica', label: 'Antarctica', group: 'countries' },
  { key: 'showMoments', label: 'Moments', group: 'countries' },
  { key: 'showGoalTag', label: 'Goal progress tag', group: 'countries' },
  { key: 'showGrid', label: 'Latitude and longitude lines', group: 'map', detailed: true },
  { key: 'showGridLabels', label: 'Label the lines', group: 'map', detailed: true },
  { key: 'showCountryNames', label: 'Country names', group: 'map', detailed: true },
  { key: 'showUserBanner', label: 'Banner with your names along the top', group: 'map', wideOnly: true },
  { key: 'animatedSea', label: 'Animated sea', group: 'sky' },
  { key: 'sunAndMoon', label: 'Sun and moon', group: 'sky' },
  { key: 'hoverPreview', label: 'Country posters on hover', group: 'sky' },
];

export const MAP_SETTING_GROUPS = [
  { id: 'colour', legend: 'Colour' },
  { id: 'countries', legend: 'Show on the map' },
  { id: 'map', legend: 'Map details' },
  { id: 'sky', legend: 'Sea, sky and hover' },
];

/** Keeps only known keys with the right types; anything else falls back to the default. */
export function cleanMapSettings(value) {
  const input = value && typeof value === 'object' ? value : {};
  const clean = { ...DEFAULT_MAP_SETTINGS };
  if (MAP_STYLE_IDS.includes(input.style)) clean.style = input.style;
  if (MAP_TYPE_IDS.includes(input.mapType)) clean.mapType = input.mapType;
  if (LANDMARK_PIN_MODE_IDS.includes(input.landmarkPins)) clean.landmarkPins = input.landmarkPins;
  for (const { key } of MAP_SETTING_TOGGLES) {
    if (typeof input[key] === 'boolean') clean[key] = input[key];
  }
  return clean;
}
