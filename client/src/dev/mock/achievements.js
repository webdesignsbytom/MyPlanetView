// Mock mode only. Badges and goals as the server counts, awards and checks them
// (docs/API.md, "Badges and goals"): server/src/utils/badges.js, utils/goals.js and
// services/travel/achievements.js, ported rule for rule. Progress is counted from the
// map's own data (visits, photos, confirmed landmark matches); only awards
// (db.badgeAwards) and goals (db.goals) are stored. Awards are never taken back.
import { COUNTRIES } from '@/utils/map/countries';
import { isSpecialPlace } from '@/utils/map/specialPlaces';
import { INHABITED_CONTINENTS, REGIONS } from '@/utils/constants/regions';
import { GOAL_KINDS, GOAL_LIST_MAX, GOAL_REGIONS, GOAL_TARGET_MAX, GOAL_TITLE_MAX } from '@/utils/achievements/goals';
import { getDb } from './store';
import { countryExists, landmarkById } from './views';
import { shotAtOf } from './photoOrder';
import { sanitizeText } from './moments';

// The server's EVENT_MESSAGES
export const GOAL_MESSAGES = {
  notFound: "That goal doesn't exist, or it hasn't been shared with you.",
  invalid: "That goal isn't complete: check what it asks for.",
  full: 'A map can have up to 50 goals. Delete one to add another.',
};

const COUNTED_VISIT_STATUSES = ['VISITED', 'LIVED'];
const continentByCode = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
const countriesByContinent = new Map();
for (const { code, continent } of COUNTRIES) {
  if (!continent) continue;
  if (!countriesByContinent.has(continent)) countriesByContinent.set(continent, []);
  countriesByContinent.get(continent).push(code);
}

// Badges (utils/badges.js)

const continentKey = (continent) => continent.toLowerCase().replace(/_/g, '-');

export const BADGES = Object.freeze([
  ...[1, 5, 10, 25, 50, 100].map((need) => ({ key: `countries-${need}`, group: 'countries', measure: 'countries', need })),
  ...INHABITED_CONTINENTS.map((continent) => ({
    key: `continent-${continentKey(continent)}`,
    group: 'continents',
    measure: 'continent',
    continent,
    need: 1,
  })),
  { key: 'continents-all', group: 'continents', measure: 'inhabitedContinents', need: INHABITED_CONTINENTS.length },
  { key: 'antarctica', group: 'special', measure: 'place', code: 'AQ', need: 1 },
  { key: 'north-pole', group: 'special', measure: 'place', code: 'XN', need: 1 },
  { key: 'south-pole', group: 'special', measure: 'place', code: 'XS', need: 1 },
  ...Object.entries(REGIONS).map(([region, { codes }]) => ({ key: `region-${region}`, group: 'regions', measure: 'region', region, need: codes.length })),
  ...[1, 10, 50].map((need) => ({ key: `landmarks-${need}`, group: 'landmarks', measure: 'landmarks', need })),
  ...[5, 25].map((need) => ({ key: `unesco-${need}`, group: 'landmarks', measure: 'unesco', need })),
  ...[100, 1000].map((need) => ({ key: `photos-${need}`, group: 'photos', measure: 'photos', need })),
]);

export function badgeProgress({ visited = new Set(), stamps = [], photos = 0 }) {
  const countries = [...visited].filter((code) => !isSpecialPlace(code));
  const continents = new Set(countries.map((code) => continentByCode.get(code)).filter(Boolean));
  const counts = {
    countries: countries.length,
    inhabitedContinents: INHABITED_CONTINENTS.filter((c) => continents.has(c)).length,
    landmarks: stamps.length,
    unesco: stamps.filter((stamp) => stamp.isUnesco).length,
    photos,
  };
  const haveFor = (badge) => {
    if (badge.measure === 'continent') return continents.has(badge.continent) ? 1 : 0;
    if (badge.measure === 'place') return visited.has(badge.code) ? 1 : 0;
    if (badge.measure === 'region') return REGIONS[badge.region].codes.filter((code) => visited.has(code)).length;
    return counts[badge.measure];
  };
  return BADGES.map((badge) => {
    const have = haveFor(badge);
    return { key: badge.key, group: badge.group, have: Math.min(have, badge.need), need: badge.need, earned: have >= badge.need };
  });
}

// Goals (utils/goals.js)

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DEADLINE_RANGE = { min: Date.UTC(1900, 0, 1), max: Date.UTC(2200, 0, 1) };
const isCountryCode = (value) => typeof value === 'string' && /^[A-Z]{2}$/.test(value);

// As the server's parseDateOnly: missing -> undefined, null or "" -> null, else a real day
function parseDateOnly(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  const match = typeof input === 'string' ? DATE_ONLY.exec(input) : null;
  if (!match) return { ok: false };
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return { ok: false };
  return { ok: true, value: date };
}

