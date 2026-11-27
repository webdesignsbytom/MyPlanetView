// Mock mode only: what earned a badge (docs/API.md "Badges and goals"; 27 Nov 2026), as the
// server's utils/badgeStories.js and services/travel/badgeStories.js tell it, rule for rule
// (tests/unit/dev/mock/badgeStories.test.js compares the two): the things a badge counts, in
// the order they happened, up to as many as it needs, and the one that earned it.
import { COUNTRIES } from '@/utils/map/countries';
import { INHABITED_CONTINENTS, regionCodesOnMap } from '@/utils/constants/regions';
import { isSpecialPlace, withParentPlaces } from '@/utils/map/specialPlaces';
import { countedCountryCodes, landmarkPlace } from '@/utils/map/ukNations';
import { BIG_FIVE, ONE_SHOT_BY_KEY } from '@/utils/oneShots/oneShotItems';
import { earliestOf, passportPageOrder } from '@/utils/passport/passportOrder';
import { BADGES, collectionTiers, landmarkTotals, parseCollectionKey } from './achievements';
import { mapStamps } from './passport';
import { getDb } from './store';
import { photoThumbUrl } from './views';

const CONTINENT_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
const COUNTED = ['VISITED', 'LIVED'];
const TRAVELLER_BADGE_GROUPS = ['countries', 'continents', 'special', 'regions'];
const BADGE_BY_KEY = new Map(BADGES.map((badge) => [badge.key, badge]));
const ONE_SHOT_LIST = { oneShotsWildlife: 'WILDLIFE', oneShotsWonders: 'WONDERS', oneShotsJourneys: 'JOURNEYS' };

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

const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : null);
const timeOf = (value) => new Date(value).getTime();
const tripDay = (trip) => trip.endDate ?? trip.startDate ?? null;

// The server's everyCountryOn and badgeNeed (utils/badges.js)
const everyCountryOn = (continentByCode, splitUk) =>
  new Set(countedCountryCodes([...continentByCode.keys()].filter((code) => !isSpecialPlace(code)), splitUk));
function badgeNeed(badge, { splitUk, everyCountry }) {
  if (badge.measure === 'region') return regionCodesOnMap(badge.region, splitUk).length;
  if (badge.measure === 'allCountries') return Math.max(everyCountry.size, 1);
  return badge.need;
}

/** The badge a key names (a country collection's tier too), or null; with `traveller`, travel badges only. */
export function storyBadge(key, { traveller = false } = {}) {
  const collection = parseCollectionKey(key);
  const badge = BADGE_BY_KEY.get(key) ?? (collection ? { key, group: 'collections', measure: 'collection', ...collection } : null);
  if (!badge) return null;
  return traveller && !TRAVELLER_BADGE_GROUPS.includes(badge.group) ? null : badge;
}

/** The map's places visited or lived in, in the passport's order (the server's mapPlaces). */
export function mapPlaces({ visits = [], firstPhotoAt = new Map() }) {
  const counted = new Map(visits.filter((v) => COUNTED.includes(v.status)).map((v) => [v.countryCode, v]));
  const enteredOn = (code) => earliestOf(firstPhotoAt.get(code), counted.get(code)?.firstVisitedOn);
  return passportPageOrder([...counted.keys()], { enteredOn, markedAt: (code) => counted.get(code)?.createdAt ?? null }).map((code) => ({
    code,
    on: dateOnly(enteredOn(code)),
  }));
}

/** One traveller's places from their completed trips (the server's travellerPlaces). */
export function travellerPlaces(trips, travellerId) {
  const own = trips
    .filter((trip) => trip.travellerIds.includes(travellerId))
    .sort((a, b) => {
      const [x, y] = [tripDay(a), tripDay(b)];
      if (x && y) return x < y ? -1 : x > y ? 1 : 0;
      return x ? -1 : y ? 1 : 0;
    });
  const seen = new Set();
  const places = [];
  for (const trip of own) {
    for (const code of withParentPlaces(trip.countryCodes)) {
      if (seen.has(code)) continue;
      seen.add(code);
      places.push({ code, on: tripDay(trip), trip: { id: trip.id, title: trip.title } });
    }
  }
  return places;
}

