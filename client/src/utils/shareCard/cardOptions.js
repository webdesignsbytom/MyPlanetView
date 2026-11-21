// What goes on a share card (drawShareCard.js): a map's, from what the map page already has.
import { countsAsVisited } from '@/utils/map/visitStatus';
import { shownDesign } from '@/utils/map/mapDesign';

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

/** The card of a whole map: the places visited or lived in, coloured in. */
export function mapCardOptions(map) {
  return {
    kicker: 'My travel map',
    title: map.name,
    highlight: (map.visits || []).filter((visit) => countsAsVisited(visit.status)).map((visit) => visit.countryCode),
    stats: mapCardStats(map.stats),
    splitUk: Boolean(map.splitUk),
    colours: shownDesign(map.design)?.countries ?? null,
    fileName: 'my-planet-view-map.png',
    shareText: `My travel map: ${map.stats?.countries ?? 0} ${word(map.stats?.countries, 'country', 'countries')} so far.`,
  };
}
