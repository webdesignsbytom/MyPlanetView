// Site badges (docs/API.md, "Badges and goals"; docs/FEATURE-PLAN.md, "Site badges"): a
// fixed list, counted from the map's own data. Only the awards are stored (BadgeAward),
// when the owner or an editor loads the badges; they're never taken back. Pure: the
// service loads the facts (services/travel/achievements.js). The client words each key.
import { INHABITED_CONTINENTS, REGIONS, regionCodesOnMap } from './constants/regions.js';
import { isSpecialPlace, withParentPlaces } from './specialPlaces.js';
import { countedCountryCodes } from './ukNations.js';
import { oneShotCounts } from './oneShots.js';

const continentKey = (continent) => continent.toLowerCase().replace(/_/g, '-');

/**
 * Every badge: `key` (stored; never rename one), `group` (how the page lays them out),
 * `need` and what's counted.
 */
export const BADGES = Object.freeze([
  ...[1, 5, 10, 25, 50, 100].map((need) => ({ key: `countries-${need}`, group: 'countries', measure: 'countries', need })),
  // Every country on the map (17 Nov 2026, the user's wish): its `need` is the map's own
  // count, 226, or 229 on a map that shows the UK as its four nations (from continentByCode)
  { key: 'countries-all', group: 'countries', measure: 'allCountries', need: 1 },
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
  // 50, 100 and 250 too since 24 Nov 2026 (the user's wish, with the country collections)
  ...[5, 25, 50, 100, 250].map((need) => ({ key: `unesco-${need}`, group: 'landmarks', measure: 'unesco', need })),
  // Life's One Shots (24 Nov 2026): each list's ticks, and the Big Five
  ...[1, 10, 25, 50].map((need) => ({ key: `oneshots-wildlife-${need}`, group: 'oneShots', measure: 'oneShotsWildlife', need })),
  ...[1, 5, 15].map((need) => ({ key: `oneshots-wonders-${need}`, group: 'oneShots', measure: 'oneShotsWonders', need })),
  ...[1, 5, 15].map((need) => ({ key: `oneshots-journeys-${need}`, group: 'oneShots', measure: 'oneShotsJourneys', need })),
  { key: 'big-five', group: 'oneShots', measure: 'bigFive', need: 5 },
  ...[100, 1000].map((need) => ({ key: `photos-${need}`, group: 'photos', measure: 'photos', need })),
  // Monthly photo themes entered (docs/API.md, "Photo themes"): months with a photo in
  ...[3, 6, 12].map((need) => ({ key: `themes-${need}`, group: 'themes', measure: 'themes', need })),
]);

export const BADGE_KEYS = Object.freeze(BADGES.map((badge) => badge.key));

// Country collections (24 Nov 2026, the user's wish: "i like the bronze silver and gold per
// country badges idea. also gives us more chances to have them share it"): bronze for a
// quarter of a place's landmarks stamped in the passport (a photo or a "been here" tick),
// silver for half, gold for all of them. A place is a country, or a UK nation on a map that
// splits the UK (the stamps' own place, utils/ukNations.js landmarkPlace). Not in BADGES:
// there are three for every place with landmarks, so only the places a map has started are
// listed. Keys are `collect-<place>-<tier>`; never rename one.
export const COLLECTION_TIERS = Object.freeze([
  Object.freeze({ tier: 'bronze', share: 0.25 }),
  Object.freeze({ tier: 'silver', share: 0.5 }),
  Object.freeze({ tier: 'gold', share: 1 }),
]);

export const collectionKey = (place, tier) => `collect-${place}-${tier}`;

const COLLECTION_KEY = /^collect-([A-Z]{2})-(bronze|silver|gold)$/;

/** `{ place, tier }` from a collection's key, or null for any other key. */
export function parseCollectionKey(key) {
  const match = COLLECTION_KEY.exec(String(key));
  return match ? { place: match[1], tier: match[2] } : null;
}

/**
 * A place's tiers for its `total` landmarks: each one's `need` (its share, rounded up, at
 * least 1), leaving out a tier that would need as many as the next (a place with one
 * landmark has gold alone, one with two silver and gold), so one stamp never earns two.
 * -> `[{ tier, need }]`, lowest first; none for a place with no landmarks.
 */
export function collectionTiers(total) {
  if (!Number.isInteger(total) || total < 1) return [];
  const tiers = COLLECTION_TIERS.map(({ tier, share }) => ({ tier, need: Math.max(1, Math.ceil(total * share)) }));
  return tiers.filter((tier, index) => index === tiers.length - 1 || tier.need < tiers[index + 1].need);
}

/**
 * Each started place's collection: the places with a stamp, and those in `keep` (a tier
 * already awarded, so it's still listed after a stamp goes), places by code, tiers lowest
 * first. `stamps`: the passport's, each `countryCode` its place; `totals`: place -> how
 * many landmarks it has. A place with no landmarks counted is left out.
 * -> `[{ key, group: 'collections', place, tier, have, need, earned }]`
 */
