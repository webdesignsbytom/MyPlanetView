// "On this day" emails (docs/API.md "Emails"; 21 Nov 2026, the user's wish): run once a day by
// Vercel's cron (GET /api/emails/on-this-day/cron). Each account that wants them and has a
// photo taken on this day in an earlier year, on a map it owns, gets one email with one such
// photo, at most once a week; a moment dated to this day (a wedding, a birth) comes first,
// with its first photo if it has one ("anniversaries as moments", the same day). The week's email is claimed before it's sent, so two runs never
// both send it. The picture and the unsubscribe link are signed links (utils/onThisDay.js).
import {
  ON_THIS_DAY_BUDGET_MS,
  ON_THIS_DAY_GAP_MS,
  ON_THIS_DAY_MAX_EMAILS,
  anniversaryOf,
  anniversaryWords,
  memoryWords,
  photoLinkToken,
  pickAnniversary,
  pickMemory,
  unsubscribeToken,
} from '../../utils/onThisDay.js';
import { claimOnThisDayInDB, findOnThisDayCandidates, findOnThisDayMomentCandidates } from '../../domain/onThisDay.js';
import { sendMemoryEmail } from '../email/emailHandler.js';
import { FRONTEND_ORIGINS } from '../../utils/config.js';
import { BusinessName, BusinessSiteUrl, BusinessUrl, FrontendUrl, LogoUrl } from '../../utils/constants/siteConstants.js';

const siteOrigin = () => FRONTEND_ORIGINS[0] ?? FrontendUrl;
// The API's own address (better-auth's), for the picture and one-click unsubscribe links
const apiOrigin = () => (process.env.BETTER_AUTH_URL || siteOrigin()).replace(/\/+$/, '');
const secret = () => process.env.BETTER_AUTH_SECRET;

const dayWords = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * The email's parts for one account's memory (for the template and the headers): a photo
 * (`takenAt`), or a moment's anniversary (`momentId`, `happenedOn`, `title`, maybe `photoId`).
 */
export function onThisDayEmail(memory, now = new Date()) {
  const day = memory.momentId ? memory.happenedOn : memory.takenAt;
  const years = now.getUTCFullYear() - new Date(day).getUTCFullYear();
  const words = memory.momentId
    ? anniversaryWords({ years, title: memory.title, countryName: memory.countryName })
    : memoryWords({ years, landmarkName: memory.landmarkName, countryName: memory.countryName, mapName: memory.mapName });
  const u = encodeURIComponent(memory.userId);
  const t = unsubscribeToken(memory.userId, secret());
  const oneClick = `${apiOrigin()}/api/emails/unsubscribe?u=${u}&t=${t}`;
  return {
    subject: words.subject,
    context: {
      title: words.subject,
      preheader: words.headline,
      headline: words.headline,
      caption: words.caption,
      mapName: memory.mapName,
      takenOn: dayWords(day),
      // A moment with no photo has none (the template leaves the picture out)
      photoUrl: memory.photoId
        ? `${apiOrigin()}/api/emails/photos/${encodeURIComponent(memory.photoId)}?t=${photoLinkToken(memory.photoId, secret())}`
        : null,
      mapUrl: `${siteOrigin()}/maps/${encodeURIComponent(memory.mapId)}`,
      unsubscribeUrl: `${siteOrigin()}/unsubscribe?u=${u}&t=${t}`,
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
export async function sendOnThisDayEmails({ now = new Date(), budgetMs = ON_THIS_DAY_BUDGET_MS, maxEmails = ON_THIS_DAY_MAX_EMAILS } = {}) {
  const startedAt = Date.now();
  const sentBefore = new Date(now.getTime() - ON_THIS_DAY_GAP_MS);
  const day = anniversaryOf(now);
  const [rows, momentRows] = await Promise.all([
    findOnThisDayCandidates({ ...day, sentBefore }),
    findOnThisDayMomentCandidates({ ...day, sentBefore }),
  ]);
  const byUser = new Map();
  for (const row of rows) byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), row]);
  const momentsOf = new Map();
  for (const row of momentRows) {
    momentsOf.set(row.userId, [...(momentsOf.get(row.userId) ?? []), row]);
    if (!byUser.has(row.userId)) byUser.set(row.userId, []);
  }

  const seed = now.toISOString().slice(0, 10);
  const totals = { accounts: byUser.size, sent: 0, skipped: 0, complete: true };
  for (const [userId, photos] of byUser) {
    if (Date.now() - startedAt > budgetMs || totals.sent >= maxEmails) {
      totals.complete = false;
      break;
    }
    if (!(await claimOnThisDayInDB(userId, { now, sentBefore }))) {
      totals.skipped += 1;
      continue;
    }
    // A moment's anniversary first, else a photo
    const memory = pickAnniversary(momentsOf.get(userId), `${seed}:${userId}`) ?? pickMemory(photos, `${seed}:${userId}`);
    const email = onThisDayEmail(memory, now);
    const sent = await sendMemoryEmail(memory.email, email.subject, 'onThisDayEmail', email.context, { headers: email.headers });
    if (sent) totals.sent += 1;
    else totals.skipped += 1;
  }
  return totals;
}
