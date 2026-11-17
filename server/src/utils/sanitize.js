// Input sanitization (normalize, strip tags, cap length)

const HTML_TAG_PATTERN = new RegExp('<[^>]*>', 'g');
const CONTROL_CHAR_CODES = [
  ...Array.from({ length: 9 }, (_, i) => i), // 0x00-0x08
  11, 12, // 0x0B, 0x0C
  ...Array.from({ length: 18 }, (_, i) => 14 + i), // 0x0E-0x1F
  127, // DEL
];
const CONTROL_CHAR_PATTERN = new RegExp(
  `[${CONTROL_CHAR_CODES.map((c) => `\\u${c.toString(16).padStart(4, '0')}`).join('')}]`,
  'g'
);

export function sanitizeText(value, { maxLength = 2000 } = {}) {
  if (value == null) return null;

  const stripped = String(value)
    .replace(HTML_TAG_PATTERN, '')
    .replace(CONTROL_CHAR_PATTERN, '')
    .trim();

  return stripped.slice(0, maxLength) || null;
}

export function sanitizeEmail(value, { maxLength = 320 } = {}) {
  const str = sanitizeText(value, { maxLength });
  return str ? str.toLowerCase() : null;
}

// An address we may write to (e.g. a reply-to): one local part, one @, a dotted
// domain, and none of the characters that would quote or split it in a mail header
const EMAIL_ADDRESS = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]+$/;
// Control characters are what it looks for
// eslint-disable-next-line no-control-regex
const ANY_CONTROL_CHAR = new RegExp('[\\u0000-\\u001F\\u007F]');
export const EMAIL_MAX_LENGTH = 254;

/**
 * A valid email address, trimmed and lower-cased, or null. Unlike sanitizeEmail it
 * never edits the address (stripping tags or truncating could turn junk into some
 * other real address): anything that isn't already a plain address is refused.
 */
export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > EMAIL_MAX_LENGTH || ANY_CONTROL_CHAR.test(email)) return null;
  return EMAIL_ADDRESS.test(email) ? email : null;
}

export function clampInt(value, { min, max, fallback }) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function coerceBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (value === 'false' || value === false || value === '0') return false;
  if (value === 'true' || value === true || value === '1') return true;
  return fallback;
}
