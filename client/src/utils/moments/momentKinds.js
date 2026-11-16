// Moments: life events and notes on a map (docs/API.md "Moments"). The kinds are a copy of
// the server's (server/src/utils/constants/momentKinds.js): change both together, and add
// a new kind at the end of both. Each kind has its stamp (components/moments/MomentStamp.jsx).

export const MOMENT_KINDS = Object.freeze([
  'BORN',
  'MOVED_HERE',
  'WEDDING',
  'ENGAGEMENT',
  'GRADUATED',
  'NEW_JOB',
  'MET_SOMEONE',
  'CELEBRATION',
  // "We saw a volcano": the general kind
  'SAW_OR_DID',
]);

export const MOMENT_KIND_LABELS = Object.freeze({
  BORN: 'Born',
  MOVED_HERE: 'Moved here',
  WEDDING: 'Wedding',
  ENGAGEMENT: 'Engagement',
  GRADUATED: 'Graduated',
  NEW_JOB: 'New job',
  MET_SOMEONE: 'Met someone',
  CELEBRATION: 'Celebration',
  SAW_OR_DID: 'Something we saw or did',
});

export const MOMENT_KIND_OPTIONS = MOMENT_KINDS.map((kind) => ({ value: kind, label: MOMENT_KIND_LABELS[kind] }));

export const isMomentKind = (value) => typeof value === 'string' && MOMENT_KINDS.includes(value);

/** The status a moment suggests for a country with none yet: a birth or a move, Lived; anything else, Visited. */
export const statusForKind = (kind) => (kind === 'BORN' || kind === 'MOVED_HERE' ? 'LIVED' : 'VISITED');

// The server's limits (server/src/utils/moments.js)
export const MOMENT_TITLE_MAX = 120;
export const MOMENT_TEXT_MAX = 2000;
export const MOMENT_PLACE_MAX = 120;
// Chosen from the map's existing photos (nothing is uploaded)
export const MOMENT_PHOTOS_MAX = 20;
export const MOMENT_PAGE_DEFAULT = 30;
export const MOMENT_PAGE_MAX = 60;