export function collectionProgress({ stamps = [], totals = new Map(), keep = [] }) {
  const stamped = new Map();
  for (const stamp of stamps) stamped.set(stamp.countryCode, (stamped.get(stamp.countryCode) || 0) + 1);
  const places = [...new Set([...stamped.keys(), ...keep])].filter((place) => totals.get(place) > 0).sort();
  return places.flatMap((place) => {
    const have = stamped.get(place) || 0;
    return collectionTiers(totals.get(place)).map(({ tier, need }) => ({
      key: collectionKey(place, tier),
      group: 'collections',
      place,
      tier,
      have: Math.min(have, need),
      need,
      earned: have >= need,
    }));
  });
}

/** Every country a map shows (the UK's nations instead of the UK on one that splits it). */
export const everyCountryOn = (continentByCode, splitUk) =>
  new Set(
    countedCountryCodes(
      [...continentByCode.keys()].filter((code) => !isSpecialPlace(code)),
      splitUk
    )
  );

/**
 * A badge's `need` on a map: a region's is its places on this map, "every country"'s the
 * map's own count (`everyCountry`, from everyCountryOn); the rest their fixed number.
 */
export function badgeNeed(badge, { splitUk = false, everyCountry = new Set() } = {}) {
  if (badge.measure === 'region') return regionCodesOnMap(badge.region, splitUk).length;
  // Never 0 (no country table to hand): nothing is earned for an empty list
  if (badge.measure === 'allCountries') return Math.max(everyCountry.size, 1);
  return badge.need;
}

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
 * @param {Map<string, number>} facts.landmarkTotals place -> its landmarks (the collections)
 * @param {string[]} facts.keepPlaces places with a collection tier awarded already
 * @param {string[]} facts.oneShots the Life's One Shots items ticked (their keys)
 * @returns {{ key: string, group: string, have: number, need: number, earned: boolean, place?: string, tier?: string }[]}
 */
export function badgeProgress({
  visited = new Set(),
  continentByCode = new Map(),
  stamps = [],
  photos = 0,
  themes = 0,
  splitUk = false,
  landmarkTotals = new Map(),
  keepPlaces = [],
  oneShots = [],
}) {
  const countries = countedCountryCodes(
    [...visited].filter((code) => !isSpecialPlace(code)),
    splitUk
  );
  // Every country this map shows (the UK's nations instead of the UK on a split map)
  const everyCountry = everyCountryOn(continentByCode, splitUk);
  // Continents with a country on them (special places don't open one)
  const continents = new Set(countries.map((code) => continentByCode.get(code)).filter(Boolean));
  const ticked = oneShotCounts(oneShots);
  const counts = {
    oneShotsWildlife: ticked.WILDLIFE,
    oneShotsWonders: ticked.WONDERS,
    oneShotsJourneys: ticked.JOURNEYS,
    bigFive: ticked.bigFive,
    countries: countries.length,
    inhabitedContinents: INHABITED_CONTINENTS.filter((c) => continents.has(c)).length,
    landmarks: stamps.length,
    unesco: stamps.filter((stamp) => stamp.isUnesco).length,
    photos,
    themes,
    allCountries: countries.filter((code) => everyCountry.has(code)).length,
  };
  const haveFor = (badge) => {
    if (badge.measure === 'continent') return continents.has(badge.continent) ? 1 : 0;
    if (badge.measure === 'place') return visited.has(badge.code) ? 1 : 0;
    if (badge.measure === 'region') return regionCodesOnMap(badge.region, splitUk).filter((code) => visited.has(code)).length;
    return counts[badge.measure];
  };
  return [
    ...BADGES.map((badge) => {
      const have = haveFor(badge);
      const need = badgeNeed(badge, { splitUk, everyCountry });
      return { key: badge.key, group: badge.group, have: Math.min(have, need), need, earned: have >= need };
    }),
    // The country collections, after the fixed list
    ...collectionProgress({ stamps, totals: landmarkTotals, keep: keepPlaces }),
  ];
}

// Per traveller (docs/API.md, "Badges and goals": `travellers`): the travel badges only,
// counted from the completed trips each person was on, since visits and photos belong to
// the whole map. Worked out on each read, never stored.
export const TRAVELLER_BADGE_GROUPS = Object.freeze(['countries', 'continents', 'special', 'regions']);

// A trip's date for the order: its last day, else its first; undated trips come last
export const tripDay = (trip) => trip.endDate ?? trip.startDate ?? null;

/** The trips `travellerId` was on, in the order they earn badges: by their day, undated last. */
export const travellerTripsInOrder = (trips, travellerId) =>
  trips
    .filter((trip) => trip.travellerIds.includes(travellerId))
    .sort((a, b) => {
      const [x, y] = [tripDay(a), tripDay(b)];
      if (x && y) return new Date(x) - new Date(y);
      return x ? -1 : y ? 1 : 0;
    });

/**
 * One traveller's travel badges. `trips`: the map's completed trips, `[{ travellerIds,
 * countryCodes, startDate, endDate }]`. Each badge's `earnedOn` is the day of the trip that
 * earned it (its last day, else its first), or null when that trip has no dates.
 * `splitUk`: the map splits the UK (badgeProgress).
 * -> `[{ key, group, have, need, earned, earnedOn }]`
 */
export function travellerBadges({ trips, travellerId, continentByCode = new Map(), splitUk = false }) {
  const own = travellerTripsInOrder(trips, travellerId);
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
