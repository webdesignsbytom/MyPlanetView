// Display names (better-auth's `user.name`) appear in emails other people receive,
// such as share emails, so they're kept to one plain line: no control or
// bidi-override characters, single spaces, trimmed, and at most 80 characters.
export const DISPLAY_NAME_MAX = 80;

// C0 and C1 controls (CR, LF and tab included) and DEL, the line and paragraph
// separators, and the bidi embedding, override and isolate controls (they can make
// the rest of a line read backwards)
const UNSAFE_CHARS = /[\p{Cc}\u{2028}\u{2029}\u{202A}-\u{202E}\u{2066}-\u{2069}]/gu;

/** The cleaned name, or '' when nothing usable is left (or it isn't a string). */
export function cleanDisplayName(value) {
  if (typeof value !== 'string') return '';
  const oneLine = value.replace(UNSAFE_CHARS, ' ').replace(/\s+/g, ' ').trim();
  // By code point, so a character outside the BMP (an emoji) is never cut in half
  return Array.from(oneLine).slice(0, DISPLAY_NAME_MAX).join('').trim();
}
