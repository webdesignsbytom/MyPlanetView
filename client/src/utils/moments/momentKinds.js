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
  // 21 Nov 2026 (the user's wish, "anniversaries as moments"): a first trip (a child's
  // first trip abroad, a couple's first holiday) and an anniversary celebrated somewhere
  'FIRST_TRIP',
  'ANNIVERSARY',
  // 23 Nov 2026 (the user's wish, "events within trips": a safari day on a trip to Kenya):
  // what a day on a trip was for. A trip's page lists its moments day by day.
  'SAFARI',
  'HIKE',
  'DIVE',
  'TOUR',
  'MEAL',
  'SHOW',
  'BEACH',
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
  FIRST_TRIP: 'First trip',
  ANNIVERSARY: 'Anniversary',
  SAFARI: 'Safari',
  HIKE: 'Hike or trek',
  DIVE: 'Dive or snorkel',
  TOUR: 'Tour or day trip',
  MEAL: 'A meal to remember',
  SHOW: 'Show, concert or festival',
  BEACH: 'Beach day',
});

// The kinds for a day on a trip (23 Nov 2026): a trip's moment form lists them first
export const TRIP_DAY_KINDS = Object.freeze(['SAFARI', 'HIKE', 'DIVE', 'TOUR', 'MEAL', 'SHOW', 'BEACH', 'SAW_OR_DID']);

export const MOMENT_KIND_OPTIONS = MOMENT_KINDS.map((kind) => ({ value: kind, label: MOMENT_KIND_LABELS[kind] }));

// A trip's moment form: the day's kinds first, then the rest (GroupedOptionSelect's groups)
export const TRIP_MOMENT_KIND_GROUPS = Object.freeze([
  { label: 'A day on the trip', options: TRIP_DAY_KINDS.map((kind) => ({ value: kind, label: MOMENT_KIND_LABELS[kind] })) },
  { label: 'Life events', options: MOMENT_KIND_OPTIONS.filter((option) => !TRIP_DAY_KINDS.includes(option.value)) },
]);

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
