// Personal goals (docs/API.md, "Badges and goals"; docs/FEATURE-PLAN.md, "Personal goals"):
// checking what's asked, and progress. Pure: the service loads the facts
// (services/travel/achievements.js).
import { sanitizeText } from './sanitize.js';
import { isCountryCode, parseDateOnly } from './travelValidation.js';
import { INHABITED_CONTINENTS, REGIONS } from './constants/regions.js';
import { isSpecialPlace } from './specialPlaces.js';

export const GOAL_KINDS = Object.freeze(['COUNTRY_COUNT', 'COUNTRY_LIST', 'REGION', 'LANDMARK_COUNT']);
export const GOALS_PER_MAP = 50;
export const GOAL_TITLE_MAX = 80;
export const GOAL_LIST_MAX = 100;
// A target above every country there is (227) or every landmark (1,332) can't be met
export const GOAL_TARGET_MAX = { COUNTRY_COUNT: 250, LANDMARK_COUNT: 2000 };
// A goal's region: a region (utils/constants/regions.js) or an inhabited continent
export const GOAL_REGIONS = Object.freeze([...Object.keys(REGIONS), ...INHABITED_CONTINENTS]);

const DEADLINE_RANGE = { min: Date.UTC(1900, 0, 1), max: Date.UTC(2200, 0, 1) };

/**
 * Checks a new goal (`existing` absent) or a change to one (`existing` is the stored goal;
 * its kind can't change). `isKnownCode` says whether a code is a place on the map.
 * -> `{ ok: true, data }` with the columns to write, or `{ ok: false }`
 */
export function parseGoalInput(body, { existing = null, isKnownCode }) {
  if (!body || typeof body !== 'object') return { ok: false };
  const kind = existing ? existing.kind : body.kind;
  if (!GOAL_KINDS.includes(kind)) return { ok: false };
  if (existing && body.kind !== undefined && body.kind !== existing.kind) return { ok: false };
  const data = existing ? {} : { kind };

  if (body.title !== undefined) {
    if (body.title !== null && typeof body.title !== 'string') return { ok: false };
    data.title = sanitizeText(body.title, { maxLength: GOAL_TITLE_MAX }) || null;
  }

  if (body.deadline !== undefined) {
    const deadline = parseDateOnly(body.deadline);
    if (!deadline.ok) return { ok: false };
    const time = deadline.value?.getTime();
    if (deadline.value && (time < DEADLINE_RANGE.min || time > DEADLINE_RANGE.max)) return { ok: false };
    data.deadline = deadline.value;
  }

  // Each kind's own field: required on a new goal, optional on a change
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
      if (!codes.every((code) => isCountryCode(code) && isKnownCode(code))) return { ok: false };
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
export const changesWhatsAsked = (data) =>
  ['target', 'countryCodes', 'region', 'deadline'].some((field) => data[field] !== undefined);

/** The countries a REGION goal covers. `countriesByContinent`: continent -> its country codes. */
export function regionCodes(region, countriesByContinent) {
  if (REGIONS[region]) return REGIONS[region].codes;
  return (countriesByContinent.get(region) ?? []).filter((code) => !isSpecialPlace(code));
}

// The end of a deadline's day, UTC
const endOfDay = (date) => new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000 - 1);

/**
 * How far a goal has got. Without a deadline, a country counts when it's marked visited
 * or lived, and every stamp counts. With one, only what a photo taken by the end of that
 * day proves counts (a hand-ticked country has no date).
 * @param {object} goal `{ kind, target, countryCodes, region, deadline }`
 * @param {object} facts
 * @param {Set<string>} facts.visited
 * @param {Map<string, Date>} facts.firstPhotoAt each country's earliest photo (shotAt)
 * @param {{ firstShotAt: Date }[]} facts.stamps
 * @param {Map<string, string[]>} facts.countriesByContinent
 * @param {Date} now
 * @returns {{ have: number, need: number, met: boolean, missed: boolean, done?: string[] }}
 */
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
    const codes = goal.kind === 'COUNTRY_LIST' ? goal.countryCodes : regionCodes(goal.region, facts.countriesByContinent);
    done = codes.filter(countryDone);
    have = done.length;
    need = codes.length;
  }
  const met = need > 0 && have >= need;
  const missed = !met && Boolean(deadline) && now.getTime() > deadline.getTime();
  return { have: Math.min(have, need), need, met, missed, ...(done ? { done } : {}) };
}
