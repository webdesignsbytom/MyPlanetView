// Site badges (docs/API.md, "Badges and goals"; docs/FEATURE-PLAN.md, "Site badges"): a
// fixed list, counted from the map's own data. Only the awards are stored (BadgeAward),
// when the owner or an editor loads the badges; they're never taken back. Pure: the
// service loads the facts (services/travel/achievements.js). The client words each key.
import { INHABITED_CONTINENTS, REGIONS } from './constants/regions.js';
import { isSpecialPlace } from './specialPlaces.js';

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
]);

export const BADGE_KEYS = Object.freeze(BADGES.map((badge) => badge.key));

/**
 * How far a map is towards each badge.
 * @param {object} facts
 * @param {Set<string>} facts.visited countries and special places marked VISITED or LIVED
 * @param {Map<string, string>} facts.continentByCode
 * @param {{ isUnesco: boolean }[]} facts.stamps the passport's stamps (confirmed landmarks)
 * @param {number} facts.photos
 * @returns {{ key: string, group: string, have: number, need: number, earned: boolean }[]}
 */
export function badgeProgress({ visited = new Set(), continentByCode = new Map(), stamps = [], photos = 0 }) {
  const countries = [...visited].filter((code) => !isSpecialPlace(code));
  // Continents with a country on them (special places don't open one)
  const continents = new Set(countries.map((code) => continentByCode.get(code)).filter(Boolean));
  const counts = {
    countries: countries.length,
    inhabitedContinents: INHABITED_CONTINENTS.filter((c) => continents.has(c)).length,
    landmarks: stamps.length,
    unesco: stamps.filter((stamp) => stamp.isUnesco).length,
    photos,
  };
  const haveFor = (badge) => {
    if (badge.measure === 'continent') return continents.has(badge.continent) ? 1 : 0;
    if (badge.measure === 'place') return visited.has(badge.code) ? 1 : 0;
    if (badge.measure === 'region') return REGIONS[badge.region].codes.filter((code) => visited.has(code)).length;
    return counts[badge.measure];
  };
  return BADGES.map((badge) => {
    const have = haveFor(badge);
    return { key: badge.key, group: badge.group, have: Math.min(have, badge.need), need: badge.need, earned: have >= badge.need };
  });
}
