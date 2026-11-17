// Every country ticket's photos and moments, ready before it opens (17 Nov 2026, the user's
// wish: no spinners in a country's ticket; the map page loads everything up front). The map
// reply says where there's something: `photoCounts` and `videoCounts` (the owner's and
// editors'; viewers and share links don't get them, so for them the visited countries,
// where a photo marks a visit) and `momentCountsByCountry` (everyone's). Those lists are
// fetched into the panel cache a few at a time, behind the map's loading screen; every other
// place's list is kept empty at once, without asking. Either way the ticket opens with them
// and refreshes them quietly.
import { preloadPhotoPage, rememberEmptyPhotoPage } from '@/hooks/usePhotoPage';
import { preloadMomentPage, rememberEmptyMomentPage } from '@/hooks/useMomentPage';
import { SPECIAL_PLACES, countriesOnMap } from './countries';
import { countsAsVisited } from './visitStatus';

// Requests at a time (the loading screen waits for them all)
const AT_ONCE = 6;

const hasAny = (counts, code) => (counts?.[code] || 0) > 0;

/**
 * `map` is the map reply, `source` the lists' source ({ mapId } or { shareCode }), as the
 * country ticket (CountryPanel) asks for them. `stopped()` says the map page has gone or
 * moved to another map, and the rest aren't fetched. The promise settles once they're all in.
 */
export function preloadCountryLists(map, source, stopped = () => false) {
  const countsKnown = Boolean(map.photoCounts);
  const visited = new Set((map.visits || []).filter((v) => countsAsVisited(v.status)).map((v) => v.countryCode));
  const jobs = [];

  for (const { code } of [...countriesOnMap(Boolean(map.splitUk)), ...SPECIAL_PLACES]) {
    // The ticket's lists: CountryPanel's usePhotoPage and useMomentPage filters exactly
    const photos = { ...source, country: code, limit: 12 };
    const mayHavePhotos = countsKnown ? hasAny(map.photoCounts, code) || hasAny(map.videoCounts, code) : visited.has(code);
    if (mayHavePhotos) jobs.push(() => preloadPhotoPage(photos));
    else rememberEmptyPhotoPage(photos);

    const moments = { ...source, country: code };
    if (hasAny(map.momentCountsByCountry, code)) jobs.push(() => preloadMomentPage(moments));
    else rememberEmptyMomentPage(moments);
  }

  let next = 0;
  const worker = async () => {
    while (next < jobs.length && !stopped()) await jobs[next++]();
  };
  return Promise.all(Array.from({ length: AT_ONCE }, worker));
}
