// A map's stats, counted from its data (never stored). Pure: the controller loads the rows.
import { COUNTED_VISIT_STATUSES } from './travelValidation.js';
import { isSpecialPlace } from './specialPlaces.js';
import { countedCountryCodes } from './ukNations.js';
import { isRegion } from './regionPlaces.js';
import { daysAway, lifeAwayShare, travelExtras } from './travelStats.js';
import { unMembersVisited } from './unMembers.js';

/**
 * @param {object} input
 * @param {{ countryCode: string, status: string }[]} input.visits
 * @param {Map<string, string>} input.continentByCode country code -> continent
 * @param {number} input.photoCount photos the caller may see
 * @param {number} input.landmarkCount distinct confirmed landmarks on those photos
 * @param {number} input.tripCount
 * @param {{ id: string, name: string }[]} input.travellers
 * @param {{ id, title, travellerIds: string[], countryCodes: string[], startDate, endDate, stops: object[] }[]} input.completedTrips
 * @param {boolean} input.splitUk the map shows the UK as its four nations: they count one
 *   each, and the UK only while none is visited (utils/ukNations.js countedCountryCodes)
 * @param {Map<string, { latitude: number, longitude: number }>} input.positions each place's
 *   pin, for the distances (utils/travelStats.js)
 * @param {string|null} input.homeCountryCode the map's home (travelStats.js homeOf)
 * @param {{ whole: number, splitUk: number }} input.worldTotals how many countries the world has
 * @param {boolean} input.showBirthDates the caller may see the travellers' dates of birth (the
 *   map's editors): each traveller's `lifeAwayShare` comes too
 * @param {Date} input.today for the share of a life away
 */
export function buildMapStats({
  visits = [],
  continentByCode = new Map(),
  photoCount = 0,
  landmarkCount = 0,
  tripCount = 0,
  travellers = [],
  completedTrips = [],
  splitUk = false,
  positions = new Map(),
  homeCountryCode = null,
  worldTotals = null,
  showBirthDates = false,
  today = new Date(),
}) {
  // Countries, special places (Antarctica, the poles) and regions (Bali, Tasmania) are
  // counted apart; countries and special places count towards the continents (Antarctica
  // and the South Pole give the seventh), regions don't (their country does)
  const counted = visits.filter((v) => COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => v.countryCode);
  const visited = new Set(countedCountryCodes(counted.filter((code) => !isSpecialPlace(code)), splitUk));
  const specialPlaces = new Set(counted.filter(isSpecialPlace));
  const regions = new Set(counted.filter(isRegion));
  const continents = new Set(counted.filter((code) => !isRegion(code)).map((code) => continentByCode.get(code)).filter(Boolean));

  // Per person: the countries of the completed trips they went on, and the days away on them
  // (23 Nov 2026, the user's wish); for editors, the share of their life that is (null without
  // a date of birth): never for viewers or share links, as it gives away an age
  const byTraveller = travellers.map((traveller) => {
    const theirs = completedTrips.filter((trip) => trip.travellerIds.includes(traveller.id));
    const codes = theirs.flatMap((trip) => trip.countryCodes.filter((code) => !isSpecialPlace(code)));
    const days = daysAway(theirs);
    return {
      travellerId: traveller.id,
      name: traveller.name,
      countries: countedCountryCodes(codes, splitUk).length,
      daysAway: days,
      ...(showBirthDates ? { lifeAwayShare: lifeAwayShare(days, traveller.birthDate ?? null, today) } : {}),
    };
  });

  return {
    countries: visited.size,
    specialPlaces: specialPlaces.size,
    regions: regions.size,
    continents: continents.size,
    photos: photoCount,
    landmarks: landmarkCount,
    trips: tripCount,
    byTraveller,
    // How much of the world, the days away, the distance and the furthest place (21 Nov 2026)
    countriesInWorld: worldTotals ? (splitUk ? worldTotals.splitUk : worldTotals.whole) : null,
    // Collector's counts (24 Nov 2026): the UN's 193 member states been to (utils/unMembers.js)
    unCountries: unMembersVisited(counted).length,
    ...travelExtras({ completedTrips, visitedCodes: counted, positions, homeCountryCode }),
  };
}
