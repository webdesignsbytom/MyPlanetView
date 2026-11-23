// A boarding pass's barcode (IATA's Bar Coded Boarding Pass, Resolution 792: the same text in the
// PDF417 on paper and PDFs and the Aztec or QR code in phone wallets) read into its flights (23 Nov
// 2026, the flight log; docs/API.md "Flights"). The passenger's name and booking reference are
// skipped, never kept. Pure, so tested on its own.
//
// The text: "M", the number of flights (1–4), the name (20), "E" (an e-ticket); then per flight
// the booking reference (7), from (3), to (3), the airline (3), the flight number (5), the day of
// the year (3), the class (1), the seat (4), the check-in number (5), the passenger's status (1)
// and a hexadecimal size (2) of what follows for that flight. The first flight's part can hold
// the day the pass was issued, whose year's last digit tells the flight's year.

const DAY_MS = 24 * 60 * 60 * 1000;
const HEADER = 23;
const LEG_FIXED = 35;
// A pass for a flight further ahead than this is last year's (a pass is issued at check-in)
const FUTURE_DAYS = 30;

const isLeap = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** The `day`th day of `year` (1 = 1 January) as "YYYY-MM-DD", or null when the year hasn't one. */
export function dayOfYear(year, day) {
  if (!Number.isInteger(day) || day < 1 || day > (isLeap(year) ? 366 : 365)) return null;
  return new Date(Date.UTC(year, 0, day)).toISOString().slice(0, 10);
}

// The day the pass was issued, from the first flight's conditional part: ">", a version, a size
// (2), then the passenger's description, the check-in's and issue's sources, and the date (4:
// the year's last digit and the day of the year). -> { yearDigit, day }, or null
function issueOf(conditional) {
  if (conditional[0] !== '>' || conditional.length < 11) return null;
  const date = conditional.slice(7, 11);
  if (!/^\d{4}$/.test(date)) return null;
  const day = Number(date.slice(1));
  return day >= 1 && day <= 366 ? { yearDigit: Number(date[0]), day } : null;
}

/**
 * The flight's date: with the pass's issue date, the most recent year ending in its digit (the
 * flight on or after it, else the year after); without, this year, or last year for a day more
 * than a month ahead.
 */
export function flightDate(day, issue, today = new Date()) {
  const year = today.getUTCFullYear();
  if (issue) {
    const issueYear = year - (((year - issue.yearDigit) % 10) + 10) % 10;
    return dayOfYear(day >= issue.day ? issueYear : issueYear + 1, day);
  }
  const thisYear = dayOfYear(year, day);
  if (thisYear && Date.parse(thisYear) - today.getTime() <= FUTURE_DAYS * DAY_MS) return thisYear;
  return dayOfYear(year - 1, day);
}

const AIRPORT = /^[A-Z]{3}$/;
// "0117 " -> "117", "0012A" -> "12A"
const flightNumberOf = (text) => text.trim().replace(/^0+(?=\d)/, '') || null;

/**
 * A boarding pass's text -> `{ flights: [{ from, to, carrier, flightNumber, flownOn }] }`, or null
 * when it isn't one. A flight whose airports or day can't be read is left out.
 */
export function parseBoardingPass(text, today = new Date()) {
  const raw = String(text ?? '').replace(/[\r\n]+/g, '');
  if (!/^M[1-4]/.test(raw) || raw.length < HEADER + LEG_FIXED + 2) return null;
  const count = Number(raw[1]);
  const flights = [];
  let at = HEADER;
  let issue = null;
  for (let leg = 0; leg < count && raw.length >= at + LEG_FIXED + 2; leg++) {
    const part = raw.slice(at, at + LEG_FIXED);
    const size = Number.parseInt(raw.slice(at + LEG_FIXED, at + LEG_FIXED + 2), 16);
    const conditional = Number.isFinite(size) ? raw.slice(at + LEG_FIXED + 2, at + LEG_FIXED + 2 + size) : '';
    if (leg === 0) issue = issueOf(conditional);
    at += LEG_FIXED + 2 + (Number.isFinite(size) ? size : 0);

    const from = part.slice(7, 10).toUpperCase();
    const to = part.slice(10, 13).toUpperCase();
    const carrier = part.slice(13, 16).trim().toUpperCase() || null;
    const flightNumber = flightNumberOf(part.slice(16, 21));
    const day = /^\d{3}$/.test(part.slice(21, 24)) ? Number(part.slice(21, 24)) : null;
    const flownOn = day ? flightDate(day, issue, today) : null;
    if (AIRPORT.test(from) && AIRPORT.test(to) && from !== to && flownOn) flights.push({ from, to, carrier, flightNumber, flownOn });
  }
  return flights.length ? { flights } : null;
}
