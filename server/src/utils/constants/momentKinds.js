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

export const isMomentKind = (value) => typeof value === 'string' && MOMENT_KINDS.includes(value);
