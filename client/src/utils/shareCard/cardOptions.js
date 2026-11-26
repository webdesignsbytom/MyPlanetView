// What goes on a share card (drawShareCard.js): a map's, from what the map page already has.
import { countsAsVisited } from '@/utils/map/visitStatus';
import { COLLECTION_TIER_LABELS, collectionPlaces, parseCollectionKey } from '@/utils/achievements/collections';
import { badgeWords } from '@/utils/achievements/badges';
import { badgeIcon } from '@/utils/achievements/badgeIcons';
import { goalName, regionCountryCodes, regionName } from '@/utils/achievements/goals';
import { oneShotCounts } from '@/utils/oneShots/oneShotRules';
import { formatDay } from '@/utils/functions/dates';
import { iconShape } from './iconShape';
import { medalsWords, placeWords } from '@/utils/vs/vsWords';

const word = (n, one, many) => (n === 1 ? one : many);

/** Up to three big numbers: countries, continents, then landmarks stamped (or photos, or trips). */
export function mapCardStats(stats) {
  if (!stats) return [];
  const out = [
    { value: stats.countries ?? 0, label: word(stats.countries, 'country', 'countries') },
    { value: stats.continents ?? 0, label: word(stats.continents, 'continent', 'continents') },
  ];
  if (stats.landmarks) out.push({ value: stats.landmarks, label: word(stats.landmarks, 'landmark', 'landmarks') });
  else if (stats.photos) out.push({ value: stats.photos, label: word(stats.photos, 'photo', 'photos') });
  else if (stats.trips) out.push({ value: stats.trips, label: word(stats.trips, 'trip', 'trips') });
  return out;
}

/**
 * The card of a whole map: the places visited or lived in, coloured in (in `design`'s colours:
 * the design the map is shown in, or null).
 */
export function mapCardOptions(map, design = null) {
  return {
    kicker: 'My travel map',
    title: map.name,
    highlight: (map.visits || []).filter((visit) => countsAsVisited(visit.status)).map((visit) => visit.countryCode),
    stats: mapCardStats(map.stats),
    splitUk: Boolean(map.splitUk),
    colours: design?.countries ?? null,
    fileName: 'my-planet-view-map.png',
    shareText: `My travel map: ${map.stats?.countries ?? 0} ${word(map.stats?.countries, 'country', 'countries')} so far.`,
  };
}

/** Days from a trip's first to its last ("YYYY-MM-DD"), both counted, or null without both. */
export function tripDayCount(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const days = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1;
  return days >= 1 ? days : null;
}

/**
 * The card of one trip (the "Welcome home" tag, 23 Nov 2026, utils/trips/tripHome.js): its
 * countries coloured in (the map's own trips list carries them), its title, and how many
 * countries, days and photos. `map` gives the UK's split, `design` the shown design's colours.
 */
export function tripCardOptions(trip, map, design = null) {
  const codes = trip.countryCodes || [];
  const days = tripDayCount(trip.startDate, trip.endDate);
  const stats = [];
  if (codes.length) stats.push({ value: codes.length, label: word(codes.length, 'country', 'countries') });
  if (days) stats.push({ value: days, label: word(days, 'day', 'days') });
  if (trip.photoCount) stats.push({ value: trip.photoCount, label: word(trip.photoCount, 'photo', 'photos') });
  const counted = [
    codes.length > 1 ? `${codes.length} countries` : '',
    days ? `${days} ${word(days, 'day', 'days')}` : '',
  ].filter(Boolean);
  return {
    kicker: 'My trip',
    title: trip.title,
    highlight: codes,
    stats,
    splitUk: Boolean(map?.splitUk),
    colours: design?.countries ?? null,
    // Close up (24 Nov 2026, the user's wish): a one-country trip on that country's own map
    // with its regions, neighbours on the world cropped round them (drawShareCard's `mapView`)
    mapView: 'fit',
    fileName: 'my-planet-view-trip.png',
    shareText: counted.length ? `Just back from ${trip.title}: ${counted.join(' in ')}.` : `Just back from ${trip.title}.`,
    dialogTitle: 'Share a picture of your trip',
  };
}

