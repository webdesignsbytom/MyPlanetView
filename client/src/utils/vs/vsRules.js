// Vs mode (docs/API.md "Vs mode"; 26 Nov 2026): the server's rules, copied (server/src/utils/vs.js;
// a test compares them), for the mock.
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

export const VS_LIMITS = Object.freeze({ members: 8, perUser: 30, title: 80 });
export const VS_DEFAULT_TITLE = 'Who has travelled most?';
export const MEDALS = Object.freeze(['gold', 'silver', 'bronze']);

const present = (value) => value !== null && value !== undefined;

/** Each value's place, highest first, ties sharing a place (1, 1, 3); none for null. */
export function competitionPlaces(values) {
  return values.map((value) => (present(value) ? 1 + values.filter((other) => present(other) && other > value).length : null));
}

/** Gold, silver and bronze for the first three places, never for 0, only once two are counted. */
export function medalsFor(values) {
  const counted = values.filter(present).length;
  if (counted < 2) return values.map(() => null);
  return competitionPlaces(values).map((place, i) => (place && place <= 3 && values[i] > 0 ? MEDALS[place - 1] : null));
}

/** Each person's golds, silvers and bronzes, and their place by them. */
export function medalTable(medals) {
  const tallies = medals.map((byCategory) => {
    const tally = { gold: 0, silver: 0, bronze: 0 };
    for (const medal of Object.values(byCategory)) if (medal) tally[medal] += 1;
    return tally;
  });
  const places = competitionPlaces(tallies.map((t) => t.gold * 1e6 + t.silver * 1e3 + t.bronze));
  return tallies.map((tally, i) => ({ ...tally, place: places[i] }));
}

/** Everyone compared (`[{ values | null }]`): medals per category, the tally and place (none without a map). */
export function compareAll(people) {
  const medals = people.map(() => ({}));
  for (const category of VS_CATEGORIES) {
    const won = medalsFor(people.map((person) => (person.values ? (person.values[category] ?? 0) : null)));
    won.forEach((medal, i) => {
      medals[i][category] = medal;
    });
  }
  const counted = people.map((person, i) => (person.values ? i : null)).filter((i) => i !== null);
  const table = medalTable(counted.map((i) => medals[i]));
  const placed = new Map(counted.map((i, at) => [i, table[at]]));
  return people.map((_, i) => ({ medals: medals[i], ...(placed.get(i) ?? { gold: 0, silver: 0, bronze: 0, place: null }) }));
}
