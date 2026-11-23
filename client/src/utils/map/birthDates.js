// A traveller's optional date of birth (23 Nov 2026, the user's wish; docs/API.md
// "Travellers"): the server's rule (utils/travelValidation.js parseBirthDate), from 1900 up to
// today, and the words for the share of a life spent away. Pure.

export const BIRTH_DATE_MIN = '1900-01-01';

/** Today as a date input's value ("YYYY-MM-DD"), in this browser's own day. */
export function todayInput(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The share of a life spent away, in words: "3.1% of their life", "under 0.1% of their life"
 * for a share that rounds to nothing, or null when there's none to give (no date of birth).
 */
export function lifeShareWords(share) {
  if (share === null || share === undefined) return null;
  if (share === 0) return 'under 0.1% of their life';
  return `${share.toLocaleString('en-GB', { maximumFractionDigits: 1 })}% of their life`;
}
