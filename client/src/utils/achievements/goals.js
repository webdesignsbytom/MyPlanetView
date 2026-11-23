// Personal goals (docs/API.md, "Badges and goals"): the server's limits
// (server/src/utils/goals.js; change both together) and how the client words a goal and
// its progress. Mock mode's rules (src/dev/mock/achievements.js) use the same limits.
import { INHABITED_CONTINENTS, REGIONS, regionCodesOnMap } from '@/utils/constants/regions';
import { CONTINENT_LABELS, countriesOnMap, countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';
import { plural } from '@/utils/functions/plural';

export const GOAL_KINDS = Object.freeze(['COUNTRY_COUNT', 'COUNTRY_LIST', 'REGION', 'LANDMARK_COUNT']);
export const GOALS_PER_MAP = 50;
export const GOAL_TITLE_MAX = 80;
export const GOAL_LIST_MAX = 100;
// A target above every country there is (226) or every landmark (1,366) can't be met
export const GOAL_TARGET_MAX = Object.freeze({ COUNTRY_COUNT: 250, LANDMARK_COUNT: 2000 });
// A goal's region: a region (utils/constants/regions.js) or an inhabited continent
export const GOAL_REGIONS = Object.freeze([...Object.keys(REGIONS), ...INHABITED_CONTINENTS]);

// The form's choices, in the order people think of them
export const GOAL_KIND_OPTIONS = [
  { value: 'COUNTRY_COUNT', label: 'A number of countries' },
  { value: 'COUNTRY_LIST', label: 'A bucket list of places' },
  { value: 'REGION', label: 'Every country in a region or continent' },
  { value: 'LANDMARK_COUNT', label: 'A number of landmark stamps' },
];

/** A region key's or a continent's name: "Benelux", "Europe". */
export const regionName = (region) => REGIONS[region]?.name ?? CONTINENT_LABELS[region] ?? region;

// For GroupedOptionSelect: the continents, then the regions
export const GOAL_REGION_GROUPS = [
  { label: 'Continents', options: INHABITED_CONTINENTS.map((c) => ({ value: c, label: CONTINENT_LABELS[c] })) },
  { label: 'Regions', options: Object.keys(REGIONS).map((key) => ({ value: key, label: REGIONS[key].name })) },
];

// "Japan, Peru and Iceland"; past `max` names, "Japan, Peru and 5 more"
export function listNames(codes, max = 4) {
  const names = codes.map(countryName);
  if (names.length <= 1) return names.join('');
  if (names.length > max) return `${names.slice(0, max - 1).join(', ')} and ${names.length - (max - 1)} more`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** What a goal asks for, in words: its own title, else one made from what it asks. */
export function goalName(goal) {
  if (goal.title) return goal.title;
  switch (goal.kind) {
    case 'COUNTRY_COUNT':
      return plural(goal.target, 'country', 'countries');
    case 'LANDMARK_COUNT':
      return plural(goal.target, 'landmark stamp');
    case 'COUNTRY_LIST':
      return `Bucket list: ${listNames(goal.countryCodes || [])}`;
    case 'REGION':
      return `Every country in ${regionName(goal.region).replace(/^The /, 'the ')}`;
    default:
      return 'Goal';
  }
}

/** "8 of 10 countries", "1 of 3 places", "12 of 50 stamps". */
export function goalProgressText(goal) {
  const { have = 0, need = 0 } = goal.progress || {};
  const unit = goal.kind === 'LANDMARK_COUNT' ? 'stamps' : goal.kind === 'COUNTRY_LIST' ? 'places' : 'countries';
  return `${have} of ${need} ${unit}`;
}

/** Reached, missed (the deadline passed unmet), or still going. */
export function goalState(goal) {
  if (goal.achievedAt || goal.progress?.met) return 'reached';
  if (goal.progress?.missed) return 'missed';
  return 'going';
}

/** "By 31 Dec 2027", "Reached 12 Mar 2026", "Missed: the deadline was 1 Jan 2026". */
export function goalStateText(goal) {
  const state = goalState(goal);
  if (state === 'reached') return goal.achievedAt ? `Reached ${formatDay(goal.achievedAt)}` : 'Reached';
  if (state === 'missed') return `Missed: the deadline was ${formatDay(goal.deadline)}`;
  return goal.deadline ? `By ${formatDay(goal.deadline)}` : 'No deadline';
}

/** How far along a goal is, 0 to 1. */
export const goalFraction = (goal) => {
  const { have = 0, need = 0 } = goal.progress || {};
  return need > 0 ? Math.min(have / need, 1) : 0;
};

/**
 * The goal the map's luggage tag shows: the unmet one nearest done (the biggest share of
 * what it asks), the earlier deadline first on a tie, then the oldest. Null when every
 * goal is reached or missed (or there are none).
 */
export function nearestGoal(goals = []) {
  const open = goals.filter((goal) => goalState(goal) === 'going');
  if (!open.length) return null;
  return [...open].sort((a, b) => {
    const share = goalFraction(b) - goalFraction(a);
    if (share) return share;
    if (a.deadline !== b.deadline) return !a.deadline ? 1 : !b.deadline ? -1 : a.deadline < b.deadline ? -1 : 1;
    return String(a.createdAt).localeCompare(String(b.createdAt));
  })[0];
}

/**
 * The countries a REGION goal covers: a region's list, or a continent's countries (special
 * places left out). On a map that splits the UK (`splitUk`), its nations in its place.
 */
export const regionCountryCodes = (region, splitUk = false) =>
  REGIONS[region]
    ? regionCodesOnMap(region, splitUk)
    : countriesOnMap(splitUk)
        .filter((country) => country.continent === region)
        .map((country) => country.code);

/** The places a list or region goal still needs (the done ones come in `progress.done`); [] for the counts. */
export function goalStillToGo(goal, splitUk = false) {
  if (goal.kind !== 'COUNTRY_LIST' && goal.kind !== 'REGION') return [];
  const done = new Set(goal.progress?.done || []);
  const codes = goal.kind === 'COUNTRY_LIST' ? goal.countryCodes || [] : regionCountryCodes(goal.region, splitUk);
  return codes.filter((code) => !done.has(code));
}
