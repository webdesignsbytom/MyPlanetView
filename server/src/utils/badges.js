// Site badges (docs/API.md, "Badges and goals"; docs/FEATURE-PLAN.md, "Site badges"): a
// fixed list, counted from the map's own data. Only the awards are stored (BadgeAward),
// when the owner or an editor loads the badges; they're never taken back. Pure: the
// service loads the facts (services/travel/achievements.js). The client words each key.
import { INHABITED_CONTINENTS, REGIONS, regionCodesOnMap } from './constants/regions.js';
import { isSpecialPlace, withParentPlaces } from './specialPlaces.js';
import { countedCountryCodes } from './ukNations.js';

const continentKey = (continent) => continent.toLowerCase().replace(/_/g, '-');

/**
 * Every badge: `key` (stored; never rename one), `group` (how the page lays them out),
 * `need` and what's counted.
 */
export const BADGES = Object.freeze([
  ...[1, 5, 10, 25, 50, 100].map((need) => ({ key: `countries-${need}`, group: 'countries', measure: 'countries', need })),
  ...INHABITED_CONTINENTS.map((continent) => ({
    key: `continent-${continentKey(continent)}`,
    group: 'continents',
    measure: 'continent',
    continent,
    need: 1,
  })),
  { key: 'continents-all', group: 'continents', measure: 'inhabitedContinents', need: INHABITED_CONTINENTS.length },
  // Special places: Antarctica (a visit to the South Pole brings it), and the poles
  { key: 'antarctica', group: 'special', measure: 'place', code: 'AQ', need: 1 },
  { key: 'north-pole', group: 'special', measure: 'place', code: 'XN', need: 1 },
  { key: 'south-pole', group: 'special', measure: 'place', code: 'XS', need: 1 },
  ...Object.entries(REGIONS).map(([region, { codes }]) => ({
    key: `region-${region}`,
    group: 'regions',
    measure: 'region',
    region,
    need: codes.length,
  })),
  ...[1, 10, 50].map((need) => ({ key: `landmarks-${need}`, group: 'landmarks', measure: 'landmarks', need })),
  ...[5, 25].map((need) => ({ key: `unesco-${need}`, group: 'landmarks', measure: 'unesco', need })),
  ...[100, 1000].map((need) => ({ key: `photos-${need}`, group: 'photos', measure: 'photos', need })),
  // Monthly photo themes entered (docs/API.md, "Photo themes"): months with a photo in
  ...[3, 6, 12].map((need) => ({ key: `themes-${need}`, group: 'themes', measure: 'themes', need })),
]);

export const BADGE_KEYS = Object.freeze(BADGES.map((badge) => badge.key));

/**
 * How far a map is towards each badge.
 * @param {object} facts
 * @param {Set<string>} facts.visited countries and special places marked VISITED or LIVED
 * @param {Map<string, string>} facts.continentByCode
 * @param {{ isUnesco: boolean }[]} facts.stamps the passport's stamps (confirmed landmarks)
 * @param {number} facts.photos
 * @param {number} facts.themes monthly themes the map has a photo in
 * @param {boolean} facts.splitUk the map shows the UK as its four nations: they count as
 *   countries one each, and a region holds them instead of the UK (`need` follows)
 * @returns {{ key: string, group: string, have: number, need: number, earned: boolean }[]}
 */
export function badgeProgress({ visited = new Set(), continentByCode = new Map(), stamps = [], photos = 0, themes = 0, splitUk = false }) {
  const countries = countedCountryCodes(
    [...visited].filter((code) => !isSpecialPlace(code)),
    splitUk
  );
  // Continents with a country on them (special places don't open one)
  const continents = new Set(countries.map((code) => continentByCode.get(code)).filter(Boolean));
  const counts = {
    countries: countries.length,
    inhabitedContinents: INHABITED_CONTINENTS.filter((c) => continents.has(c)).length,
    landmarks: stamps.length,
    unesco: stamps.filter((stamp) => stamp.isUnesco).length,
    photos,
    themes,
  };
  const haveFor = (badge) => {
    if (badge.measure === 'continent') return continents.has(badge.continent) ? 1 : 0;
    if (badge.measure === 'place') return visited.has(badge.code) ? 1 : 0;
    if (badge.measure === 'region') return regionCodesOnMap(badge.region, splitUk).filter((code) => visited.has(code)).length;
    return counts[badge.measure];
  };
  const needFor = (badge) => (badge.measure === 'region' ? regionCodesOnMap(badge.region, splitUk).length : badge.need);
  return BADGES.map((badge) => {
    const have = haveFor(badge);
    const need = needFor(badge);
    return { key: badge.key, group: badge.group, have: Math.min(have, need), need, earned: have >= need };
  });
}

// Per traveller (docs/API.md, "Badges and goals": `travellers`): the travel badges only,
// counted from the completed trips each person was on, since visits and photos belong to
// the whole map. Worked out on each read, never stored.
export const TRAVELLER_BADGE_GROUPS = Object.freeze(['countries', 'continents', 'special', 'regions']);

// A trip's date for the order: its last day, else its first; undated trips come last
const tripDay = (trip) => trip.endDate ?? trip.startDate ?? null;

/**
 * One traveller's travel badges. `trips`: the map's completed trips, `[{ travellerIds,
 * countryCodes, startDate, endDate }]`. Each badge's `earnedOn` is the day of the trip that
 * earned it (its last day, else its first), or null when that trip has no dates.
 * `splitUk`: the map splits the UK (badgeProgress).
 * -> `[{ key, group, have, need, earned, earnedOn }]`
 */
export function travellerBadges({ trips, travellerId, continentByCode = new Map(), splitUk = false }) {
  const own = trips
    .filter((trip) => trip.travellerIds.includes(travellerId))
    .sort((a, b) => {
      const [x, y] = [tripDay(a), tripDay(b)];
      if (x && y) return new Date(x) - new Date(y);
      return x ? -1 : y ? 1 : 0;
    });
  const visited = new Set();
  const earnedOn = new Map();
  for (const trip of own) {
    for (const code of withParentPlaces(trip.countryCodes)) visited.add(code);
    for (const badge of badgeProgress({ visited, continentByCode, splitUk })) {
      if (badge.earned && TRAVELLER_BADGE_GROUPS.includes(badge.group) && !earnedOn.has(badge.key)) {
        earnedOn.set(badge.key, tripDay(trip));
      }
    }
  }
  return badgeProgress({ visited, continentByCode, splitUk })
    .filter((badge) => TRAVELLER_BADGE_GROUPS.includes(badge.group))
    .map((badge) => ({ ...badge, earnedOn: earnedOn.get(badge.key) ?? null }));
}
