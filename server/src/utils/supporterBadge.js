// The supporter badge (docs/API.md "The supporter badge"; 24 Nov 2026, the user's wish): a small
// mark on the banner of a paying member's maps, Business or First Class, seen by everyone who
// opens them, share links too, so every shared map shows off the paid plans. It's the owner's
// account plan (a free extra map of a First Class member still shows First Class), and it's on
// unless the owner turns it off (`showSupporterBadge` in their map settings, as the map's style
// is read from them). Pure, so it's unit-tested; the client keeps a copy for the mock.
import { PAID_PLAN_IDS, planOf } from './constants/plans.js';

/**
 * The badge a map's reply carries: `{ plan, name, shown }`, or null when the owner doesn't
 * pay. The owner always gets it (`shown` says whether others see it), so their own switch can
 * show it at once; anyone else only while it's shown.
 */
export function supporterBadge({ accountPlan, ownerSettings, role }) {
  if (!PAID_PLAN_IDS.includes(accountPlan)) return null;
  const settings = ownerSettings && typeof ownerSettings === 'object' ? ownerSettings : {};
  const shown = settings.showSupporterBadge !== false;
  if (!shown && role !== 'OWNER') return null;
  return { plan: accountPlan, name: planOf(accountPlan).name, shown };
}
