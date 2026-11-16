// Mock mode only: friends challenges (docs/API.md, "Friends challenges"), as the server's
// utils/challenges.js and domain/challenges.js: the dates, where a challenge stands, the
// counts from the mock store, the leaderboard's order and checking an input. Challenges are
// kept as `{ id, title, measure, startsOn, endsOn, target, joinCode, createdById, createdAt }`
// (days "YYYY-MM-DD"), people in them as `{ challengeId, userId, mapId, joinedAt }`.
import { isSpecialPlace } from '@/utils/map/specialPlaces';

export const CHALLENGE_MEASURES = ['NEW_COUNTRIES', 'COUNTRIES', 'LANDMARKS', 'THEME_PHOTOS'];
export const CHALLENGE_LIMITS = Object.freeze({ title: 80, target: 500, days: 730, members: 50, perUser: 30 });

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const dayStart = (day) => new Date(`${day}T00:00:00.000Z`);
const validDay = (text) => typeof text === 'string' && DAY.test(text) && dayStart(text).toISOString().startsWith(text);

export const challengeWindow = ({ startsOn, endsOn }) => ({ from: dayStart(startsOn), before: new Date(dayStart(endsOn).getTime() + DAY_MS) });

export function challengeStatus(challenge, now = new Date()) {
  const { from, before } = challengeWindow(challenge);
  if (now < from) return 'UPCOMING';
  return now < before ? 'RUNNING' : 'ENDED';
}

/** `{ count, reachedAt }` from the dates each item counted (the server's standing). */
export function standing(dates, target = null) {
  const sorted = dates.map((d) => new Date(d)).sort((a, b) => a - b);
  return { count: sorted.length, reachedAt: target && sorted.length >= target ? sorted[target - 1] : null };
}

/** The server's rankMembers: the first to the target first, then by count; ties share a rank. */
export function rankMembers(rows) {
  const placed = [...rows].sort((a, b) => {
    if (a.reachedAt && b.reachedAt) return a.reachedAt - b.reachedAt || b.count - a.count;
    if (a.reachedAt || b.reachedAt) return a.reachedAt ? -1 : 1;
    return b.count - a.count;
  });
  const same = (a, b) => (a.reachedAt?.getTime() ?? null) === (b.reachedAt?.getTime() ?? null) && a.count === b.count;
  let previous = null;
  return placed.map((row, i) => {
    const rank = previous && same(row, previous.row) ? previous.rank : i + 1;
    previous = { row, rank };
    return { ...row, rank };
  });
}

/** The dates a map's items counted for `measure` (the server's countedDates), from the store. */
export function countedDates(db, measure, mapId, { from, before }) {
  const inside = (at) => at >= from && at < before;
  const photos = db.photos.filter((p) => p.mapId === mapId);
  const firstByCountry = (list) => {
    const first = new Map();
    for (const photo of list) {
      if (!photo.countryCode || isSpecialPlace(photo.countryCode)) continue;
      const shot = new Date(photo.shotAt ?? photo.takenAt ?? photo.createdAt);
      const seen = first.get(photo.countryCode);
      if (!seen || shot < seen) first.set(photo.countryCode, shot);
    }
    return [...first.values()];
  };
  if (measure === 'NEW_COUNTRIES') return firstByCountry(photos).filter(inside);
  if (measure === 'COUNTRIES') return firstByCountry(photos.filter((p) => inside(new Date(p.shotAt ?? p.takenAt ?? p.createdAt))));
  if (measure === 'LANDMARKS') {
    const shotOf = new Map(photos.map((p) => [p.id, new Date(p.shotAt ?? p.takenAt ?? p.createdAt)]));
    const first = new Map();
    for (const match of db.photoLandmarks) {
      const shot = shotOf.get(match.photoId);
      if (!shot || !match.confirmed || !inside(shot)) continue;
      const seen = first.get(match.landmarkId);
      if (!seen || shot < seen) first.set(match.landmarkId, shot);
    }
    return [...first.values()];
  }
  if (measure === 'THEME_PHOTOS') {
    return (db.themeEntries || []).filter((e) => e.mapId === mapId).map((e) => new Date(e.enteredAt)).filter(inside);
  }
  return [];
}

/** Does `userId` own or edit `mapId` (so it can count for them)? */
export const canCountMap = (db, userId, mapId) =>
  db.maps.some((m) => m.id === mapId && m.ownerId === userId) ||
  db.mapMembers.some((m) => m.mapId === mapId && m.userId === userId && m.role === 'EDITOR');

/** The server's parseChallengeInput. -> `{ ok, data }` or `{ ok: false, message }` */
export function parseChallengeInput(body, { existing = null } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, message: 'invalid' };
  const data = {};
  if (!existing || body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
    if (!title || title.length > CHALLENGE_LIMITS.title) return { ok: false, message: 'invalid' };
    data.title = title;
  }
  if (existing) {
    if (body.measure !== undefined && body.measure !== existing.measure) return { ok: false, message: 'measureFixed' };
  } else {
    if (!CHALLENGE_MEASURES.includes(body.measure)) return { ok: false, message: 'invalid' };
    data.measure = body.measure;
  }
  for (const field of ['startsOn', 'endsOn']) {
    if (existing && body[field] === undefined) continue;
    if (!validDay(body[field])) return { ok: false, message: 'invalid' };
    data[field] = body[field];
  }
  const startsOn = data.startsOn ?? existing?.startsOn;
  const endsOn = data.endsOn ?? existing?.endsOn;
  const days = Math.round((dayStart(endsOn) - dayStart(startsOn)) / DAY_MS);
  if (days < 0 || days > CHALLENGE_LIMITS.days) return { ok: false, message: 'dates' };
  if (!existing || body.target !== undefined) {
    if (body.target === null || body.target === undefined || body.target === '') data.target = null;
    else if (!Number.isInteger(body.target) || body.target < 1 || body.target > CHALLENGE_LIMITS.target) return { ok: false, message: 'invalid' };
    else data.target = body.target;
  }
  return { ok: true, data };
}
