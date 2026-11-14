// How a country stands on a map (CountryVisit.status), and how it's drawn.
import { COUNTRY_COLOUR } from './countryStyle';

export const VISIT_STATUSES = [
  { value: 'VISITED', label: 'Visited' },
  { value: 'LIVED', label: 'Lived there' },
  { value: 'WANT_TO_GO', label: 'Want to go' },
];

export const VISIT_STATUS_LABELS = Object.fromEntries(VISIT_STATUSES.map((s) => [s.value, s.label]));

// For a status picker: 'Not yet' clears the country (DELETE)
export const VISIT_STATUS_OPTIONS = [{ value: '', label: 'Not yet' }, ...VISIT_STATUSES];

// Every country wears one of the old map's seven pastels (my_planet's ColoursArray),
// assigned in countryStyle.js so neighbours never match. Visited and lived-in countries
// are marked with a star badge (VisitBadges) and a dark outline; "want to go" with a
// dashed one.
const PASTEL_FILLS = [
  'fill-map-visit-1',
  'fill-map-visit-2',
  'fill-map-visit-3',
  'fill-map-visit-4',
  'fill-map-visit-5',
  'fill-map-visit-6',
  'fill-map-visit-7',
];

const pastelFor = (code) => PASTEL_FILLS[(COUNTRY_COLOUR[code] || 1) - 1];

export function countryFillClass(code, status) {
  const fill = pastelFor(code);
  if (status === 'VISITED') return `${fill} stroke-map-ink`;
  if (status === 'LIVED') return `${fill} stroke-map-ink stroke-[1.4]`;
  if (status === 'WANT_TO_GO') return `${fill} stroke-map-wish stroke-[1.4] [stroke-dasharray:3_2]`;
  return `${fill} stroke-map-land-edge`;
}

export const countsAsVisited = (status) => status === 'VISITED' || status === 'LIVED';
