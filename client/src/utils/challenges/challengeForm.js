// The challenge form (docs/API.md, "Friends challenges"): the inputs' strings, checked as the
// server checks them (server/src/utils/challenges.js parseChallengeInput; change both
// together). Pure.
import { CHALLENGE_MEASURE_ORDER } from './challengeWords';

export const CHALLENGE_TITLE_MAX = 80;
export const CHALLENGE_TARGET_MAX = 500;
// The longest a challenge may run: its last day at most this many days after its first
export const CHALLENGE_MAX_DAYS = 730;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const validDay = (text) => DAY.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) && new Date(`${text}T00:00:00Z`).toISOString().startsWith(text);

/** A new challenge's form: this calendar year (UTC), new countries. */
export function emptyChallengeForm(today) {
  const year = today.slice(0, 4);
  return { title: '', measure: 'NEW_COUNTRIES', startsOn: `${year}-01-01`, endsOn: `${year}-12-31`, target: '', mapId: '' };
}

export const challengeFormFrom = (challenge) => ({
  title: challenge.title,
  measure: challenge.measure,
  startsOn: challenge.startsOn,
  endsOn: challenge.endsOn,
  target: challenge.target ? String(challenge.target) : '',
  mapId: '',
});

/**
 * The request body, or the problems by field. A new one needs a map (`needsMap`); a change
 * (`existing`) sends only what changed, never the measure.
 * -> `{ ok: true, body }` or `{ ok: false, errors }`
 */
export function challengeBodyFrom(form, { existing = null, needsMap = !existing } = {}) {
  const errors = {};
  const title = form.title.replace(/\s+/g, ' ').trim();
  if (!title) errors.title = 'Give it a title.';
  else if (title.length > CHALLENGE_TITLE_MAX) errors.title = `At most ${CHALLENGE_TITLE_MAX} characters.`;
  if (!existing && !CHALLENGE_MEASURE_ORDER.includes(form.measure)) errors.measure = 'Choose what it counts.';
  if (!validDay(form.startsOn)) errors.startsOn = 'Choose the first day.';
  if (!validDay(form.endsOn)) errors.endsOn = 'Choose the last day.';
  if (!errors.startsOn && !errors.endsOn) {
    const days = Math.round((Date.parse(form.endsOn) - Date.parse(form.startsOn)) / DAY_MS);
    if (days < 0) errors.endsOn = 'The last day comes after the first.';
    else if (days > CHALLENGE_MAX_DAYS) errors.endsOn = 'A challenge can last up to two years.';
  }
  const targetText = String(form.target ?? '').trim();
  const target = targetText ? Number(targetText) : null;
  if (targetText && (!Number.isInteger(target) || target < 1 || target > CHALLENGE_TARGET_MAX)) {
    errors.target = `A whole number from 1 to ${CHALLENGE_TARGET_MAX}, or empty.`;
  }
  if (needsMap && !form.mapId) errors.mapId = 'Choose the map that counts for you.';
  if (Object.keys(errors).length) return { ok: false, errors };

  const body = { title, startsOn: form.startsOn, endsOn: form.endsOn, target };
  if (!existing) return { ok: true, body: { ...body, measure: form.measure, mapId: form.mapId } };
  const changed = Object.fromEntries(Object.entries(body).filter(([field, value]) => value !== (existing[field] ?? null)));
  return { ok: true, body: changed };
}
