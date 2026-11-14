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
