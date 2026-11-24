// Distances in kilometres or miles (24 Nov 2026, the user's wish: "we need americans in miles
// always", and a choice). The viewer's map setting `distanceUnit` (the server's
// DISTANCE_UNITS): 'auto', miles for a map whose home is in the United States or one of its
// territories, else kilometres; or always 'km', or always 'miles'. Pure.

export const MILES_PER_KM = 0.621371;

export const DISTANCE_UNITS = [
  { id: 'auto', label: 'Miles for a map whose home is in the United States, else kilometres' },
  { id: 'km', label: 'Always kilometres' },
  { id: 'miles', label: 'Always miles' },
];
export const DISTANCE_UNIT_IDS = DISTANCE_UNITS.map((unit) => unit.id);

// Where distances are in miles: the United States, Hawaii (a region on the map) and the
// territories whose roads are signed in miles
export const MILES_PLACES = new Set(['US', 'XH', 'PR', 'GU', 'VI', 'AS', 'MP']);

/**
 * The unit a map's distances are shown in: the setting when it's one of the two, else miles
 * for a map whose home (the statistics' `homeCountryCode`) is in the United States.
 * -> 'km' | 'miles'
 */
export function distanceUnitFor(setting, homeCountryCode) {
  if (setting === 'km' || setting === 'miles') return setting;
  return MILES_PLACES.has(homeCountryCode) ? 'miles' : 'km';
}
