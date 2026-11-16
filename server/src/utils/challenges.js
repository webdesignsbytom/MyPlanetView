// Friends challenges (docs/API.md, "Friends challenges"; docs/FEATURE-PLAN.md "Friends
// challenges"): the measures, the dates a challenge counts, where it stands, checking an
// input, and the leaderboard's order. Pure. Days are UTC, both ends included.
import { sanitizeText } from './sanitize.js';
import { isUuid, parseDateOnly } from './travelValidation.js';

export const CHALLENGE_MEASURES = Object.freeze(['NEW_COUNTRIES', 'COUNTRIES', 'LANDMARKS', 'THEME_PHOTOS']);

export const CHALLENGE_LIMITS = Object.freeze({
  title: 80,
  target: 500,
  // A challenge lasts at most this many days after its first (two years)
  days: 730,
  // People in one challenge, and challenges one person is in
  members: 50,
  perUser: 30,
});

const DAY_MS = 24 * 60 * 60 * 1000;

/** "2027-01-31" for a Date at midnight UTC. */
export const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

/** What counts: `{ from, before }`, from the first day's midnight to the day after the last (UTC). */
export const challengeWindow = ({ startsOn, endsOn }) => ({
  from: new Date(startsOn),
  before: new Date(new Date(endsOn).getTime() + DAY_MS),
});

/** 'UPCOMING' before the first day, 'RUNNING' through the last, then 'ENDED'. */
export function challengeStatus(challenge, now = new Date()) {
  const { from, before } = challengeWindow(challenge);
  if (now < from) return 'UPCOMING';
  return now < before ? 'RUNNING' : 'ENDED';
}

/**
 * Someone's standing from the dates their items counted (one per country, landmark or
 * photo): `{ count, reachedAt }`, `reachedAt` being when they got to `target` (the
 * target-th item's date), or null.
 */
export function standing(itemDates, target = null) {
  const sorted = itemDates.map((d) => new Date(d)).sort((a, b) => a - b);
  return { count: sorted.length, reachedAt: target && sorted.length >= target ? sorted[target - 1] : null };
}

/**
 * The leaderboard: with a target, those who reached it first (earliest first), then the
 * rest by count; without one, by count. Equal places share a rank. `rows` are
 * `{ ...anything, count, reachedAt }`; each comes back with `rank` (1 is first).
 */
export function rankMembers(rows) {
  const placed = [...rows].sort((a, b) => {
    if (a.reachedAt && b.reachedAt) return a.reachedAt - b.reachedAt || b.count - a.count;
    if (a.reachedAt || b.reachedAt) return a.reachedAt ? -1 : 1;
    return b.count - a.count;
  });
  const sameAs = (a, b) => (a.reachedAt?.getTime() ?? null) === (b.reachedAt?.getTime() ?? null) && a.count === b.count;
  let previous = null;
  return placed.map((row, i) => {
    const rank = previous && sameAs(row, previous.row) ? previous.rank : i + 1;
    previous = { row, rank };
    return { ...row, rank };
  });
}

/**
 * A challenge's details: `{ title, measure, startsOn, endsOn, target? }` (dates
 * "YYYY-MM-DD"). With `existing`, only the fields sent are checked (the measure never
 * changes once made). -> `{ ok: true, data }` or `{ ok: false, message }` (an EVENT_MESSAGES key)
 */
export function parseChallengeInput(body, { existing = null } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, message: 'challengeInvalid' };
  const data = {};
  if (!existing || body.title !== undefined) {
    const title = typeof body.title === 'string' ? sanitizeText(body.title.replace(/\s+/g, ' '), { maxLength: 1000 }) : null;
    if (!title || title.length > CHALLENGE_LIMITS.title) return { ok: false, message: 'challengeInvalid' };
    data.title = title;
  }
  if (existing) {
    if (body.measure !== undefined && body.measure !== existing.measure) return { ok: false, message: 'challengeMeasureFixed' };
  } else {
    if (!CHALLENGE_MEASURES.includes(body.measure)) return { ok: false, message: 'challengeInvalid' };
    data.measure = body.measure;
  }
  for (const field of ['startsOn', 'endsOn']) {
    if (existing && body[field] === undefined) continue;
    const day = typeof body[field] === 'string' ? parseDateOnly(body[field]) : { ok: false };
    if (!day.ok || !day.value) return { ok: false, message: 'challengeInvalid' };
    data[field] = day.value;
  }
  const startsOn = data.startsOn ?? (existing ? new Date(existing.startsOn) : null);
  const endsOn = data.endsOn ?? (existing ? new Date(existing.endsOn) : null);
  const days = Math.round((endsOn - startsOn) / DAY_MS);
  if (days < 0 || days > CHALLENGE_LIMITS.days) return { ok: false, message: 'challengeDates' };
  if (!existing || body.target !== undefined) {
    if (body.target === null || body.target === undefined || body.target === '') data.target = null;
    else if (!Number.isInteger(body.target) || body.target < 1 || body.target > CHALLENGE_LIMITS.target) {
      return { ok: false, message: 'challengeInvalid' };
    } else data.target = body.target;
  }
  return { ok: true, data };
}

/** The map that counts for someone: a map id, or a 400 (an EVENT_MESSAGES key). */
export const parseChallengeMapId = (value) => (isUuid(value) ? { ok: true, mapId: value } : { ok: false, message: 'challengeMapInvalid' });
