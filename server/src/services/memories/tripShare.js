// "Welcome home" emails (docs/API.md "Emails"; 23 Nov 2026, the user's wish: remind people to
// share a trip the day after it ends, for word of mouth): run once a day with "On this day"
// (GET /api/emails/on-this-day/cron). Each account that wants them, with a trip that ended in
// the last week on a map it owns and no email for it yet, gets one email about the trip that
// ended last; its trips are claimed before it's sent, so two runs never both send it, and a
// trip is never in two emails. The button opens the map with the trip's "Welcome home" tag
// (?home=), which offers a picture of the trip for social media and the map's share link.
import { EMAIL_LISTS, unsubscribeToken } from '../../utils/onThisDay.js';
import {
  TRIP_SHARE_BUDGET_MS,
  TRIP_SHARE_MAX_EMAILS,
  pickTripToShare,
  tripDays,
  tripShareWindow,
  tripShareWords,
} from '../../utils/tripShare.js';
import { claimTripShareInDB, findTripShareCandidates } from '../../domain/tripShare.js';
import { sendMemoryEmail } from '../email/emailHandler.js';
import { FRONTEND_ORIGINS } from '../../utils/config.js';
import { BusinessName, BusinessSiteUrl, BusinessUrl, FrontendUrl, LogoUrl } from '../../utils/constants/siteConstants.js';

const siteOrigin = () => FRONTEND_ORIGINS[0] ?? FrontendUrl;
// The API's own address (better-auth's), for the one-click unsubscribe link
const apiOrigin = () => (process.env.BETTER_AUTH_URL || siteOrigin()).replace(/\/+$/, '');
const secret = () => process.env.BETTER_AUTH_SECRET;

const dayWords = (date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** The email's parts for one account's trip (for the template and the headers). */
export function tripShareEmail(trip, now = new Date()) {
  const words = tripShareWords({ title: trip.title, days: tripDays(trip.startDate, trip.endDate), places: trip.places, countryName: trip.countryName });
  const list = EMAIL_LISTS.tripShare;
  const u = encodeURIComponent(trip.userId);
  const t = unsubscribeToken(trip.userId, secret(), list);
  const oneClick = `${apiOrigin()}/api/emails/unsubscribe?u=${u}&t=${t}&l=${list}`;
  return {
    subject: words.subject,
    context: {
      title: words.subject,
      preheader: 'Share your trip with your friends: a picture for your socials, or your map’s link.',
      headline: words.headline,
      caption: words.caption,
      tripTitle: trip.title,
      mapName: trip.mapName,
      dates: trip.startDate ? `${dayWords(trip.startDate)} to ${dayWords(trip.endDate)}` : dayWords(trip.endDate),
      shareUrl: `${siteOrigin()}/maps/${encodeURIComponent(trip.mapId)}?home=${encodeURIComponent(trip.tripId)}`,
      unsubscribeUrl: `${siteOrigin()}/unsubscribe?u=${u}&t=${t}&l=${list}`,
      businessName: BusinessName,
      businessUrl: BusinessUrl,
      businessSiteUrl: BusinessSiteUrl,
      logoUrl: LogoUrl,
      year: now.getUTCFullYear(),
    },
    // One click in Gmail, Yahoo and others stops them (RFC 8058)
    headers: { 'List-Unsubscribe': `<${oneClick}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

/** Send today's. -> `{ accounts, sent, skipped, complete }` */
export async function sendTripShareEmails({ now = new Date(), budgetMs = TRIP_SHARE_BUDGET_MS, maxEmails = TRIP_SHARE_MAX_EMAILS } = {}) {
  const startedAt = Date.now();
  const rows = await findTripShareCandidates(tripShareWindow(now));
  const byUser = new Map();
  for (const row of rows) byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), row]);

  const totals = { accounts: byUser.size, sent: 0, skipped: 0, complete: true };
  for (const [, trips] of byUser) {
    if (Date.now() - startedAt > budgetMs || totals.sent >= maxEmails) {
      totals.complete = false;
      break;
    }
    if (!(await claimTripShareInDB(trips.map((trip) => trip.tripId), now))) {
      totals.skipped += 1;
      continue;
    }
    const trip = pickTripToShare(trips);
    const email = tripShareEmail(trip, now);
    const sent = await sendMemoryEmail(trip.email, email.subject, 'tripShareEmail', email.context, { headers: email.headers });
    if (sent) totals.sent += 1;
    else totals.skipped += 1;
  }
  return totals;
}