function placeItems(badge, { places, splitUk, continentByCode }) {
  const countries = new Set(countedCountryCodes(places.map((p) => p.code).filter((code) => !isSpecialPlace(code)), splitUk));
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

/** A badge's story from the facts given (the server's badgeStory), or null. */
export function badgeStory(
  key,
  { places = [], stamps = [], oneShots = [], themes = [], photos = 0, photo = null, splitUk = false, continentByCode = new Map(), landmarkTotals: totals = new Map() } = {},
) {
  const badge = storyBadge(key);
  if (!badge) return null;
  const kind = STORY_KINDS[badge.measure];
  const need =
    badge.measure === 'collection'
      ? collectionTiers(totals.get(badge.place) ?? 0).find((t) => t.tier === badge.tier)?.need
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

// The facts, from the store, as the caller may see the map (the server's service)

const shotAt = (photo) => photo.shotAt || photo.takenAt || photo.createdAt;

// Each stamp in order, and the photo each was made with (the one that earned it shows it)
function storeStamps(mapId, splitUk, includeHidden) {
  return mapStamps(mapId, { includeHidden })
    .map((s) => ({ ...s, at: s.photo ? shotAt(s.photo) : s.tickedAt }))
    .sort((a, b) => timeOf(a.at) - timeOf(b.at) || a.landmark.name.localeCompare(b.landmark.name))
    .map((s) => ({
      photo: s.photo,
      landmarkId: s.landmark.id,
      name: s.landmark.name,
      code: landmarkPlace(s.landmark, splitUk),
      isUnesco: Boolean(s.landmark.isUnesco),
      on: dateOnly(s.at),
      ticked: !s.photo,
    }));
}

function storeOneShots(mapId) {
  return (getDb().oneShots || [])
    .filter((t) => t.mapId === mapId)
    .sort((a, b) => timeOf(a.seenOn ?? a.createdAt) - timeOf(b.seenOn ?? b.createdAt) || timeOf(a.createdAt) - timeOf(b.createdAt))
    .map((t) => ({ itemKey: t.itemKey, code: t.countryCode ?? null, on: dateOnly(t.seenOn), datePrecision: t.datePrecision ?? null }));
}

function storeThemes(mapId, shown) {
  const db = getDb();
  const first = new Map();
  for (const entry of db.themeEntries || []) {
    if (entry.mapId !== mapId || !shown.has(entry.photoId)) continue;
    if (!first.has(entry.themeId) || timeOf(entry.enteredAt) < timeOf(first.get(entry.themeId))) first.set(entry.themeId, entry.enteredAt);
  }
  const themes = new Map((db.themes || []).map((t) => [t.id, t]));
  return [...first.entries()]
    .filter(([themeId]) => themes.has(themeId))
    .map(([themeId, at]) => ({ title: themes.get(themeId).title, month: `${themes.get(themeId).month}-01`.slice(0, 10), on: dateOnly(at), at }))
    .sort((a, b) => timeOf(a.at) - timeOf(b.at) || a.month.localeCompare(b.month))
    .map(({ title, month, on }) => ({ title, month, on }));
}

/**
 * A badge's story on a map (the server's mapBadgeStory): `{ story }`, `{ badgeNotFound }` or
 * `{ travellerNotFound }`.
 */
export function mapBadgeStory(mapId, key, { includeHidden, travellerId = null }) {
  const db = getDb();
  const badge = storyBadge(key, { traveller: Boolean(travellerId) });
  if (!badge) return { badgeNotFound: true };
  const map = db.maps.find((m) => m.id === mapId);
  const splitUk = Boolean(map?.splitUk);

  if (travellerId) {
    if (!db.travellers.some((t) => t.mapId === mapId && t.id === travellerId)) return { travellerNotFound: true };
    const trips = db.trips
      .filter((trip) => trip.mapId === mapId && trip.status === 'COMPLETED')
      .map((trip) => ({
        id: trip.id,
        title: trip.title,
        travellerIds: trip.travellerIds || [],
        countryCodes: db.stops
          .filter((stop) => stop.tripId === trip.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((stop) => stop.countryCode),
        startDate: trip.startDate ?? null,
        endDate: trip.endDate ?? null,
      }));
    const story = badgeStory(key, { places: travellerPlaces(trips, travellerId), continentByCode: CONTINENT_BY_CODE, splitUk });
    return story ? { story } : { badgeNotFound: true };
  }

  const kind = STORY_KINDS[badge.measure];
  const photos = db.photos.filter((p) => p.mapId === mapId && (includeHidden || !p.hidden));
  const firstPhotoAt = new Map();
  for (const photo of photos) {
    if (!photo.countryCode) continue;
    const at = shotAt(photo);
    if (!firstPhotoAt.has(photo.countryCode) || timeOf(at) < timeOf(firstPhotoAt.get(photo.countryCode))) firstPhotoAt.set(photo.countryCode, at);
  }
  let photo = null;
  if (kind === 'photos' && photos.length >= badge.need) {
    const nth = [...photos].sort((a, b) => timeOf(a.createdAt) - timeOf(b.createdAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[badge.need - 1];
    photo = {
      id: nth.id,
      video: nth.kind === 'VIDEO',
      code: nth.countryCode ?? null,
      addedOn: dateOnly(nth.createdAt),
      takenOn: dateOnly(nth.takenAt),
      thumbUrl: nth.kind === 'VIDEO' ? null : photoThumbUrl(nth) || null,
    };
  }
  const stamps = kind === 'stamps' ? storeStamps(mapId, splitUk, includeHidden) : [];
  const story = badgeStory(key, {
    places: kind === 'places' ? mapPlaces({ visits: db.visits.filter((v) => v.mapId === mapId), firstPhotoAt }) : [],
    // As the story's items: the photo stays out of them
    stamps: stamps.map((stamp) => {
      const item = { ...stamp };
      delete item.photo;
      return item;
    }),
    oneShots: kind === 'oneShots' ? storeOneShots(mapId) : [],
    themes: kind === 'themes' ? storeThemes(mapId, new Set(photos.map((p) => p.id))) : [],
    photos: photos.length,
    photo,
    splitUk,
    continentByCode: CONTINENT_BY_CODE,
    landmarkTotals: badge.measure === 'collection' ? landmarkTotals(splitUk) : new Map(),
  });
  if (!story) return { badgeNotFound: true };
  // The stamp that earned it shows its photo, as in the passport (a tick has none)
  const earned = kind === 'stamps' && story.earnedWith !== null ? story.items[story.earnedWith] : null;
  if (earned) {
    const made = stamps.find((s) => s.landmarkId === earned.landmarkId)?.photo;
    earned.thumbUrl = made ? photoThumbUrl(made) || null : null;
  }
  return { story };
}
