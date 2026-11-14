// A map's stats, counted from its data (never stored). Pure: the controller loads the rows.
import { COUNTED_VISIT_STATUSES } from './travelValidation.js';

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
  const visited = new Set(
    visits.filter((v) => COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => v.countryCode)
  );
  const continents = new Set([...visited].map((code) => continentByCode.get(code)).filter(Boolean));

  // Per person: the countries of the completed trips they went on
  const byTraveller = travellers.map((traveller) => {
    const countries = new Set();
    for (const trip of completedTrips) {
      if (trip.travellerIds.includes(traveller.id)) trip.countryCodes.forEach((code) => countries.add(code));
    }
    return { travellerId: traveller.id, name: traveller.name, countries: countries.size };
  });

  return {
    countries: visited.size,
    continents: continents.size,
    photos: photoCount,
    landmarks: landmarkCount,
    trips: tripCount,
    byTraveller,
  };
}
