// Anniversaries as moments (21 Nov 2026, the user's wish): a moment dated to the day comes
// round each year, and the map says so on the day (components/moments/AnniversaryTag.jsx).
// Pure.

const pad = (n) => String(n).padStart(2, '0');

/** The viewer's own today, "YYYY-MM-DD" (their clock, not UTC's). */
export const localDay = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** How many years ago a moment's day ("YYYY-MM-DD") was, on `today` ("YYYY-MM-DD"). */
export const yearsSince = (happenedOn, today) => Number(today.slice(0, 4)) - Number(String(happenedOn).slice(0, 4));

/** "A year ago today", "10 years ago today". */
export const yearsAgoToday = (years) => (years === 1 ? 'A year ago today' : `${years} years ago today`);
