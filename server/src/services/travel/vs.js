// Vs mode (docs/API.md "Vs mode"): one map's numbers, as everyone in a comparison sees them:
// counted as a viewer of the map would see it (never a hidden photo), the way its own
// statistics count (controllers/helpers/views.js loadStatsCounts, statsFrom), and its badges'
// names. Never the map itself, a photo or a place.
import { loadStatsCounts, statsFrom } from '../../controllers/helpers/views.js';
import { findMapStatsRow, findMapTravellers, findMapVisitsForStats } from '../../domain/maps.js';
import { countWorldHeritage, findVsExtras } from '../../domain/vs.js';

/** -> `{ values: { countries, unCountries, continents, landmarks, worldHeritage, oneShots, badges, flights, daysAway, distanceKm }, badges: [key] }` */
export async function vsNumbers(mapId) {
  const role = 'VIEWER';
  const [visits, travellers, counts, row, extras] = await Promise.all([
    findMapVisitsForStats(mapId),
    findMapTravellers(mapId),
    loadStatsCounts(mapId, role),
    findMapStatsRow(mapId),
    findVsExtras(mapId),
  ]);
  const stats = statsFrom({ visits, travellers, splitUk: Boolean(row?.splitUk), homeCountryCode: row?.homeCountryCode, ownerId: row?.ownerId }, counts, { role });
  // The landmarks stamped (by a photo or a "been here" tick), each once
  const stamped = [...new Set([...counts.stampedLandmarkIds, ...counts.tickedLandmarkIds])];
  return {
    values: {
      countries: stats.countries ?? 0,
      unCountries: stats.unCountries ?? 0,
      continents: stats.continents ?? 0,
      landmarks: stats.landmarks ?? 0,
      worldHeritage: await countWorldHeritage(stamped),
      oneShots: extras.oneShots,
      badges: extras.badgeKeys.length,
      flights: extras.flights,
      daysAway: stats.daysAway ?? 0,
      distanceKm: stats.distanceKm ?? 0,
    },
    badges: extras.badgeKeys,
  };
}
