// What goes on a map's poster (drawMapPoster.js), from what the map page already has.
import { countsAsVisited } from '@/utils/map/visitStatus';
import { designFor, shownDesign } from '@/utils/map/mapDesign';
import { MAP_STYLE_IDS } from '@/utils/map/mapStyles';
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

/**
 * A map's poster: its name, numbers, the places visited or lived in, the look it starts in
 * (`look`: the map style it's shown in, `styleId`; 27 Nov 2026), and each look's colours
 * (`coloursByLook`): a map style's look the map's design for that style, as the map shows it
 * in that style, and "Old paper" the colours of `design` (the design the map is shown in, or
 * null). `colours` is the shown design's too.
 */
export function mapPosterOptions(map, design = null, styleId = null) {
  const colours = design?.countries ?? null;
  return {
    title: map.name,
    subtitle: posterSubtitle(map.stats),
    highlight: (map.visits || []).filter((visit) => countsAsVisited(visit.status)).map((visit) => visit.countryCode),
    splitUk: Boolean(map.splitUk),
    colours,
    look: MAP_STYLE_IDS.includes(styleId) ? styleId : MAP_STYLE_IDS[0],
    coloursByLook: {
      ...Object.fromEntries(MAP_STYLE_IDS.map((id) => [id, shownDesign(designFor(map, id))?.countries ?? null])),
      paper: colours,
    },
    fileBase: posterFileBase(map.name),
  };
}

/** The colours a poster in `look` wears: that look's (mapPosterOptions), else the shown design's. */
export const posterColoursFor = (poster, look) => (poster.coloursByLook && look in poster.coloursByLook ? poster.coloursByLook[look] : (poster.colours ?? null));
