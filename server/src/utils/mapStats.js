// A map's stats, counted from its data (never stored). Pure: the controller loads the rows.
import { COUNTED_VISIT_STATUSES } from './travelValidation.js';
import { isSpecialPlace } from './specialPlaces.js';

/**
 * @param {object} input
 * @param {{ countryCode: string, status: string }[]} input.visits
 * @param {Map<string, string>} input.continentByCode country code -> continent
 * @param {number} input.photoCount photos the caller may see
 * @param {number} input.landmarkCount distinct confirmed landmarks on those photos
 * @param {number} input.tripCount
 * @param {{ id: string, name: string }[]} input.travellers
 * @param {{ travellerIds: string[], countryCodes: string[] }[]} input.completedTrips
 */
export function buildMapStats({
  visits = [],
  continentByCode = new Map(),
  photoCount = 0,
  landmarkCount = 0,
  tripCount = 0,
  travellers = [],
  completedTrips = [],
}) {
  // Countries and special places (Antarctica, the poles) are counted apart; both count
  // towards the continents (Antarctica and the South Pole give the seventh)
  const counted = visits.filter((v) => COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => v.countryCode);
  const visited = new Set(counted.filter((code) => !isSpecialPlace(code)));
  const specialPlaces = new Set(counted.filter(isSpecialPlace));
  const continents = new Set(counted.map((code) => continentByCode.get(code)).filter(Boolean));

  // Per person: the countries of the completed trips they went on
  const byTraveller = travellers.map((traveller) => {
    const countries = new Set();
    for (const trip of completedTrips) {
      if (!trip.travellerIds.includes(traveller.id)) continue;
      trip.countryCodes.filter((code) => !isSpecialPlace(code)).forEach((code) => countries.add(code));
    }
    return { travellerId: traveller.id, name: traveller.name, countries: countries.size };
  });

  return {
    countries: visited.size,
    specialPlaces: specialPlaces.size,
    continents: continents.size,
    photos: photoCount,
    landmarks: landmarkCount,
    trips: tripCount,
    byTraveller,
  };
}
