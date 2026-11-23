// A trip's days, as the server checks them (controllers/trips.js; 23 Nov 2026: every new trip has
// both, and editing changes them, never takes them away): real "YYYY-MM-DD" days, the end on or
// after the start. -> the server's message for a problem, or null
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const realDay = (text) => typeof text === 'string' && DAY.test(text) && new Date(`${text}T00:00:00Z`).toISOString().slice(0, 10) === text;
const isRealDay = (text) => {
  try {
    return realDay(text);
  } catch {
    // "2026-13-45" makes an invalid date, which can't be written out
    return false;
  }
};

export const TRIP_DATES_REQUIRED = 'Give the trip the day it starts and the day it ends.';
const INVALID_DATE = 'Dates must be real dates written as YYYY-MM-DD.';
const OUT_OF_ORDER = 'The end date can’t be before the start date.';
const missing = (value) => value === null || value === '';

/** A new trip's days: both needed. */
export function newTripDatesProblem(startDate, endDate) {
  if (missing(startDate ?? null) || missing(endDate ?? null)) return TRIP_DATES_REQUIRED;
  if (!isRealDay(startDate) || !isRealDay(endDate)) return INVALID_DATE;
  return endDate < startDate ? OUT_OF_ORDER : null;
}

/** An edit's days (`undefined` keeps the trip's own), against the trip's. */
export function editedTripDatesProblem(trip, startDate, endDate) {
  if (missing(startDate) || missing(endDate)) return TRIP_DATES_REQUIRED;
  if ((startDate !== undefined && !isRealDay(startDate)) || (endDate !== undefined && !isRealDay(endDate))) return INVALID_DATE;
  const start = startDate ?? trip.startDate;
  const end = endDate ?? trip.endDate;
  return start && end && end < start ? OUT_OF_ORDER : null;
}
