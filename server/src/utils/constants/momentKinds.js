// The kinds of moment (docs/FEATURE-PLAN.md "Moments"). A kind sets the moment's stamp
// and wording in the client. Stored as text and checked against this list, not a
// Prisma enum, so adding a kind needs no migration (add it at the end; never rename one
// that's in use). The client keeps a copy: change both together.

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

export const isMomentKind = (value) => typeof value === 'string' && MOMENT_KINDS.includes(value);
