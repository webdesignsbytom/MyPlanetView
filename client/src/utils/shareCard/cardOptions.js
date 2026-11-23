// What goes on a share card (drawShareCard.js): a map's, from what the map page already has.
import { countsAsVisited } from '@/utils/map/visitStatus';
import { COLLECTION_TIER_LABELS } from '@/utils/achievements/collections';
import { oneShotCounts } from '@/utils/oneShots/oneShotRules';

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
