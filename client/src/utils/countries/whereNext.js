// "Where to go next" (22 Nov 2026, the user's wish, from "what else can we do to compete"):
// a map's want-to-go places matched to the best time for each, from the country guides'
// month ratings ('best' | 'good' | 'avoid', January to December). Pure.
import { countryOf } from '@/utils/map/ukNations';
import { countryName } from '@/utils/map/countries';

const GOOD = new Set(['best', 'good']);
const byRatingThenName = (a, b) => (a.rating === b.rating ? 0 : a.rating === 'best' ? -1 : 1) || countryName(a.code).localeCompare(countryName(b.code));

/**
 * The next month (after `month`, 0–11) rated best, else good, in the coming eleven:
 * `{ month, ahead, rating }`, or null when none is.
 */
function nextGoodMonth(months, month) {
  for (const wanted of ['best', 'good']) {
    for (let ahead = 1; ahead < 12; ahead++) {
      const m = (month + ahead) % 12;
      if (months[m] === wanted) return { month: m, ahead, rating: wanted };
    }
  }
  return null;
}

/**
 * The want-to-go places (`codes`) by when to go, on `month` (0–11), from `guides`
 * (useCountryGuides' rows: `{ code, slug, months }`; a UK nation's or a region's is its
 * country's):
 * - `now`: rated best or good this month, best first;
 * - `upcoming`: the rest, each at its next best month (else good), grouped by month, soonest first;
 * - `never`: a guide that rates no month best or good;
 * - `noGuide`: no guide yet.
 * Each place is `{ code, rating, guide }`.
 */
export function whereNext({ codes = [], guides = [], month }) {
  const guideOf = new Map(guides.filter((g) => g?.months?.length === 12).map((g) => [g.code, g]));
  const now = [];
  const later = new Map();
  const never = [];
  const noGuide = [];
  for (const code of new Set(codes)) {
    const guide = guideOf.get(countryOf(code));
    if (!guide) {
      noGuide.push(code);
      continue;
    }
    const rating = guide.months[month];
    if (GOOD.has(rating)) {
      now.push({ code, rating, guide });
      continue;
    }
    const next = nextGoodMonth(guide.months, month);
    if (!next) {
      never.push({ code, rating: null, guide });
      continue;
    }
    if (!later.has(next.ahead)) later.set(next.ahead, { month: next.month, ahead: next.ahead, places: [] });
    later.get(next.ahead).places.push({ code, rating: next.rating, guide });
  }
  const byName = (a, b) => countryName(a.code ?? a).localeCompare(countryName(b.code ?? b));
  return {
    now: now.sort(byRatingThenName),
    upcoming: [...later.values()].sort((a, b) => a.ahead - b.ahead).map((group) => ({ ...group, places: group.places.sort(byRatingThenName) })),
    never: never.sort(byName),
    noGuide: noGuide.sort(byName),
  };
}
