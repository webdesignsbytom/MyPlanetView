// Vs mode (26 Nov 2026, the user's wish: "connect to another account and have all your stats and
// badges compared. Able to add multiple people. Gold silver bronze ratings for top people";
// docs/API.md "Vs mode"): what's compared, the medals in each, the medal table, and checking an
// input. Pure, so tested on its own (tests/vs.test.js). The client's copy is
// client/src/utils/vs/vsRules.js (the mock's; a test compares them).
import { sanitizeText } from './sanitize.js';
import { isUuid } from './travelValidation.js';

// What's compared, in the order shown; each is a count where more is better
export const VS_CATEGORIES = Object.freeze([
  'countries',
  'unCountries',
  'continents',
  'landmarks',
  'worldHeritage',
  'oneShots',
  'badges',
  'flights',
  'daysAway',
  'distanceKm',
]);

export const VS_LIMITS = Object.freeze({
  // People in one comparison (the user's decision, 26 Nov 2026), and comparisons one person is in
  members: 8,
  perUser: 30,
  title: 80,
});

export const VS_DEFAULT_TITLE = 'Who has travelled most?';

export const MEDALS = Object.freeze(['gold', 'silver', 'bronze']);

/**
 * Each value's place, highest first, ties sharing a place and the next place skipping (1, 1,
 * 3). `null` (someone with no map that counts) has no place. -> places, in the values' order
 */
export function competitionPlaces(values) {
  return values.map((value) => (value === null || value === undefined ? null : 1 + values.filter((other) => other !== null && other !== undefined && other > value).length));
}

/**
 * The medals in one category: gold, silver and bronze for the first three places, ties sharing
 * one, never for nothing (a 0) and only once two people are counted. -> a medal or null per value
 */
export function medalsFor(values) {
  const counted = values.filter((value) => value !== null && value !== undefined).length;
  if (counted < 2) return values.map(() => null);
  return competitionPlaces(values).map((place, i) => (place && place <= 3 && values[i] > 0 ? MEDALS[place - 1] : null));
}

/**
 * The medal table: each person's golds, silvers and bronzes across the categories (`medals`, a
 * list per person of category -> medal), and their place: most golds first, then silvers, then
 * bronzes, ties sharing a place. -> `[{ gold, silver, bronze, place }]`, in the people's order
 */
export function medalTable(medals) {
  const tallies = medals.map((byCategory) => {
    const tally = { gold: 0, silver: 0, bronze: 0 };
    for (const medal of Object.values(byCategory)) if (medal) tally[medal] += 1;
    return tally;
  });
  const score = (t) => t.gold * 1e6 + t.silver * 1e3 + t.bronze;
  const scores = tallies.map(score);
  const places = competitionPlaces(scores);
  return tallies.map((tally, i) => ({ ...tally, place: places[i] }));
}

/**
 * Everyone's numbers compared: `people` are `[{ values: { category: number } | null }]` (null:
 * no map that counts, so no medals and no place). -> per person `{ medals: { category:
 * medal|null }, gold, silver, bronze, place }`
 */
export function compareAll(people) {
  const medals = people.map(() => ({}));
  for (const category of VS_CATEGORIES) {
    const won = medalsFor(people.map((person) => (person.values ? (person.values[category] ?? 0) : null)));
    won.forEach((medal, i) => {
      medals[i][category] = medal;
    });
  }
  // The table places only the people counted
  const counted = people.map((person, i) => (person.values ? i : null)).filter((i) => i !== null);
  const table = medalTable(counted.map((i) => medals[i]));
  const placed = new Map(counted.map((i, at) => [i, table[at]]));
  return people.map((_, i) => ({ medals: medals[i], ...(placed.get(i) ?? { gold: 0, silver: 0, bronze: 0, place: null }) }));
}

/** A comparison's title from a request: cleaned, cut to 80; the usual one when empty. */
export const parseVsTitle = (value) => (typeof value === 'string' ? sanitizeText(value, { maxLength: VS_LIMITS.title }) : '') || VS_DEFAULT_TITLE;

/** The map someone wants counted: a map id. -> `{ ok, mapId }` */
export const parseVsMapId = (value) => (typeof value === 'string' && isUuid(value) ? { ok: true, mapId: value } : { ok: false });
