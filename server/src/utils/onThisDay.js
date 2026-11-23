// "On this day" emails (docs/API.md "Emails"; 21 Nov 2026, the user's wish, from the business
// review: "Three years ago today you were in Kyoto", with the photo, a reason to come back that
// needs nothing new). Pure, so tested on its own (tests/onThisDay.test.js).
import crypto from 'node:crypto';

const DAY_MS = 24 * 60 * 60 * 1000;
// At most one a week: a few hours' slack, so a cron that runs a little early still sends
export const ON_THIS_DAY_GAP_MS = 7 * DAY_MS - 3 * 60 * 60 * 1000;
// One run's emails, and how long it may take (Vercel stops the function at 60 s)
export const ON_THIS_DAY_MAX_EMAILS = 300;
export const ON_THIS_DAY_BUDGET_MS = 45_000;

const isLeap = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * The calendar day a run looks for, in UTC: `{ month, days, before }`: today's month (1–12)
 * and day, plus the 29th on 28 February in a year without one (so a leap-day photo still has
 * its day), and `before`, the start of this year (only earlier years count).
 */
export function anniversaryOf(now = new Date()) {
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const days = month === 2 && day === 28 && !isLeap(now.getUTCFullYear()) ? [28, 29] : [day];
  return { month, days, before: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)) };
}

/**
 * The day a map's anniversary list looks for, from the viewer's own today ("YYYY-MM-DD"):
 * anniversaryOf for that day, or null for anything else.
 */
export function anniversaryDay(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) return null;
  return anniversaryOf(date);
}

/** Whether the account may have another (none yet, or the last a week ago). */
export const canSendAgain = (lastSentAt, now = new Date()) => !lastSentAt || now - new Date(lastSentAt) >= ON_THIS_DAY_GAP_MS;

/** A small, stable hash of a text (the day's pick, so a re-run picks the same photo). */
const hash = (text) => crypto.createHash('sha256').update(text).digest().readUInt32BE(0);

/**
 * The day's memory for one account, from its photos taken on this day in earlier years:
 * one at a landmark if there is one, else one in a country, else any; among those, the same
 * pick for the same day. -> a candidate, or null
 */
export function pickMemory(candidates, seed) {
  if (!candidates?.length) return null;
  const pool =
    [candidates.filter((c) => c.landmarkName), candidates.filter((c) => c.countryName), candidates].find((list) => list.length) ?? candidates;
  return [...pool].sort((a, b) => hash(`${seed}:${a.photoId}`) - hash(`${seed}:${b.photoId}`))[0];
}

// A moment's anniversary (21 Nov 2026, the user's wish: "anniversaries as moments") comes
// before any photo: life's days first (a wedding, a birth, a first trip), then any moment
// dated to the day
export const LIFE_MOMENT_KINDS = Object.freeze([
  'WEDDING',
  'ANNIVERSARY',
  'ENGAGEMENT',
  'MET_SOMEONE',
  'BORN',
  'FIRST_TRIP',
  'MOVED_HERE',
  'GRADUATED',
  'NEW_JOB',
]);

/** The day's moment for one account, from its moments dated to this day in earlier years. -> one, or null */
export function pickAnniversary(candidates, seed) {
  if (!candidates?.length) return null;
  const life = candidates.filter((c) => LIFE_MOMENT_KINDS.includes(c.kind));
  const pool = life.length ? life : candidates;
  return [...pool].sort((a, b) => hash(`${seed}:${a.momentId}`) - hash(`${seed}:${b.momentId}`))[0];
}

// Country names read "in the …" (the United Kingdom, the Netherlands)
const THE = /^(United |Republic of |Democratic Republic of |Czech Republic$|Dominican Republic$|Central African Republic$|Netherlands$|Philippines$|Bahamas$|Gambia$|Maldives$|Seychelles$|Comoros$|Vatican)|( Islands)$/;
export const inCountry = (name) => (THE.test(name) ? `in the ${name}` : `in ${name}`);

const ago = (years) => (years === 1 ? 'A year ago today' : `${years} years ago today`);

/**
 * The email's words: `{ subject, headline, caption }`: "3 years ago today: Fushimi Inari",
 * "3 years ago today you were in Japan", "Fushimi Inari, Japan".
 */
export function memoryWords({ years, landmarkName = null, countryName = null, mapName = null }) {
  const place = landmarkName || countryName;
  return {
    subject: place ? `${ago(years)}: ${place}` : `${ago(years)}, on your map`,
    headline: countryName ? `${ago(years)} you were ${inCountry(countryName)}` : `${ago(years)}, from “${mapName ?? 'your map'}”`,
    caption: [landmarkName, countryName].filter(Boolean).join(', '),
  };
}

/**
 * A moment's anniversary in words: "10 years ago today: Our wedding", "10 years ago today, in
 * Italy" and the moment's title.
 */
export function anniversaryWords({ years, title, countryName = null }) {
  return {
    subject: `${ago(years)}: ${title}`,
    headline: countryName ? `${ago(years)}, ${inCountry(countryName)}` : ago(years),
    caption: title,
  };
}

// Links in the emails, signed so they can't be made up: the photo (it stays the reader's own,
// and works however long after the email is opened) and the unsubscribe link (no sign-in)
const sign = (purpose, value, secret) => crypto.createHmac('sha256', secret || 'on-this-day').update(`${purpose}:${value}`).digest('base64url').slice(0, 32);

export const photoLinkToken = (photoId, secret) => sign('memory-photo', photoId, secret);

// The emails someone can stop, each its own unsubscribe link (`l`; none is "On this day", as
// the first emails' links say): "On this day" and the "Welcome home" reminder after a trip
export const EMAIL_LISTS = Object.freeze({ onThisDay: 'on-this-day', tripShare: 'trips' });
export const unsubscribeToken = (userId, secret, list = EMAIL_LISTS.onThisDay) => sign(`unsubscribe:${list}`, userId, secret);

/** A token checked in constant time. */
export function tokenMatches(given, expected) {
  if (typeof given !== 'string' || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
