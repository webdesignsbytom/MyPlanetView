// A country's note on a map (`notes` on its visit; docs/API.md "Countries visited"): one
// free-text box for a plan or a reminder ("Cherry blossom is in early April"). Something
// that happened is a moment instead.
import { serverText } from '@/utils/regex/regex';

// The server's NOTES_MAX (server/src/utils/travelValidation.js)
export const NOTES_MAX = 1000;

/** What the server keeps of a note: no tags or control characters, trimmed, cut to 1,000; null when empty. */
export const cleanNote = (value) => serverText(value).slice(0, NOTES_MAX) || null;
