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

// The cover by the map owner's plan (docs/API.md "Passport": `map.plan`): its class, its
// leather and foil (the passport-* utilities in index.css), and its extras: Business a
// blind-pressed frame, First Class a foil one and gilt page edges
const COVERS = {
  FREE: { label: 'Economy', look: 'passport-economy', frame: null },
  REGULAR: { label: 'Business Class', look: 'passport-business', frame: 'blind' },
  PREMIUM: { label: 'First Class', look: 'passport-first', frame: 'foil' },
};

/** The passport cover for a plan (`map.plan`), Economy's when it's missing. */
export const passportCover = (plan) => COVERS[plan?.id] || COVERS.FREE;

// The colours a cover's leather can be chosen in (26 Nov 2026, the user's wish: "just the cover
// colour, and gold or silver lettering stays tied to the plan"; docs/API.md "Passport"), the
// server's PASSPORT_COLOURS (server/src/utils/passportCovers.js; a test compares them), each a
// --cover-* token in index.css. Each plan's own is one of them
export const COVER_COLOURS = Object.freeze([
  { id: 'BURGUNDY', label: 'Burgundy', token: '--cover-burgundy' },
  { id: 'NAVY', label: 'Navy', token: '--cover-navy' },
  { id: 'BLACK', label: 'Black', token: '--cover-black' },
  { id: 'GREEN', label: 'Green', token: '--cover-green' },
  { id: 'BLUE', label: 'Blue', token: '--cover-blue' },
  { id: 'TAN', label: 'Tan', token: '--cover-tan' },
]);
const PLAN_COVER_COLOUR = { FREE: 'BURGUNDY', REGULAR: 'NAVY', PREMIUM: 'BLACK' };

/** The colour a plan's cover comes in, when none is chosen ('BURGUNDY' for Economy). */
export const planCoverColour = (plan) => PLAN_COVER_COLOUR[plan?.id] || PLAN_COVER_COLOUR.FREE;

/**
 * The leather of a cover in a chosen colour (`map.passportColour`): a style setting the board's
 * colour (--board) over the plan's, its foil untouched; undefined for the plan's own.
 */
export function coverBoard(colour) {
  const found = COVER_COLOURS.find((c) => c.id === colour);
  return found ? { '--board': `var(${found.token})` } : undefined;
}

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

/** The index of a place's visa page among the book's leaves, or -1 (none, or no place). */
export const visaLeafIndex = (leaves, countryCode) =>
  countryCode ? leaves.findIndex((leaf) => leaf.kind === 'visa' && leaf.page.countryCode === countryCode) : -1;

// The book's height on a wide screen, in pixels (26 Nov 2026, the audit: a 40rem book under
// the page's title card went under its page bar on a 1440×900 screen, the cover's foot
// hidden until a scroll, and on a 720-pixel screen the book and bar never fitted at all)
export const BOOK_MAX_PX = 640; // 40rem, as it was
export const BOOK_MIN_PX = 448; // 28rem: smaller, a spread's pages get cramped
const BOOK_GAP_PX = 16; // between the book and its bar (gap-4)
const BAR_MARGIN_PX = 8; // the bar's own gap from the screen's foot (bottom-2)

/**
 * As tall as fits between the book's top (`top`, from the page's top) and its page bar
 * (`bar` tall, kept at the screen's foot) on the first view, between BOOK_MIN_PX and
 * BOOK_MAX_PX; and never so tall that, scrolled to, the book and its bar don't both fit on
 * a `viewport`-tall screen.
 */
export function bookFitHeight({ viewport, top, bar }) {
  const room = viewport - bar - BOOK_GAP_PX - BAR_MARGIN_PX;
  const most = Math.min(BOOK_MAX_PX, room - BAR_MARGIN_PX);
  const firstView = room - top;
  return Math.max(240, Math.round(Math.max(Math.min(BOOK_MIN_PX, most), Math.min(most, firstView))));
}

/** "1 photo", "3 photos". */
export const photoCountText = (count) => `${count} photo${count === 1 ? '' : 's'}`;

/**
 * What a screen reader hears for a stamp: its name, date, UNESCO and how many photos, or
 * for a landmark ticked "been here" with no photo (23 Nov 2026), that it was ticked.
 */
export function stampDescription(stamp) {
  return [
    stamp.name,
    stamp.stampedOn ? `stamped ${formatDay(stamp.stampedOn)}` : 'stamped',
    stamp.isUnesco ? 'UNESCO World Heritage Site' : null,
    stamp.ticked && !stamp.photo ? 'ticked as been here, no photo yet' : photoCountText(stamp.photoCount),
  ]
    .filter(Boolean)
    .join(', ');
}
