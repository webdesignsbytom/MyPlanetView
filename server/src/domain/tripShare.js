// "Welcome home" emails (docs/API.md "Emails"): thin queries.
import { prisma } from '../prisma.js';

const dayText = (date) => date.toISOString().slice(0, 10);

/**
 * Trips that ended between `from` and `to` (UTC days, both included) whose email hasn't gone,
 * on maps whose owners want it (an account with no profile row yet does: on by default) and
 * can get it (verified, active): one row a trip, with its map, how many countries its stops are
 * in and its first stop's country name. Uses the trip's `endDate` index. The days go as text
 * cast to dates, so the database's time zone never moves them.
 */
export const findTripShareCandidates = ({ from, to, limit = 5000 }) =>
  prisma.$queryRaw`
    SELECT u."id" AS "userId", u."email", t."id" AS "tripId", t."title", t."startDate", t."endDate",
      m."id" AS "mapId", m."name" AS "mapName",
      (SELECT COUNT(DISTINCT s."countryCode")::int FROM "trip_stop" s WHERE s."tripId" = t."id") AS "places",
      (SELECT c."name" FROM "trip_stop" s JOIN "country" c ON c."code" = s."countryCode"
        WHERE s."tripId" = t."id" ORDER BY s."position", s."id" LIMIT 1) AS "countryName"
    FROM "trip" t
    JOIN "travel_map" m ON m."id" = t."mapId"
    JOIN "user" u ON u."id" = m."ownerId"
    LEFT JOIN "profile" pr ON pr."userId" = u."id"
    WHERE t."endDate" >= ${dayText(from)}::date AND t."endDate" <= ${dayText(to)}::date AND t."shareReminderSentAt" IS NULL
      AND u."emailVerified" = true AND u."isActive" = true
      AND (pr."id" IS NULL OR pr."tripShareEmails" = true)
    ORDER BY u."id", t."endDate" DESC, t."id"
    LIMIT ${limit}`;

/**
 * Claim one account's trips (so two runs never both send, and the account gets one email
 * however many of its trips just ended). -> how many this run claimed: none means another run
 * already has them
 */
export async function claimTripShareInDB(tripIds, now) {
  const { count } = await prisma.trip.updateMany({
    where: { id: { in: tripIds }, shareReminderSentAt: null },
    data: { shareReminderSentAt: now },
  });
  return count;
}

/** The unsubscribe link: off, if the account is there. -> whether it was */
export async function turnOffTripShareInDB(userId) {
  try {
    await prisma.profile.upsert({ where: { userId }, create: { userId, tripShareEmails: false }, update: { tripShareEmails: false } });
    return true;
  } catch (err) {
    // An account that's gone (its id in an old email): nothing to change
    if (err?.code === 'P2003' || err?.code === 'P2025') return false;
    throw err;
  }
}
