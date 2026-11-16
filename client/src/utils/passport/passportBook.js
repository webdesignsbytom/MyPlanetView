// The passport (docs/API.md, "Passport"; docs/FEATURE-PLAN.md, "The passport"): how its
// stamps look, and the order of its pages.
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';

/**
 * A stable number from a string (FNV-1a, then MurmurHash3's finaliser so every bit depends
 * on every character: FNV's low bits alone gave all of Italy's stamps the same shape), so
 * the same landmark always gets the same stamp.
 */
export function hashOf(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export const GROUP_LABELS = { SOLO: 'Solo', COUPLE: 'Couple', FAMILY: 'Family' };

export const STAMP_SHAPES = ['circle', 'oval', 'rectangle', 'triangle'];
// Theme inks that read on the passport's cream pages in light and dark mode
const INKS = ['text-colour6', 'text-colour7', 'text-colour9', 'text-status-good'];

/** A stamp's shape, tilt (−10° to 10°) and ink, from its landmark's (or country's) id. */
export function stampLook(id) {
  const hash = hashOf(id);
  return {
    shape: STAMP_SHAPES[hash % STAMP_SHAPES.length],
    tilt: ((hash >>> 4) % 21) - 10,
    ink: INKS[(hash >>> 9) % INKS.length],
  };
}

/** A stamp's date as a rubber stamp prints it: "12 APR 2019". */
export const stampDate = (value) => (value ? formatDay(value).toUpperCase() : '');

/**
 * The book's pages, in order: the cover, the travellers' photo page, a visa page per
 * country (in the API's order: first visited first), and the totals at the back.
 * Each is `{ key, kind, label, page? }`; `label` names it in the page list.
 */
export function bookLeaves(passport) {
  return [
    { key: 'cover', kind: 'cover', label: 'Cover' },
    { key: 'travellers', kind: 'travellers', label: 'Travellers' },
    ...passport.pages.map((page) => ({ key: `visa-${page.countryCode}`, kind: 'visa', label: countryName(page.countryCode), page })),
    { key: 'totals', kind: 'totals', label: 'Totals' },
  ];
}

/** "1 photo", "3 photos". */
export const photoCountText = (count) => `${count} photo${count === 1 ? '' : 's'}`;

/** What a screen reader hears for a stamp: its name, date, UNESCO and how many photos. */
export function stampDescription(stamp) {
  return [
    stamp.name,
    stamp.stampedOn ? `stamped ${formatDay(stamp.stampedOn)}` : 'stamped',
    stamp.isUnesco ? 'UNESCO World Heritage Site' : null,
    photoCountText(stamp.photoCount),
  ]
    .filter(Boolean)
    .join(', ');
}
