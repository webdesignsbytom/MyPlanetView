// Planned trips on the map (22 Nov 2026, the user's wish: "a different outline colour on the
// map to show it's a planned trip"): taken from the trips themselves, never a status set by
// hand, so the outline comes with a trip's first stop and goes when it's completed (its
// countries turn visited) or deleted. Pure.
import { countsAsVisited } from '@/utils/map/visitStatus';
import { placeOnMap } from '@/utils/map/ukNations';
import { regionParent } from '@/utils/map/regionPlaces';

// A trip still to come, or under way (its countries aren't marked visited until it's completed)
const UPCOMING = new Set(['PLANNED', 'ACTIVE']);

// Soonest first; a trip with no dates yet last
const bySoonest = (a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999') || a.title.localeCompare(b.title);

/**
 * The map's planned and under-way trips by the places their stops are in, as this map draws
 * them (`splitUk`: a group trip from another map may keep the UK's nations, or not):
 * code → trips, soonest first. Trips come from the map's list (`countryCodes`, the stops'
 * places), its own and the group trips added to it.
 */
export function plannedTripsByPlace(trips, splitUk = false) {
  const byPlace = new Map();
  for (const trip of trips.filter((t) => UPCOMING.has(t.status) && t.countryCodes?.length).sort(bySoonest)) {
    for (const code of new Set(trip.countryCodes.map((c) => placeOnMap(c, splitUk)))) {
      if (!byPlace.has(code)) byPlace.set(code, []);
      byPlace.get(code).push(trip);
    }
  }
  return byPlace;
}

/**
 * The places drawn with the planned outline: those with a planned trip, unless the map
 * already has them visited or lived in (their look never changes). It takes the place of
 * "want to go"'s outline.
 */
export const plannedOutlineCodes = (byPlace, visitsByCode) =>
  new Set([...byPlace.keys()].filter((code) => !countsAsVisited(visitsByCode[code])));

/** The planned trips a ticket lists: its own place's, a region's its country's. */
export const plannedTripsFor = (byPlace, code) => byPlace.get(regionParent(code) ?? code) ?? [];

/**
 * The first stop of a trip planned from a place's ticket: the place itself, a region as its
 * country with the region's name (Bali: Indonesia, "Bali"), as the stops keep them.
 */
export const firstStopFor = (code, name) => {
  const parent = regionParent(code);
  return parent ? { countryCode: parent, placeName: name } : { countryCode: code };
};
