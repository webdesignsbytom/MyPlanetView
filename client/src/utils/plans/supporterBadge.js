// The supporter badge (docs/API.md "The supporter badge"; 24 Nov 2026, the user's wish): a
// paying member's plan, Business or First Class, on the banner of their maps, for everyone who
// opens them, share links too, so every shared map shows off the paid plans. On unless the
// owner turns it off (the map setting `showSupporterBadge`, in Settings).
import { PAID_PLAN_IDS, planOf } from '@/utils/constants/plans';

/**
 * The server's rule (server/src/utils/supporterBadge.js), for the mock: `{ plan, name, shown }`
 * or null. The owner always gets it, so their own switch shows it at once; anyone else only
 * while it's shown.
 */
export function supporterBadge({ accountPlan, ownerSettings, role }) {
  if (!PAID_PLAN_IDS.includes(accountPlan)) return null;
  const settings = ownerSettings && typeof ownerSettings === 'object' ? ownerSettings : {};
  const shown = settings.showSupporterBadge !== false;
  if (!shown && role !== 'OWNER') return null;
  return { plan: accountPlan, name: planOf(accountPlan).name, shown };
}

/**
 * The badge to draw on this map's banner, or null. The owner's own view follows their switch
 * as it is now (their settings), so turning it off or on shows at once; anyone else, and the
 * owner through a share link, sees what the server says. `role`: the viewer's (the page's),
 * else the map reply's.
 */
export function shownSupporter(map, settings, { role = map?.role, shareCode = null } = {}) {
  const supporter = map?.supporter;
  if (!supporter || !PAID_PLAN_IDS.includes(supporter.plan)) return null;
  if (role === 'OWNER' && !shareCode) return settings?.showSupporterBadge === false ? null : supporter;
  return supporter.shown === false ? null : supporter;
}

/**
 * The plan as a class of travel: "Business Class", "First Class" (25 Nov 2026, the user's
 * wish: the badge said "Business member").
 */
export const supporterClass = (supporter) => {
  const name = planOf(supporter.plan).name;
  return /\bClass$/.test(name) ? name : `${name} Class`;
};

/** What the badge says: "Business Class member", "First Class member". */
export const supporterWords = (supporter) => `${supporterClass(supporter)} member`;

/** Its link's name: where it goes, and that it opens a new tab. */
export const supporterLinkLabel = (supporter) => `${supporterWords(supporter)}. About our plans (opens in a new tab)`;

/** The passport cover the badge is made of: First Class black and gold, Business navy and silver. */
export const supporterCover = (supporter) => (supporter.plan === 'PREMIUM' ? 'passport-first' : 'passport-business');
