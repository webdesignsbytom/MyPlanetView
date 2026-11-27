// The story behind a badge (27 Nov 2026, the user's wish: "click on an achieved badge and see a
// cool looking container with the badge and what they did to earn it"; docs/API.md "Badges and
// goals"): the things the badge counts, in the order they happened, up to as many as it needs,
// and the one that earned it. Pure: the service loads the facts (services/travel/badgeStories.js);
// the client words it. The mock keeps a copy (client/src/dev/mock/badgeStories.js).
import { BADGES, TRAVELLER_BADGE_GROUPS, badgeNeed, collectionTiers, everyCountryOn, parseCollectionKey, tripDay, travellerTripsInOrder } from './badges.js';
import { INHABITED_CONTINENTS, regionCodesOnMap } from './constants/regions.js';
import { BIG_FIVE, ONE_SHOT_BY_KEY } from './constants/oneShots.js';
import { earliestOf, passportPageOrder } from './passportOrder.js';
import { isSpecialPlace, withParentPlaces } from './specialPlaces.js';
import { countedCountryCodes } from './ukNations.js';
import { COUNTED_VISIT_STATUSES, toDateOnly } from './travelValidation.js';

const BADGE_BY_KEY = new Map(BADGES.map((badge) => [badge.key, badge]));
const ONE_SHOT_LIST = { oneShotsWildlife: 'WILDLIFE', oneShotsWonders: 'WONDERS', oneShotsJourneys: 'JOURNEYS' };

/**
 * What each measure's story is made of: `places` visited, passport `stamps`, Life's
 * `oneShots`, monthly `themes` entered, or `photos` (a count, and the photo that reached it).
 */
export const STORY_KINDS = Object.freeze({
  countries: 'places',
  allCountries: 'places',
  continent: 'places',
  inhabitedContinents: 'places',
  place: 'places',
  region: 'places',
  landmarks: 'stamps',
  unesco: 'stamps',
  collection: 'stamps',
  oneShotsWildlife: 'oneShots',
  oneShotsWonders: 'oneShots',
  oneShotsJourneys: 'oneShots',
  bigFive: 'oneShots',
  photos: 'photos',
  themes: 'themes',
});

/**
 * The badge a key names, or null: a fixed one from BADGES, or a country collection's tier as
 * `{ key, group: 'collections', measure: 'collection', place, tier }`. With `traveller`, only
 * the travel badges one person has (utils/badges.js TRAVELLER_BADGE_GROUPS).
 */
export function storyBadge(key, { traveller = false } = {}) {
  const collection = parseCollectionKey(key);
  const badge = BADGE_BY_KEY.get(key) ?? (collection ? { key, group: 'collections', measure: 'collection', ...collection } : null);
  if (!badge) return null;
  return traveller && !TRAVELLER_BADGE_GROUPS.includes(badge.group) ? null : badge;
}

/**
 * The map's places visited or lived in, in the passport's order (utils/passportOrder.js): by
 * the first visit, the earlier of its first photo and its "First went" day, else the day it
 * was marked. `visits`: `[{ countryCode, status, firstVisitedOn, createdAt }]`; `firstPhotoAt`:
 * code -> Date. -> `[{ code, on }]`, `on` "YYYY-MM-DD" or null (undated).
 */
export function mapPlaces({ visits = [], firstPhotoAt = new Map() }) {
  const counted = new Map(visits.filter((v) => COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => [v.countryCode, v]));
  const enteredOn = (code) => earliestOf(firstPhotoAt.get(code), counted.get(code)?.firstVisitedOn);
  return passportPageOrder([...counted.keys()], { enteredOn, markedAt: (code) => counted.get(code)?.createdAt ?? null }).map((code) => ({
    code,
    on: toDateOnly(enteredOn(code)),
  }));
}

/**
 * One traveller's places, from the completed trips they were on, in the order those trips
 * earn their badges (utils/badges.js travellerBadges): each place once, with the trip that
 * first took them there. `trips`: `[{ id, title, travellerIds, countryCodes, startDate, endDate }]`.
 * -> `[{ code, on, trip: { id, title } }]`
 */
export function travellerPlaces(trips, travellerId) {
  const seen = new Set();
  const places = [];
  for (const trip of travellerTripsInOrder(trips, travellerId)) {
    for (const code of withParentPlaces(trip.countryCodes)) {
      if (seen.has(code)) continue;
      seen.add(code);
      places.push({ code, on: tripDay(trip), trip: { id: trip.id, title: trip.title } });
    }
  }
  return places;
}

const timeOf = (value) => new Date(value).getTime();

/** The passport's stamps in the order stamped (on one day, by name), as a story's items. */
export const stampItems = (stamps) =>
  [...stamps]
    .sort((a, b) => a.firstShotAt - b.firstShotAt || a.name.localeCompare(b.name))
    .map((s) => ({ landmarkId: s.landmarkId, name: s.name, code: s.countryCode, isUnesco: s.isUnesco, on: toDateOnly(s.firstShotAt), ticked: s.ticked }));