/**
 * The card of a country collection's medal (24 Nov 2026, the user's wish: "gives us more
 * chances to have them share it"): the medal drawn big where a map card's map goes (a small
 * country is lost on a world map), the place's name, and how many of its landmarks are
 * stamped. `collection` is a collectionPlaces entry (utils/achievements/collections.js).
 */
export function collectionCardOptions(collection) {
  const medal = COLLECTION_TIER_LABELS[collection.best] || '';
  return {
    kicker: `${medal} medal`,
    title: collection.name,
    medal: collection.best,
    highlight: [],
    stats: [
      { value: collection.have, label: `${word(collection.have, 'landmark', 'landmarks')} stamped` },
      { value: collection.total, label: `${word(collection.total, 'landmark', 'landmarks')} in ${collection.name}` },
    ],
    fileName: `my-planet-view-${collection.place.toLowerCase()}-${collection.best}.png`,
    shareText:
      collection.best !== 'gold'
        ? `${medal} for ${collection.name}: ${collection.have} of its ${collection.total} landmarks stamped in my travel passport.`
        : collection.total === 1
          ? `Gold for ${collection.name}: its landmark, stamped in my travel passport.`
          : `Every one of ${collection.name}’s ${collection.total} landmarks, stamped in my travel passport.`,
    dialogTitle: 'Share your medal',
  };
}

/**
 * The card of Life's One Shots (24 Nov 2026): the places where they were seen or done coloured
 * in, and how many of each list are ticked. `ticks` are useOneShots' `oneShots`.
 */
export function oneShotsCardOptions(map, ticks = []) {
  const counts = oneShotCounts(ticks.map((tick) => tick.itemKey));
  return {
    kicker: 'Life’s One Shots',
    title: map.name,
    highlight: [...new Set(ticks.map((tick) => tick.countryCode).filter(Boolean))],
    stats: [
      { value: counts.WILDLIFE, label: word(counts.WILDLIFE, 'animal', 'animals') },
      { value: counts.WONDERS, label: word(counts.WONDERS, 'wonder', 'wonders') },
      { value: counts.JOURNEYS, label: word(counts.JOURNEYS, 'journey', 'journeys') },
    ],
    splitUk: Boolean(map.splitUk),
    colours: null,
    fileName: 'my-planet-view-one-shots.png',
    shareText: `Life’s One Shots so far: ${counts.WILDLIFE} ${word(counts.WILDLIFE, 'animal', 'animals')}, ${counts.WONDERS} ${word(counts.WONDERS, 'wonder', 'wonders')} and ${counts.JOURNEYS} ${word(counts.JOURNEYS, 'journey', 'journeys')}.`,
    dialogTitle: 'Share Life’s One Shots',
  };
}

/** A badge's first sentence: what it's for, without the small print ("Antarctica and the poles count apart."). */
const firstSentence = (text) => /^.*?[.!?](?=\s|$)/.exec(String(text || '').trim())?.[0] ?? String(text || '').trim();

/**
 * The card of a badge just earned (25 Nov 2026, the user's wish: share it from the award
 * pop-up): its sticker drawn big where a map card's map goes, its name, what it's for, the
 * day it was earned and the map's numbers. `badge` is the badges reply's (`key`, `group`,
 * `earnedAt`), or `{ key }` alone.
 */
