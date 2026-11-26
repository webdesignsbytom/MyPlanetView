// The first visit a status change brings (24 Nov 2026, the user's wish: "if I check a new country
// as visited, the date I do that on should be put in the date visited"): a place newly marked
// visited or lived in, by hand from its ticket or the country list, starts with today's date,
// which its ticket's "First went" shows and can change. A place with a date keeps it, and
// "Where have you been?" (past travels, many at once) never dates them.
import { countsAsVisited } from './visitStatus';
import { todayDay } from './celebrations';

/**
 * The `firstVisitedOn` to send with a status change: the visit's own, else today for a place
 * going into visited or lived in from neither (`visit` its row before, or none), else undefined.
 */
export const firstVisitFor = (visit, nextStatus, today = todayDay()) =>
  visit?.firstVisitedOn || (countsAsVisited(nextStatus) && !countsAsVisited(visit?.status) ? today : undefined);
