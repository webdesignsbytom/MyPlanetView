// The passport's pages in the order the places were visited (24 Nov 2026, the user's wish: "all
// passport stamps should be added in order of visiting"; Japan, marked visited today, came before
// places marked earlier today with no date, and the UK, lived in since 1990, came after places
// visited in 2019 because its first photo was from then). A copy of the server's
// src/utils/passportOrder.js, for the mock (dev/mock/passport.js), compared by a test.

const DAY_MS = 24 * 60 * 60 * 1000;
const timeOf = (value) => (value ? new Date(value).getTime() : Number.NaN);
const dayOf = (value) => Math.floor(timeOf(value) / DAY_MS);
// Earlier first; a missing value last
const compare = (a, b) => (Number.isNaN(a) ? (Number.isNaN(b) ? 0 : 1) : Number.isNaN(b) ? -1 : a - b);

/** The earliest of these dates (a Date or "YYYY-MM-DD…"; nulls skipped), or null. */
export const earliestOf = (...dates) => dates.filter(Boolean).reduce((best, date) => (!best || timeOf(date) < timeOf(best) ? date : best), null);

/**
 * The page codes in visiting order: by the day of the first visit (`enteredOn(code)`, a date),
 * else the day it was marked (`markedAt(code)`, when the visit was saved); on the same day, in
 * the order they were marked (Japan, marked visited today and dated today, after the places marked
 * earlier today with no date); then A–Z. A page with neither comes last.
 */
export function passportPageOrder(codes, { enteredOn, markedAt }) {
  const dayKey = (code) => dayOf(enteredOn(code) ?? markedAt(code));
  return [...codes].sort((a, b) => compare(dayKey(a), dayKey(b)) || compare(timeOf(markedAt(a)), timeOf(markedAt(b))) || a.localeCompare(b));
}
