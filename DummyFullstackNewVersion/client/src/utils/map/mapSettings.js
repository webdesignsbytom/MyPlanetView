// A person's map viewing preferences. Saved to their profile (PUT /api/users/map-settings)
// when signed in, and to this browser either way. The server keeps the same keys
// (server/src/utils/mapSettings.js).
import { MAP_STYLE_IDS } from './mapStyles.js';
import { MAP_TYPE_IDS } from './mapTypes.js';

export const MAP_SETTINGS_STORAGE_KEY = 'myPlanetViewMapSettings';

export const DEFAULT_MAP_SETTINGS = {
  style: 'animated',
  mapType: 'regular',
  showGrid: true,
  showGridLabels: false,
  animatedSea: true,
  sunAndMoon: true,
  showCountryNames: false,
  hoverPreview: true,
  showVisited: true,
  showUnvisited: true,
  showUserBanner: true,
};

// Grouped as the settings panel shows them
export const MAP_SETTING_TOGGLES = [
  { key: 'showVisited', label: 'Countries you have been to', group: 'countries' },
  { key: 'showUnvisited', label: 'Countries you have not been to', group: 'countries' },
  { key: 'showGrid', label: 'Latitude and longitude lines', group: 'map' },
  { key: 'showGridLabels', label: 'Label the lines', group: 'map' },
  { key: 'showCountryNames', label: 'Country names', group: 'map' },
  { key: 'showUserBanner', label: 'Map banner', group: 'map' },
  { key: 'animatedSea', label: 'Animated sea', group: 'sky' },
  { key: 'sunAndMoon', label: 'Sun and moon', group: 'sky' },
  { key: 'hoverPreview', label: 'Photos and posters on hover', group: 'sky' },
];

export const MAP_SETTING_GROUPS = [
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
  for (const { key } of MAP_SETTING_TOGGLES) {
    if (typeof input[key] === 'boolean') clean[key] = input[key];
  }
  return clean;
}
