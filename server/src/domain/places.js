import { prisma } from '../prisma.js';

// Countries and landmarks (seeded reference data)

export const COUNTRY_SELECT = {
  code: true,
  name: true,
  slug: true,
  // COUNTRY, or SPECIAL for Antarctica and the poles (utils/specialPlaces.js)
  kind: true,
  continent: true,
  pinX: true,
  pinY: true,
};

export const LANDMARK_SELECT = {
  id: true,
  name: true,
  slug: true,
  countryCode: true,
  latitude: true,
  longitude: true,
  pinX: true,
  pinY: true,
  matchRadiusM: true,
  isUnesco: true,
  // The landmark's Wikidata item: the client finds its little 3D model by it (the
  // celebration screen; client/src/utils/map/landmarkModels.js `landmark`)
  wikidataId: true,
};

export const findAllCountries = () =>
  prisma.country.findMany({ select: COUNTRY_SELECT, orderBy: { name: 'asc' } });

export const findCountryByCode = (code) =>
  prisma.country.findUnique({ where: { code }, select: COUNTRY_SELECT });

export const findLandmarks = ({ countryCode } = {}) =>
  prisma.landmark.findMany({
    where: countryCode ? { countryCode } : undefined,
    select: LANDMARK_SELECT,
    orderBy: { name: 'asc' },
  });

// Every landmark's country and position: where each counts (the country collections'
// totals; a UK landmark's nation on a map that splits the UK)
export const findLandmarkPlaces = () => prisma.landmark.findMany({ select: { countryCode: true, latitude: true, longitude: true } });

export const findLandmarkById = (id) =>
  prisma.landmark.findUnique({ where: { id }, select: LANDMARK_SELECT });

// Candidates for GPS matching (exact distance is checked afterwards)
export const findLandmarksInBox = ({ minLat, maxLat, minLng, maxLng }) =>
  prisma.landmark.findMany({
    where: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
    },
    select: { id: true, latitude: true, longitude: true, matchRadiusM: true },
  });
