// A map's stats, counted from its data (never stored). Pure: the controller loads the rows.
import { COUNTED_VISIT_STATUSES } from './travelValidation.js';
import { isSpecialPlace } from './specialPlaces.js';
import { countedCountryCodes } from './ukNations.js';
import { isRegion } from './regionPlaces.js';

/**
 * @param {object} input
 * @param {{ countryCode: string, status: string }[]} input.visits
 * @param {Map<string, string>} input.continentByCode country code -> continent
 * @param {number} input.photoCount photos the caller may see
 * @param {number} input.landmarkCount distinct confirmed landmarks on those photos
 * @param {number} input.tripCount
 * @param {{ id: string, name: string }[]} input.travellers
 * @param {{ travellerIds: string[], countryCodes: string[] }[]} input.completedTrips
 * @param {boolean} input.splitUk the map shows the UK as its four nations: they count one
 *   each, and the UK only while none is visited (utils/ukNations.js countedCountryCodes)
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
}) {
  // Countries, special places (Antarctica, the poles) and regions (Bali, Tasmania) are
  // counted apart; countries and special places count towards the continents (Antarctica
  // and the South Pole give the seventh), regions don't (their country does)
  const counted = visits.filter((v) => COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => v.countryCode);
  const visited = new Set(countedCountryCodes(counted.filter((code) => !isSpecialPlace(code)), splitUk));
  const specialPlaces = new Set(counted.filter(isSpecialPlace));
  const regions = new Set(counted.filter(isRegion));
  const continents = new Set(counted.filter((code) => !isRegion(code)).map((code) => continentByCode.get(code)).filter(Boolean));

  // Per person: the countries of the completed trips they went on
  const byTraveller = travellers.map((traveller) => {
    const codes = completedTrips
      .filter((trip) => trip.travellerIds.includes(traveller.id))
      .flatMap((trip) => trip.countryCodes.filter((code) => !isSpecialPlace(code)));
    return { travellerId: traveller.id, name: traveller.name, countries: countedCountryCodes(codes, splitUk).length };
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
  };
}
