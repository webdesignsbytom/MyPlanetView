// What goes on a share card (drawShareCard.js): a map's, from what the map page already has.
import { countsAsVisited } from '@/utils/map/visitStatus';

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
