// Every country ticket's photos and moments, ready before it opens (17 Nov 2026, the user's
// wish: no spinners in a country's ticket; the map page loads everything up front). The map
// reply says where there's something: `photoCounts` and `videoCounts` (the owner's and
// editors') and `momentCountsByCountry` (everyone's). Those lists are fetched into the panel
// cache a few at a time, behind the map's loading screen; every other place's list is kept
// empty at once, without asking. Either way the ticket opens with them and refreshes them
// quietly.
//
// Viewers and share links get no photo counts. For them a visited country may have photos
// (a photo marks a visit), but fetching every one up front cost a request per visited
// country on each load, which a share link's per-visitor limit (docs/API.md, "Rate
// limits") couldn't afford: those lists load when the pointer rests on the country or its
// ticket opens (MapExperience's hoverCountry).
import { preloadPhotoPage, rememberEmptyPhotoPage } from '@/hooks/usePhotoPage';
import { preloadMomentPage, rememberEmptyMomentPage } from '@/hooks/useMomentPage';
import { SPECIAL_PLACES, countriesOnMap } from './countries';
import { countsAsVisited } from './visitStatus';

// Requests at a time (the loading screen waits for them all)
const AT_ONCE = 6;

const hasAny = (counts, code) => (counts?.[code] || 0) > 0;

const visitedCodes = (map) => new Set((map.visits || []).filter((v) => countsAsVisited(v.status)).map((v) => v.countryCode));

/** The ticket's lists: CountryPanel's usePhotoPage and useMomentPage filters exactly. */
export const countryPhotoFilters = (source, code) => ({ ...source, country: code, limit: 12 });
export const countryMomentFilters = (source, code) => ({ ...source, country: code });

/**
 * What the map reply says about a country's lists: `photos` and `moments` are 'some',
 * 'none', or (photos only, with no counts: viewers and share links) 'maybe' for a visited
 * country.
 */
export function countryListsOf(map, code, visited = visitedCodes(map)) {
  let photos;
  if (map.photoCounts) photos = hasAny(map.photoCounts, code) || hasAny(map.videoCounts, code) ? 'some' : 'none';
  else photos = visited.has(code) ? 'maybe' : 'none';
  return { photos, moments: hasAny(map.momentCountsByCountry, code) ? 'some' : 'none' };
}

/**
 * `map` is the map reply, `source` the lists' source ({ mapId } or { shareCode }), as the
 * country ticket (CountryPanel) asks for them. `stopped()` says the map page has gone or
 * moved to another map, and the rest aren't fetched. The promise settles once they're all in.
 */
export function preloadCountryLists(map, source, stopped = () => false) {
  const visited = visitedCodes(map);
  const jobs = [];

  for (const { code } of [...countriesOnMap(Boolean(map.splitUk)), ...SPECIAL_PLACES]) {
    const lists = countryListsOf(map, code, visited);
    const photos = countryPhotoFilters(source, code);
    if (lists.photos === 'some') jobs.push(() => preloadPhotoPage(photos));
    else if (lists.photos === 'none') rememberEmptyPhotoPage(photos);

    const moments = countryMomentFilters(source, code);
    if (lists.moments === 'some') jobs.push(() => preloadMomentPage(moments));
    else rememberEmptyMomentPage(moments);
  }

  let next = 0;
  const worker = async () => {
    while (next < jobs.length && !stopped()) await jobs[next++]();
  };
  return Promise.all(Array.from({ length: AT_ONCE }, worker));
}
