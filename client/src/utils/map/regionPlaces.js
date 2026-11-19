// Regions (18 Nov 2026, the user's wish): places that are part of a country but that
// travellers name on their own: Bali, the Galápagos Islands, Goa, Hawaii, New Caledonia
// and Tasmania. They're rows of the country list (utils/map/countries.js, `kind: 'REGION'`),
// each with its own visit, poster, hover card and ticket, drawn in its country's colour
// (Goa, too small for a shape, as a dot). They're neither countries nor special places: no
// country count includes them (ukNations.js countedCountryCodes), they have their own stat,
// and photos, trips, moments and landmarks stay with the country (ukNations.js placeOnMap;
// a region's ticket opens its country's for those). Marking one visited or lived marks its
// country visited too (specialPlaces.js PARENT_PLACE).
// A copy of server/src/utils/regionPlaces.js; keep the two in step.

// Region → the country it's part of. Codes from ISO 3166's user-assigned range, except New
// Caledonia's own (NC), a country on the map until 18 Nov 2026 (the user: it's France's), and
// South Georgia and the South Sandwich Islands' own (GS), the UK's, drawn as part of it until
// then (18 Nov 2026, the user's wish). The Azores (XZ, Portugal's) came the same day.
export const REGION_PARENT = Object.freeze({ XZ: 'PT', XB: 'ID', XA: 'EC', XG: 'IN', XH: 'US', NC: 'FR', GS: 'GB', XT: 'AU' });
export const REGION_CODES = Object.freeze(Object.keys(REGION_PARENT));

export const isRegion = (code) => Object.hasOwn(REGION_PARENT, code);

/** The country a region is part of; null for any other place. */
export const regionParent = (code) => REGION_PARENT[code] ?? null;

// The client's own: where each region is, as a box of latitude and longitude that holds all
// of it and nothing else of its country. images/src/tools/country-outlines.mjs cuts each
// region's islands out of its country with these (New Caledonia is Natural Earth's own
// unit; Goa is a dot), and a region's ticket lists its country's landmarks inside it
// (useLandmarks).
export const REGION_AREA = Object.freeze({
  // All nine islands, Flores and Corvo in the west to Santa Maria in the east (Madeira, far
  // to the south-east, stays Portugal's)
  XZ: { south: 36.5, north: 40.2, west: -31.6, east: -24.5 },
  // Bali with Nusa Penida (Java ends west of 114.4°, Lombok starts east of 115.8°)
  XB: { south: -9, north: -8, west: 114.4, east: 115.75 },
  // Darwin Island in the north to Española in the south
  XA: { south: -1.8, north: 1.8, west: -92.2, east: -89 },
  XG: { south: 14.85, north: 15.82, west: 73.6, east: 74.35 },
  // The main islands, Niihau to the Big Island
  XH: { south: 18.5, north: 22.5, west: -160.6, east: -154 },
  NC: { south: -23, north: -19.4, west: 163.4, east: 168.3 },
  // South Georgia (with Shag Rocks, west of it) and the South Sandwich Islands
  GS: { south: -59.6, north: -53.3, west: -42.5, east: -26 },
  // Tasmania with King and Flinders Islands
  XT: { south: -44.5, north: -39.4, west: 143.5, east: 149 },
});

/** Whether a position (degrees) is inside a region's box. */
export function inRegionArea(code, latitude, longitude) {
  const area = REGION_AREA[code];
  return Boolean(area) && latitude > area.south && latitude < area.north && longitude > area.west && longitude < area.east;
}
