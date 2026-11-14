// Suggest landmarks for a photo from its GPS position.
import { isValidLatLng } from './projection.js';

const EARTH_RADIUS_M = 6371008.8;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

// The largest match radius any landmark may have (national parks, archipelagos)
export const MAX_MATCH_RADIUS_M = 60000;

/** Great-circle distance in metres. */
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * A latitude/longitude box around a point, for narrowing the database query
 * before the exact distance check. Longitude is left open near the poles.
 */
export function boundingBox(latitude, longitude, radiusM = MAX_MATCH_RADIUS_M) {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const cosLat = Math.cos(toRadians(latitude));
  const dLng = cosLat > 0.01 ? dLat / cosLat : 180;
  return {
    minLat: Math.max(-90, latitude - dLat),
    maxLat: Math.min(90, latitude + dLat),
    minLng: Math.max(-180, longitude - dLng),
    maxLng: Math.min(180, longitude + dLng),
  };
}

/**
 * Landmarks whose match radius contains the position, nearest first.
 * @param {{ latitude: number, longitude: number }} position
 * @param {{ id: string, latitude: number, longitude: number, matchRadiusM: number }[]} landmarks
 * @returns {{ landmarkId: string, distanceM: number }[]}
 */
export function matchLandmarks(position, landmarks) {
  const { latitude, longitude } = position || {};
  if (!isValidLatLng(latitude, longitude)) return [];
  return landmarks
    .map((landmark) => ({
      landmarkId: landmark.id,
      distanceM: Math.round(haversineMeters(latitude, longitude, landmark.latitude, landmark.longitude)),
      radius: landmark.matchRadiusM,
    }))
    .filter((match) => match.distanceM <= match.radius)
    .sort((a, b) => a.distanceM - b.distanceM)
    .map(({ landmarkId, distanceM }) => ({ landmarkId, distanceM }));
}