/** A new goal (`existing` absent) or a change to one. -> `{ ok: true, data }` or `{ ok: false }` */
export function parseGoalInput(body, { existing = null } = {}) {
  if (!body || typeof body !== 'object') return { ok: false };
  const kind = existing ? existing.kind : body.kind;
  if (!GOAL_KINDS.includes(kind)) return { ok: false };
  if (existing && body.kind !== undefined && body.kind !== existing.kind) return { ok: false };
  const data = existing ? {} : { kind };

  if (body.title !== undefined) {
    if (body.title !== null && typeof body.title !== 'string') return { ok: false };
    data.title = sanitizeText(body.title, GOAL_TITLE_MAX) || null;
  }

  if (body.deadline !== undefined) {
    const deadline = parseDateOnly(body.deadline);
    if (!deadline.ok) return { ok: false };
    const time = deadline.value?.getTime();
    if (deadline.value && (time < DEADLINE_RANGE.min || time > DEADLINE_RANGE.max)) return { ok: false };
    // Stored as the day itself ("YYYY-MM-DD"), as the API answers it
    data.deadline = deadline.value ? deadline.value.toISOString().slice(0, 10) : null;
  }

  if (kind === 'COUNTRY_COUNT' || kind === 'LANDMARK_COUNT') {
    if (body.countryCodes !== undefined || body.region !== undefined) return { ok: false };
    if (body.target !== undefined || !existing) {
      if (!Number.isInteger(body.target) || body.target < 1 || body.target > GOAL_TARGET_MAX[kind]) return { ok: false };
      data.target = body.target;
    }
  }
  if (kind === 'COUNTRY_LIST') {
    if (body.target !== undefined || body.region !== undefined) return { ok: false };
    if (body.countryCodes !== undefined || !existing) {
      const codes = body.countryCodes;
      if (!Array.isArray(codes) || !codes.length || codes.length > GOAL_LIST_MAX) return { ok: false };
      if (new Set(codes).size !== codes.length) return { ok: false };
      if (!codes.every((code) => isCountryCode(code) && countryExists(code))) return { ok: false };
      data.countryCodes = [...codes];
    }
  }
  if (kind === 'REGION') {
    if (body.target !== undefined || body.countryCodes !== undefined) return { ok: false };
    if (body.region !== undefined || !existing) {
      if (!GOAL_REGIONS.includes(body.region)) return { ok: false };
      data.region = body.region;
    }
  }
  return { ok: true, data };
}

/** Does a change ask for something else (so an achieved goal has to be met again)? */
export const changesWhatsAsked = (data) => ['target', 'countryCodes', 'region', 'deadline'].some((field) => data[field] !== undefined);

function regionCodes(region) {
  if (REGIONS[region]) return REGIONS[region].codes;
  return (countriesByContinent.get(region) ?? []).filter((code) => !isSpecialPlace(code));
}

