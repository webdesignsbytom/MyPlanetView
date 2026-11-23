// "On this day" emails and email preferences (docs/API.md "Emails"): thin queries.
import { prisma } from '../prisma.js';

/**
 * Photos taken on this day in an earlier year, on maps their owners own, for owners who want
 * the email (an account with no profile row yet does: on by default), can get it (verified,
 * active) and haven't had one since `sentBefore`: one row a
 * photo, with its map, country name and a confirmed landmark's name. `days` is the day of the
 * month (28 and 29 on a 28 February in a year without a 29th).
 */
export const findOnThisDayCandidates = ({ month, days, before, sentBefore, limit = 5000 }) =>
  prisma.$queryRaw`
    SELECT u."id" AS "userId", u."email", u."name", p."id" AS "photoId", p."takenAt", p."countryCode",
      m."id" AS "mapId", m."name" AS "mapName", c."name" AS "countryName",
      (SELECT l."name" FROM "photo_landmark" pl JOIN "landmark" l ON l."id" = pl."landmarkId"
        WHERE pl."photoId" = p."id" AND pl."confirmed" ORDER BY l."name" LIMIT 1) AS "landmarkName"
    FROM "photo" p
    JOIN "travel_map" m ON m."id" = p."mapId"
    JOIN "user" u ON u."id" = m."ownerId"
    LEFT JOIN "profile" pr ON pr."userId" = u."id"
    LEFT JOIN "country" c ON c."code" = p."countryCode"
    WHERE p."kind" = 'PHOTO' AND p."hidden" = false AND p."takenAt" IS NOT NULL AND p."takenAt" < ${before}
      AND EXTRACT(MONTH FROM p."takenAt") = ${month} AND EXTRACT(DAY FROM p."takenAt") = ANY(${days}::int[])
      AND u."emailVerified" = true AND u."isActive" = true
      AND (pr."id" IS NULL OR (pr."onThisDayEmails" = true AND (pr."lastOnThisDayAt" IS NULL OR pr."lastOnThisDayAt" < ${sentBefore})))
    ORDER BY u."id"
    LIMIT ${limit}`;

/**
 * Moments dated to this day in an earlier year (`datePrecision` DAY, not hidden), on maps
 * their owners own, for the same owners as findOnThisDayCandidates: one row a moment, with
 * its map, country name and first photo (a visible photo, by its place in the moment), if any.
 */
export const findOnThisDayMomentCandidates = ({ month, days, before, sentBefore, limit = 5000 }) =>
  prisma.$queryRaw`
    SELECT u."id" AS "userId", u."email", u."name", mo."id" AS "momentId", mo."kind", mo."title", mo."happenedOn",
      m."id" AS "mapId", m."name" AS "mapName", c."name" AS "countryName",
      (SELECT p."id" FROM "moment_photo" mp JOIN "photo" p ON p."id" = mp."photoId"
        WHERE mp."momentId" = mo."id" AND p."kind" = 'PHOTO' AND p."hidden" = false
        ORDER BY mp."position", p."id" LIMIT 1) AS "photoId"
    FROM "moment" mo
    JOIN "travel_map" m ON m."id" = mo."mapId"
    JOIN "user" u ON u."id" = m."ownerId"
    LEFT JOIN "profile" pr ON pr."userId" = u."id"
    LEFT JOIN "country" c ON c."code" = mo."countryCode"
    WHERE mo."datePrecision" = 'DAY' AND mo."hidden" = false AND mo."happenedOn" < ${before}
      AND EXTRACT(MONTH FROM mo."happenedOn") = ${month} AND EXTRACT(DAY FROM mo."happenedOn") = ANY(${days}::int[])
      AND u."emailVerified" = true AND u."isActive" = true
      AND (pr."id" IS NULL OR (pr."onThisDayEmails" = true AND (pr."lastOnThisDayAt" IS NULL OR pr."lastOnThisDayAt" < ${sentBefore})))
    ORDER BY u."id"
    LIMIT ${limit}`;

/**
 * Claim the week's email for an account (so two runs never both send it). -> true when this
 * run may send
 */
export async function claimOnThisDayInDB(userId, { now, sentBefore }) {
  const { count } = await prisma.profile.updateMany({
    where: { userId, onThisDayEmails: true, OR: [{ lastOnThisDayAt: null }, { lastOnThisDayAt: { lt: sentBefore } }] },
    data: { lastOnThisDayAt: now },
  });
  if (count === 1) return true;
  if (await prisma.profile.findUnique({ where: { userId }, select: { id: true } })) return false;
  // No profile row yet (made on first use): made now, claimed; another run making it first wins
  try {
    await prisma.profile.create({ data: { userId, lastOnThisDayAt: now } });
    return true;
  } catch (err) {
    if (err?.code === 'P2002') return false;
    throw err;
  }
}

/** A photo's DISPLAY file, for the email's picture (null when the photo or file has gone). */
export const findMemoryPhotoKey = async (photoId) =>
  (
    await prisma.photoVariant.findFirst({
      where: { size: 'DISPLAY', photo: { id: photoId, kind: 'PHOTO' } },
      select: { media: { select: { key: true } } },
    })
  )?.media?.key ?? null;

/** An account's email preferences: "On this day" and "Welcome home" (`tripShare`). */
export const findEmailPreferences = async (userId) => {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { onThisDayEmails: true, tripShareEmails: true } });
  return { onThisDay: profile?.onThisDayEmails ?? true, tripShare: profile?.tripShareEmails ?? true };
};

/** Set the ones given (the profile made if it's missing). */
export function saveEmailPreferences(userId, { onThisDay, tripShare }) {
  const data = {
    ...(onThisDay === undefined ? {} : { onThisDayEmails: onThisDay }),
    ...(tripShare === undefined ? {} : { tripShareEmails: tripShare }),
  };
  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: { onThisDayEmails: true, tripShareEmails: true },
  });
}

/** The unsubscribe link: off, if the account is there. -> whether it was */
export async function turnOffOnThisDayInDB(userId) {
  try {
    await prisma.profile.upsert({ where: { userId }, create: { userId, onThisDayEmails: false }, update: { onThisDayEmails: false } });
    return true;
  } catch (err) {
    // An account that's gone (its id in an old email): nothing to change
    if (err?.code === 'P2003' || err?.code === 'P2025') return false;
    throw err;
  }
}
