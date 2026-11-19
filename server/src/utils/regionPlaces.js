// Regions (docs/API.md "Regions"; 18 Nov 2026, the user's wish): places that are part of a
// country but that travellers name on their own: Bali, the Galápagos Islands, Goa, Hawaii,
// South Georgia,
// New Caledonia and Tasmania. Rows of the Country table with kind REGION, kept as constants
// too so counts need no join. Each has its own visit; they're neither countries nor special
// places: no country count includes them (ukNations.js countedCountryCodes), and photos,
// trips, moments and travellers' places go to the country (ukNations.js placeOnMap).
// Marking one visited or lived marks its country visited too (specialPlaces.js
// PARENT_PLACE). Pure, so it's unit-tested. The client's copy is
// client/src/utils/map/regionPlaces.js; keep the two in step.

// Region → the country it's part of. Codes from ISO 3166's user-assigned range, except New
// Caledonia's own (NC), a country on the map until 18 Nov 2026 (the user: it's France's), and
// South Georgia and the South Sandwich Islands' own (GS), the UK's, drawn as part of it until
// then (18 Nov 2026, the user's wish). The Azores (XZ, Portugal's) came the same day.
export const REGION_PARENT = Object.freeze({ XZ: 'PT', XB: 'ID', XA: 'EC', XG: 'IN', XH: 'US', NC: 'FR', GS: 'GB', XT: 'AU' });
export const REGION_CODES = Object.freeze(Object.keys(REGION_PARENT));

export const isRegion = (code) => Object.hasOwn(REGION_PARENT, code);

/** The country a region is part of; null for any other place. */
export const regionParent = (code) => REGION_PARENT[code] ?? null;
