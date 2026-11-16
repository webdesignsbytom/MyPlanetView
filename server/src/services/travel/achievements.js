// What the passport, badges and goals count (docs/API.md, "Passport", "Badges and goals"):
// one read of a map's facts, then the pure rules in utils/badges.js and utils/goals.js.
import { COUNTED_VISIT_STATUSES } from '../../utils/travelValidation.js';
import { badgeProgress } from '../../utils/badges.js';
import { goalProgress } from '../../utils/goals.js';
import { countMapPhotos, findMapVisitsForStats } from '../../domain/maps.js';
import { findFirstPhotoByCountry, findLandmarksByIds, findStamps } from '../../domain/passport.js';
import { createBadgeAwards, findBadgeAwards, findGoals, markGoalsAchieved } from '../../domain/achievements.js';
import { continentsByCode } from '../../controllers/helpers/countries.js';

/** continent -> the codes on it (special places included; the rules leave them out). */
export async function countriesByContinent() {
  const byContinent = new Map();
  for (const [code, continent] of await continentsByCode()) {
    if (!continent) continue;
    if (!byContinent.has(continent)) byContinent.set(continent, []);
    byContinent.get(continent).push(code);
  }
  return byContinent;
}

/**
 * A map's facts, as the caller may see them (`includeHidden` for the owner and editors):
 * `{ visited, continentByCode, countriesByContinent, firstPhotoAt, stamps, photos }`.
 * `stamps` is `[{ landmarkId, countryCode, isUnesco, firstShotAt, photoId, photoCount, confirmedAt }]`.
 */
export async function loadMapFacts(mapId, { includeHidden }) {
  const [visits, firstPhotoAt, stampRows, photos, continentByCode, byContinent] = await Promise.all([
    findMapVisitsForStats(mapId),
    findFirstPhotoByCountry(mapId, { includeHidden }),
    findStamps(mapId, { includeHidden }),
    countMapPhotos(mapId, { includeHidden }),
    continentsByCode(),
    countriesByContinent(),
  ]);
  const landmarks = new Map((await findLandmarksByIds(stampRows.map((s) => s.landmarkId))).map((l) => [l.id, l]));
  const stamps = stampRows
    .filter((row) => landmarks.has(row.landmarkId))
    .map((row) => ({
      landmarkId: row.landmarkId,
      countryCode: landmarks.get(row.landmarkId).countryCode,
      isUnesco: landmarks.get(row.landmarkId).isUnesco,
      name: landmarks.get(row.landmarkId).name,
      firstShotAt: new Date(row.shotAt),
      photoId: row.photoId,
      photoCount: Number(row.photoCount),
      confirmedAt: row.confirmedAt ? new Date(row.confirmedAt) : null,
    }));
  return {
    visits,
    visited: new Set(visits.filter((v) => COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => v.countryCode)),
    continentByCode,
    countriesByContinent: byContinent,
    firstPhotoAt,
    stamps,
    photos,
  };
}

/**
 * The map's badges. With `award` (the owner or an editor), badges now earned are stored
 * first (counted from everything, hidden photos too) and listed in `newlyEarned`.
 * Below editor, progress counts only what the caller can see; awards are as stored.
 * -> `{ badges: [{ key, group, have, need, earnedAt }], newlyEarned }`
 */
export async function mapBadges(mapId, { award }) {
  const [facts, stored] = await Promise.all([loadMapFacts(mapId, { includeHidden: award }), findBadgeAwards(mapId)]);
  const progress = badgeProgress(facts);
  const earnedAt = new Map(stored.map((a) => [a.badgeKey, a.earnedAt]));
  let newlyEarned = [];
  if (award) {
    newlyEarned = progress.filter((b) => b.earned && !earnedAt.has(b.key)).map((b) => b.key);
    if (newlyEarned.length) {
      await createBadgeAwards(mapId, newlyEarned);
      // Read back, so the dates are the stored ones (another request may have won)
      for (const a of await findBadgeAwards(mapId)) earnedAt.set(a.badgeKey, a.earnedAt);
    }
  }
  return {
    badges: progress.map((b) => ({
      key: b.key,
      group: b.group,
      // An award stays even if the map later has less (a country unmarked)
      have: earnedAt.has(b.key) ? b.need : b.have,
      need: b.need,
      earnedAt: earnedAt.get(b.key) ?? null,
    })),
    newlyEarned,
  };
}

/** A goal as sent: its fields plus progress (`deadline` as "YYYY-MM-DD"). */
export function goalView(goal, progress) {
  return {
    id: goal.id,
    kind: goal.kind,
    title: goal.title,
    target: goal.target,
    countryCodes: goal.countryCodes,
    region: goal.region,
    deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : null,
    achievedAt: goal.achievedAt,
    createdAt: goal.createdAt,
    progress,
  };
}

/**
 * The map's goals with their progress. With `award` (the owner or an editor), goals met
 * for the first time are marked achieved and listed in `newlyAchieved`.
 */
export async function mapGoals(mapId, { award, now = new Date() }) {
  const goals = await findGoals(mapId);
  if (!goals.length) return { goals: [], newlyAchieved: [] };
  const facts = await loadMapFacts(mapId, { includeHidden: award });
  const withProgress = goals.map((goal) => ({ goal, progress: goalProgress(goal, facts, now) }));
  const newlyAchieved = award
    ? await markGoalsAchieved(
        withProgress.filter(({ goal, progress }) => progress.met && !goal.achievedAt).map(({ goal }) => goal.id),
        now
      )
    : [];
  const achievedNow = new Set(newlyAchieved);
  // A goal another request marked meanwhile is achieved too (but announced there)
  const metNow = (goal, progress) => achievedNow.has(goal.id) || (award && progress.met && !goal.achievedAt);
  return {
    goals: withProgress.map(({ goal, progress }) =>
      goalView(metNow(goal, progress) ? { ...goal, achievedAt: goal.achievedAt ?? now } : goal, progress)
    ),
    newlyAchieved,
  };
}

/** One goal's progress (after a create or a change). */
export async function oneGoalView(goal, { award, now = new Date() }) {
  const facts = await loadMapFacts(goal.mapId, { includeHidden: award });
  const progress = goalProgress(goal, facts, now);
  if (award && progress.met && !goal.achievedAt) {
    await markGoalsAchieved([goal.id], now);
    return goalView({ ...goal, achievedAt: now }, progress);
  }
  return goalView(goal, progress);
}
