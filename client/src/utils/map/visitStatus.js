// How a country stands on a map (CountryVisit.status), and how it's drawn.
import { COUNTRY_COLOUR } from './countryStyle';
import { UK_NATION_COLOUR } from './ukNations';
import { regionParent } from './regionPlaces';

export const VISIT_STATUSES = [
  { value: 'VISITED', label: 'Visited' },
  { value: 'LIVED', label: 'Lived there' },
  { value: 'WANT_TO_GO', label: 'Want to go' },
];

export const VISIT_STATUS_LABELS = Object.fromEntries(VISIT_STATUSES.map((s) => [s.value, s.label]));

// For a status picker: 'Not yet' clears the country (DELETE)
export const VISIT_STATUS_OPTIONS = [{ value: '', label: 'Not yet' }, ...VISIT_STATUSES];

// Every country wears one of the old map's seven pastels (my_planet's ColoursArray),
// assigned in countryStyle.js so neighbours never match, and the same thin border.
// Visited and lived-in places are marked only by their badge (VisitBadges);
// "want to go" by a dashed outline.
const PASTEL_FILLS = [
  'fill-map-visit-1',
  'fill-map-visit-2',
  'fill-map-visit-3',
  'fill-map-visit-4',
  'fill-map-visit-5',
  'fill-map-visit-6',
  'fill-map-visit-7',
];

// A region (Bali, Tasmania) wears its country's, as part of it (18 Nov 2026, the user's wish)
/** One of the seven pastels' fill classes by number (a country map's states: CountryMapView). */
export const pastelFill = (n) => PASTEL_FILLS[((n || 1) - 1) % PASTEL_FILLS.length];

const pastelFor = (code) => PASTEL_FILLS[(COUNTRY_COLOUR[regionParent(code) ?? code] || UK_NATION_COLOUR[code] || 1) - 1];

// Antarctica isn't a country: it's drawn as ice, with an ice-blue outline, as an atlas
// draws it (the --map-ice tokens, per map style)
const ICE = 'AQ';

export function countryFillClass(code, status) {
  const ice = code === ICE;
  const fill = ice ? 'fill-map-ice' : pastelFor(code);
  // Visited and lived-in countries keep the same border as every other country: their
  // star badge marks them. "Want to go" has no badge, so it keeps a dashed outline.
  if (status === 'WANT_TO_GO') return `${fill} stroke-map-wish stroke-[1.4] [stroke-dasharray:3_2]`;
  return `${fill} ${ice ? 'stroke-map-ice-edge' : 'stroke-map-land-edge'}`;
}

export const countsAsVisited = (status) => status === 'VISITED' || status === 'LIVED';
