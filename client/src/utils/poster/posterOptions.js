// What goes on a map's poster (drawMapPoster.js), from what the map page already has.
import { countsAsVisited } from '@/utils/map/visitStatus';
import { shownDesign } from '@/utils/map/mapDesign';
import { worldShare } from '@/utils/map/travelStatWords';

const plural = (n, one, many) => `${(n ?? 0).toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/** "8 countries · 2 continents · 3.5% of the world". */
export function posterSubtitle(stats) {
  if (!stats) return '';
  const parts = [plural(stats.countries, 'country', 'countries'), plural(stats.continents, 'continent', 'continents')];
  const share = worldShare(stats.countries, stats.countriesInWorld);
  if (stats.countries && share) parts.push(`${share} of the world`);
  return parts.join(' · ');
}

/** A safe file name from the map's name: "charlie-alex-s-travels". */
export const posterFileBase = (name) =>
  String(name || 'my-map')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'my-map';

/** A map's poster: its name, numbers, the places visited or lived in, its design's colours. */
export function mapPosterOptions(map) {
  return {
    title: map.name,
    subtitle: posterSubtitle(map.stats),
    highlight: (map.visits || []).filter((visit) => countsAsVisited(visit.status)).map((visit) => visit.countryCode),
    splitUk: Boolean(map.splitUk),
    colours: shownDesign(map.design)?.countries ?? null,
    fileBase: posterFileBase(map.name),
  };
}
