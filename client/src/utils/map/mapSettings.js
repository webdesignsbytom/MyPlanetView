// A person's map viewing preferences. Saved to their profile (PUT /api/users/map-settings)
// when signed in, and to this browser either way. The server keeps the same keys
// (server/src/utils/mapSettings.js).
import { MAP_STYLE_IDS } from './mapStyles.js';
import { MAP_TYPE_IDS } from './mapTypes.js';
import { DISTANCE_UNIT_IDS } from './distanceUnits.js';

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
  // Only the passport's landmarks, at every zoom (18 Nov 2026, the user's wish; it was 'zoomed')
  landmarkPins: 'stamped',
  // The statistics' distances (utils/map/distanceUnits.js; 24 Nov 2026, the user's wish:
  // "Americans in miles always"): miles for a map whose home is in the United States, else
  // kilometres, unless one is chosen
  distanceUnit: 'auto',
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
  // The strings tied between places, like thread on a corkboard (components/map/MapStrings.jsx;
  // 23 Nov 2026): the map's own, each viewer's choice to show
  showStrings: true,
  // The tips the map opens with, once a visit (components/map/MapTipsDialog.jsx, whose box
  // turns this off)
  showTips: true,
  // The celebration when a landmark is first stamped or a country first marked visited
  // (components/map/celebration/CelebrationDialog.jsx, whose box turns this off; 24 Nov 2026)
  showCelebrations: true,
  // Whether the map has offered "Where have you been?" (components/map/QuickFillDialog.jsx;
  // 22 Nov 2026): once per account. Not a switch in Settings
  countriesAsked: false,
  // A paying member's own: their plan's badge on the banner of every map they own, for
  // everyone who opens them (utils/plans/supporterBadge.js; 24 Nov 2026). Its switch is
  // Settings' SupporterBadgeSection, shown to the owner of a paid account only
  showSupporterBadge: true,
};

// Grouped as the settings panel shows them.
// `detailed`: the Detailed map type always shows it, so its switch is locked on there.
// `wideOnly`: only drawn on wide screens (lg and up), so its switch is hidden elsewhere.
export const MAP_SETTING_TOGGLES = [
  { key: 'showVisited', label: 'Countries you have been to', group: 'countries' },
  { key: 'showUnvisited', label: 'Countries you have not been to', group: 'countries' },
  { key: 'showAntarctica', label: 'Antarctica', group: 'countries' },
  { key: 'showMoments', label: 'Moments', group: 'countries' },
  { key: 'showGoalTag', label: 'Goal progress tag', group: 'countries' },
  { key: 'showStrings', label: 'Strings between countries', group: 'countries' },
  { key: 'showGrid', label: 'Latitude and longitude lines', group: 'map', detailed: true },
  { key: 'showGridLabels', label: 'Label the lines', group: 'map', detailed: true },
  { key: 'showCountryNames', label: 'Country names', group: 'map', detailed: true },
  { key: 'showUserBanner', label: 'Banner with your names along the top', group: 'map', wideOnly: true },
  { key: 'animatedSea', label: 'Animated sea', group: 'sky' },
  { key: 'sunAndMoon', label: 'Sun and moon', group: 'sky' },
  { key: 'hoverPreview', label: 'Country posters on hover', group: 'sky' },
  { key: 'showTips', label: 'Tips when the map opens', group: 'help' },
  { key: 'showCelebrations', label: 'Celebrations for new stamps and countries', group: 'help' },
];

export const MAP_SETTING_GROUPS = [
  { id: 'countries', legend: 'Show on the map' },
  { id: 'map', legend: 'Map details' },
  { id: 'sky', legend: 'Sea, sky and hover' },
  { id: 'help', legend: 'Help' },
];

/** Keeps only known keys with the right types; anything else falls back to the default. */
export function cleanMapSettings(value) {
  const input = value && typeof value === 'object' ? value : {};
  const clean = { ...DEFAULT_MAP_SETTINGS };
  if (MAP_STYLE_IDS.includes(input.style)) clean.style = input.style;
  // Black and white was a switch until 19 Nov 2026: one left on over the world map opens as
  // the Black and white style (the next save drops the switch)
  if (input.blackAndWhite === true && clean.style === 'animated') clean.style = 'mono';
  if (MAP_TYPE_IDS.includes(input.mapType)) clean.mapType = input.mapType;
  if (LANDMARK_PIN_MODE_IDS.includes(input.landmarkPins)) clean.landmarkPins = input.landmarkPins;
  if (DISTANCE_UNIT_IDS.includes(input.distanceUnit)) clean.distanceUnit = input.distanceUnit;
  for (const { key } of MAP_SETTING_TOGGLES) {
    if (typeof input[key] === 'boolean') clean[key] = input[key];
  }
  if (typeof input.countriesAsked === 'boolean') clean.countriesAsked = input.countriesAsked;
  if (typeof input.showSupporterBadge === 'boolean') clean.showSupporterBadge = input.showSupporterBadge;
  return clean;
}
