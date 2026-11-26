// Distances in kilometres or miles (24 Nov 2026, the user's wish: "we need americans in miles
// always", and a choice; 25 Nov 2026: the UK in miles too, and only two choices). The viewer's
// map setting `distanceUnit` (the server's DISTANCE_UNITS): 'auto' until they choose, which is
// miles for a map whose home is in the United States or the UK, else kilometres; or 'km' or
// 'miles', once chosen. Pure.

export const MILES_PER_KM = 0.621371;

// The setting's values: 'auto' is the one no one picks, kept until they choose
export const DISTANCE_UNIT_IDS = ['auto', 'km', 'miles'];

// What Settings offers (25 Nov 2026, the user's wish: just the two, with the one in use ticked)
export const DISTANCE_CHOICES = [
  { id: 'km', label: 'Kilometres' },
  { id: 'miles', label: 'Miles' },
];

// Where distances are in miles: the United States, Hawaii (a region on the map) and the
// territories whose roads are signed in miles; the UK and its four nations (25 Nov 2026, the
// user's wish)
export const MILES_PLACES = new Set(['US', 'XH', 'PR', 'GU', 'VI', 'AS', 'MP', 'GB', 'XE', 'XC', 'XW', 'XI']);

/**
 * The unit a map's distances are shown in: the setting when it's one of the two, else miles
 * for a map whose home (the statistics' `homeCountryCode`) is in the United States or the UK.
 * -> 'km' | 'miles'
 */
export function distanceUnitFor(setting, homeCountryCode) {
  if (setting === 'km' || setting === 'miles') return setting;
  return MILES_PLACES.has(homeCountryCode) ? 'miles' : 'km';
}
