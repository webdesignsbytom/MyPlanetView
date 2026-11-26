// Mock mode only: Vs mode's numbers (docs/API.md "Vs mode"), as the server's
// services/travel/vs.js counts them: one map's statistics as a viewer sees them, its World
// Heritage Sites stamped, its One Shots, badges and flights. The rules (medals, the table) are
// the client's copy of the server's, utils/vs/vsRules.js.
import { getDb } from './store';
import { landmarkById, mapStats, stampedLandmarkIds } from './views';

/** -> `{ values: { category: number }, badges: [key] }`, or null for a map that's gone */
export function vsNumbers(mapId) {
  const db = getDb();
  const map = db.maps.find((m) => m.id === mapId);
  if (!map) return null;
  const stats = mapStats(map, 'VIEWER');
  const ticked = (db.landmarkVisits || []).filter((v) => v.mapId === mapId).map((v) => v.landmarkId);
  const stamped = [...new Set([...stampedLandmarkIds(map, 'VIEWER'), ...ticked])];
  const badges = (db.badgeAwards || [])
    .filter((a) => a.mapId === mapId)
    .sort((a, b) => (a.earnedAt < b.earnedAt ? -1 : 1))
    .map((a) => a.badgeKey);
  return {
    values: {
      countries: stats.countries ?? 0,
      unCountries: stats.unCountries ?? 0,
      continents: stats.continents ?? 0,
      landmarks: stats.landmarks ?? 0,
      worldHeritage: stamped.filter((id) => landmarkById(id)?.isUnesco).length,
      oneShots: (db.oneShots || []).filter((t) => t.mapId === mapId).length,
      badges: badges.length,
      flights: (db.flights || []).filter((f) => f.mapId === mapId).length,
      daysAway: stats.daysAway ?? 0,
      distanceKm: stats.distanceKm ?? 0,
    },
    badges,
  };
}