/** Life's One Shots in the order seen: by the day seen, else the day ticked; then as ticked. */
export const oneShotItems = (ticks) =>
  [...ticks]
    .sort((a, b) => timeOf(a.seenOn ?? a.createdAt) - timeOf(b.seenOn ?? b.createdAt) || timeOf(a.createdAt) - timeOf(b.createdAt))
    .map((t) => ({ itemKey: t.itemKey, code: t.countryCode ?? null, on: toDateOnly(t.seenOn), datePrecision: t.datePrecision ?? null }));

/** The places a badge counts, in order (`places` as mapPlaces or travellerPlaces gives them). */
function placeItems(badge, { places, splitUk, continentByCode }) {
  const countries = new Set(
    countedCountryCodes(
      places.map((p) => p.code).filter((code) => !isSpecialPlace(code)),
      splitUk
    )
  );
  const countryPlaces = places.filter((p) => countries.has(p.code));
  switch (badge.measure) {
    case 'countries':
      return countryPlaces;
    case 'allCountries': {
      const every = everyCountryOn(continentByCode, splitUk);
      return countryPlaces.filter((p) => every.has(p.code));
    }
    case 'continent':
      return countryPlaces.filter((p) => continentByCode.get(p.code) === badge.continent);
    case 'inhabitedContinents': {
      // The first country on each continent, the one that opened it
      const opened = new Set();
      return countryPlaces.flatMap((p) => {
        const continent = continentByCode.get(p.code);
        if (!INHABITED_CONTINENTS.includes(continent) || opened.has(continent)) return [];
        opened.add(continent);
        return [{ ...p, continent }];
      });
    }
    case 'place':
      return places.filter((p) => p.code === badge.code);
    case 'region': {
      const codes = new Set(regionCodesOnMap(badge.region, splitUk));
      return places.filter((p) => codes.has(p.code));
    }
    default:
      return [];
  }
}

/** The stamps, Life's One Shots or themes a badge counts, in order. */
function otherItems(badge, { stamps, oneShots, themes }) {
  switch (badge.measure) {
    case 'landmarks':
      return stamps;
    case 'unesco':
      return stamps.filter((s) => s.isUnesco);
    case 'collection':
      return stamps.filter((s) => s.code === badge.place);
    case 'bigFive':
      return oneShots.filter((t) => BIG_FIVE.includes(t.itemKey));
    case 'themes':
      return themes;
    default:
      return ONE_SHOT_LIST[badge.measure] ? oneShots.filter((t) => ONE_SHOT_BY_KEY.get(t.itemKey)?.list === ONE_SHOT_LIST[badge.measure]) : [];
  }
}

/**
 * A badge's story, or null for a key that names no badge (or a collection tier its place
 * doesn't have).
 * @param {string} key
 * @param {object} facts
 * @param {{ code, on, trip? }[]} facts.places the places visited or lived in, in order (mapPlaces, travellerPlaces)
 * @param {{ landmarkId, name, code, isUnesco, on, ticked }[]} facts.stamps the passport's, in the order stamped
 * @param {{ itemKey, code, on, datePrecision }[]} facts.oneShots ticked, in the order seen
 * @param {{ title, month, on }[]} facts.themes entered, in the order first entered
 * @param {number} facts.photos how many photos the map has
 * @param {object|null} facts.photo the photo that brought the count to the badge's need (the service finds it)
 * @param {boolean} facts.splitUk the map shows the UK as its nations
 * @param {Map<string, string>} facts.continentByCode
 * @param {Map<string, number>} facts.landmarkTotals place -> its landmarks (the collections)
 * @returns {{ key, group, measure, kind, need, have, items, earnedWith, photo?, continent?, region?, code?, place?, tier? } | null}
 *   `items`: what counts, at most `need` of them; `earnedWith`: the index of the one that
 *   earned the badge (the need-th), or null while there are fewer (an award is kept when a
 *   country comes off the map, and viewers never see hidden photos' stamps).
 */
export function badgeStory(
  key,
  {
    places = [],
    stamps = [],
    oneShots = [],
    themes = [],
    photos = 0,
    photo = null,
    splitUk = false,
    continentByCode = new Map(),
    landmarkTotals = new Map(),
  } = {}
) {
  const badge = storyBadge(key);
  if (!badge) return null;
  const kind = STORY_KINDS[badge.measure];
  const need =
    badge.measure === 'collection'
      ? collectionTiers(landmarkTotals.get(badge.place) ?? 0).find((t) => t.tier === badge.tier)?.need
      : badgeNeed(badge, { splitUk, everyCountry: everyCountryOn(continentByCode, splitUk) });
  if (!need) return null;

  const all = kind === 'places' ? placeItems(badge, { places, splitUk, continentByCode }) : otherItems(badge, { stamps, oneShots, themes });
  const items = all.slice(0, need);
  const story = {
    key,
    group: badge.group,
    measure: badge.measure,
    kind,
    need,
    have: Math.min(kind === 'photos' ? photos : all.length, need),
    items,
    earnedWith: kind !== 'photos' && items.length >= need ? need - 1 : null,
  };
  if (kind === 'photos') story.photo = photos >= need ? photo : null;
  if (badge.continent) story.continent = badge.continent;
  if (badge.region) story.region = badge.region;
  if (badge.measure === 'place') story.code = badge.code;
  if (badge.measure === 'collection') Object.assign(story, { place: badge.place, tier: badge.tier });
  return story;
}