export function badgeCardOptions(badge, map = null) {
  const words = badgeWords(badge.key);
  const countries = map?.stats?.countries ?? 0;
  return {
    kicker: badge.earnedAt ? `Badge earned ${formatDay(badge.earnedAt)}` : 'New badge',
    title: words.name,
    badge: { icon: iconShape(badgeIcon(badge)), short: words.short || '' },
    note: firstSentence(words.description),
    highlight: [],
    stats: mapCardStats(map?.stats),
    fileName: `my-planet-view-badge-${String(badge.key).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
    shareText: `New badge on my travel map: ${words.name}! ${countries} ${word(countries, 'country', 'countries')} so far.`,
    dialogTitle: 'Share your badge',
  };
}

/**
 * The card of a goal just reached (25 Nov 2026): its places coloured in (a list's places, a
 * region's countries been to, else every place visited or lived in), close up for a list or a
 * region, its name, the day and its numbers. `map` gives the visits, numbers and the UK's
 * split, `design` the shown design's colours.
 */
export function goalCardOptions(goal, map = null, design = null) {
  const { have = 0, need = 0 } = goal.progress || {};
  const splitUk = Boolean(map?.splitUk);
  const visited = (map?.visits || []).filter((visit) => countsAsVisited(visit.status)).map((visit) => visit.countryCode);
  const [countries, continents] = mapCardStats(map?.stats);
  const counts = [countries, continents].filter(Boolean);
  let highlight = visited;
  let stats = mapCardStats(map?.stats);
  if (goal.kind === 'COUNTRY_LIST') {
    highlight = goal.countryCodes || [];
    stats = [{ value: need, label: word(need, 'place on the list', 'places on the list') }, ...counts];
  } else if (goal.kind === 'REGION') {
    const been = new Set(visited);
    highlight = goal.progress?.done || regionCountryCodes(goal.region, splitUk).filter((code) => been.has(code));
    stats = [{ value: need, label: `${word(need, 'country', 'countries')} in ${regionName(goal.region).replace(/^The /, 'the ')}` }, ...counts];
  } else if (goal.kind === 'LANDMARK_COUNT') {
    stats = [{ value: have, label: word(have, 'landmark stamped', 'landmarks stamped') }, ...counts];
  }
  const name = goalName(goal);
  return {
    kicker: goal.achievedAt ? `Goal reached ${formatDay(goal.achievedAt)}` : 'Goal reached',
    title: name,
    highlight,
    stats,
    splitUk,
    colours: design?.countries ?? null,
    // A list's or a region's places close up; a count is the whole world's
    mapView: goal.kind === 'COUNTRY_LIST' || goal.kind === 'REGION' ? 'fit' : 'world',
    fileName: 'my-planet-view-goal.png',
    shareText: `Goal reached on my travel map: ${name}!`,
    dialogTitle: 'Share your goal',
  };
}

/**
 * The card of one item of the award pop-up's news (useAchievements: `{ type: 'badge', key }`
 * or `{ type: 'goal', goal }`): a goal's, a country collection's medal (from the place's
 * tiers in `badges`, the badges reply), else the badge's sticker.
 */
export function awardCardOptions(item, { badges = [], map = null, design = null } = {}) {
  if (item.type === 'goal') return goalCardOptions(item.goal, map, design);
  const collection = parseCollectionKey(item.key);
  if (collection) {
    const place = collectionPlaces(badges).find((entry) => entry.place === collection.place);
    if (place) return collectionCardOptions({ ...place, best: collection.tier });
  }
  return badgeCardOptions((badges || []).find((badge) => badge.key === item.key) || { key: item.key }, map);
}

/**
 * The card of your medals in a Vs mode comparison (26 Nov 2026): your best medal drawn big, the
 * comparison's title, how many golds, silvers and bronzes, and your place. `group` as the page has
 * it (the caller's row is `isYou`). Only offered once you have a medal.
 */
export function vsCardOptions(group) {
  const me = group.members.find((m) => m.isYou) || { gold: 0, silver: 0, bronze: 0, place: null };
  const counted = group.members.filter((m) => m.counting).length;
  const best = me.gold ? 'gold' : me.silver ? 'silver' : 'bronze';
  const ordinal = placeWords(me.place);
  return {
    kicker: 'Vs mode',
    title: group.title,
    medal: best,
    highlight: [],
    stats: [
      { value: me.gold, label: 'gold' },
      { value: me.silver, label: 'silver' },
      { value: me.bronze, label: 'bronze' },
    ],
    note: ordinal ? `${ordinal} of ${counted} in the medal table, comparing our travels.` : '',
    fileName: 'my-planet-view-vs.png',
    shareText: `${ordinal ? `${ordinal} place` : 'Medals'} in “${group.title}”: ${medalsWords(me)}. Compare your travels with mine on My Planet View.`,
    dialogTitle: 'Share your medals',
  };
}