// The end of a deadline's day, UTC
const endOfDay = (day) => new Date(new Date(`${day}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1);

export function goalProgress(goal, facts, now = new Date()) {
  const deadline = goal.deadline ? endOfDay(goal.deadline) : null;
  const countryDone = (code) => {
    if (!deadline) return facts.visited.has(code);
    const first = facts.firstPhotoAt.get(code);
    return Boolean(first) && first.getTime() <= deadline.getTime();
  };

  let have;
  let need;
  let done;
  if (goal.kind === 'COUNTRY_COUNT') {
    const codes = deadline ? [...facts.firstPhotoAt.keys()] : [...facts.visited];
    have = codes.filter((code) => !isSpecialPlace(code) && countryDone(code)).length;
    need = goal.target;
  } else if (goal.kind === 'LANDMARK_COUNT') {
    have = facts.stamps.filter((stamp) => !deadline || stamp.firstShotAt.getTime() <= deadline.getTime()).length;
    need = goal.target;
  } else {
    const codes = goal.kind === 'COUNTRY_LIST' ? goal.countryCodes : regionCodes(goal.region);
    done = codes.filter(countryDone);
    have = done.length;
    need = codes.length;
  }
  const met = need > 0 && have >= need;
  const missed = !met && Boolean(deadline) && now.getTime() > deadline.getTime();
  return { have: Math.min(have, need), need, met, missed, ...(done ? { done } : {}) };
}

// The map's facts (services/travel/achievements.js loadMapFacts), as the caller may see
// them: `includeHidden` for the owner and editors (who also award)

/** Each stamped landmark on a map, with its earliest confirmed photo's shotAt (domain/passport.js findStamps). */
function findStamps(mapPhotos) {
  const photoById = new Map(mapPhotos.map((p) => [p.id, p]));
  const byLandmark = new Map();
  for (const match of getDb().photoLandmarks) {
    const photo = photoById.get(match.photoId);
    if (!match.confirmed || !photo) continue;
    const landmark = landmarkById(match.landmarkId);
    if (!landmark) continue;
    const shot = new Date(photo.shotAt ?? shotAtOf(photo));
    const seen = byLandmark.get(landmark.id);
    if (!seen || shot < seen.firstShotAt) {
      byLandmark.set(landmark.id, { landmarkId: landmark.id, countryCode: landmark.countryCode, isUnesco: Boolean(landmark.isUnesco), firstShotAt: shot });
    }
  }
  return [...byLandmark.values()];
}

export function loadMapFacts(mapId, { includeHidden }) {
  const db = getDb();
  const visited = new Set(
    db.visits.filter((v) => v.mapId === mapId && COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => v.countryCode),
  );
  const photos = db.photos.filter((p) => p.mapId === mapId && (includeHidden || !p.hidden));
  // Each country's earliest photo (when it was taken)
  const firstPhotoAt = new Map();
  for (const photo of photos) {
    if (!photo.countryCode) continue;
    const shot = new Date(photo.shotAt ?? shotAtOf(photo));
    const seen = firstPhotoAt.get(photo.countryCode);
    if (!seen || shot < seen) firstPhotoAt.set(photo.countryCode, shot);
  }
  return { visited, firstPhotoAt, stamps: findStamps(photos), photos: photos.length };
}

/**
 * The map's badges. With `award` (the owner or an editor), badges now earned are stored
 * first (counted from everything, hidden photos too) and listed in `newlyEarned`.
 */
export function mapBadges(mapId, { award }) {
  const db = getDb();
  const progress = badgeProgress(loadMapFacts(mapId, { includeHidden: award }));
  const earnedAt = new Map(db.badgeAwards.filter((a) => a.mapId === mapId).map((a) => [a.badgeKey, a.earnedAt]));
  let newlyEarned = [];
  if (award) {
    newlyEarned = progress.filter((b) => b.earned && !earnedAt.has(b.key)).map((b) => b.key);
    const now = new Date().toISOString();
    for (const badgeKey of newlyEarned) {
      db.badgeAwards.push({ mapId, badgeKey, earnedAt: now });
      earnedAt.set(badgeKey, now);
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

/** A goal as sent: its fields plus progress. */
export const goalView = (goal, progress) => ({
  id: goal.id,
  kind: goal.kind,
  title: goal.title,
  target: goal.target,
  countryCodes: goal.countryCodes,
  region: goal.region,
  deadline: goal.deadline,
  achievedAt: goal.achievedAt,
  createdAt: goal.createdAt,
  progress,
});

const byCreated = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** The map's goals, oldest first. With `award`, goals met for the first time are marked achieved. */
export function mapGoals(mapId, { award }) {
  const goals = getDb().goals.filter((g) => g.mapId === mapId).sort(byCreated);
  if (!goals.length) return { goals: [], newlyAchieved: [] };
  const facts = loadMapFacts(mapId, { includeHidden: award });
  const now = new Date();
  const withProgress = goals.map((goal) => ({ goal, progress: goalProgress(goal, facts, now) }));
  const newlyAchieved = award ? withProgress.filter(({ goal, progress }) => progress.met && !goal.achievedAt).map(({ goal }) => goal.id) : [];
  for (const { goal } of withProgress) if (newlyAchieved.includes(goal.id)) goal.achievedAt = now.toISOString();
  return { goals: withProgress.map(({ goal, progress }) => goalView(goal, progress)), newlyAchieved };
}

/** One goal's progress (after a create or a change); met for the first time, it's achieved now. */
export function oneGoalView(goal) {
  const now = new Date();
  const progress = goalProgress(goal, loadMapFacts(goal.mapId, { includeHidden: true }), now);
  if (progress.met && !goal.achievedAt) goal.achievedAt = now.toISOString();
  return goalView(goal, progress);
}

/**
 * The awards the demo data has already earned, given quietly (no "new badge" pop-up on
 * the first visit): every badge earned on every map, and every goal already met, dated
 * `when`. For the seed, and stores saved before badges and goals.
 */
export function awardQuietly(db, when) {
  db.badgeAwards ||= [];
  db.goals ||= [];
  for (const map of db.maps) {
    const facts = loadMapFacts(map.id, { includeHidden: true });
    const earned = new Set(db.badgeAwards.filter((a) => a.mapId === map.id).map((a) => a.badgeKey));
    for (const badge of badgeProgress(facts)) {
      if (badge.earned && !earned.has(badge.key)) db.badgeAwards.push({ mapId: map.id, badgeKey: badge.key, earnedAt: when });
    }
    for (const goal of db.goals.filter((g) => g.mapId === map.id && !g.achievedAt)) {
      if (goalProgress(goal, facts).met) goal.achievedAt = when;
    }
  }
}
