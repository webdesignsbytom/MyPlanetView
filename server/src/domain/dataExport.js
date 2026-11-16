// "Download my data" (docs/API.md "Your data"): the rows behind the file, read flat and
// side by side. utils/dataExport.js shapes them. Every read is the caller's own: their
// account, a map they own (the controller checks), or photos they uploaded.
import { prisma } from '../prisma.js';

/** The account part: who they are, their plan, and the maps and trips they're on. */
export async function findAccountForExport(userId) {
  const [user, profile, subscription, grants, ownedMaps, mapMemberships, tripMemberships, photosOnOtherMaps, avatar] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, emailVerified: true, createdAt: true } }),
    prisma.profile.findUnique({
      where: { userId },
      select: { username: true, homeCountryCode: true, mapSettings: true, promoTrialUsedAt: true, promoCode: { select: { code: true } } },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, interval: true, status: true, extraMaps: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, createdAt: true },
    }),
    prisma.planGrant.findMany({ where: { userId }, select: { plan: true, startsAt: true, endsAt: true, reason: true }, orderBy: { startsAt: 'asc' } }),
    prisma.travelMap.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, isDefault: true, createdAt: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.mapMember.findMany({
      where: { userId },
      select: { role: true, createdAt: true, map: { select: { id: true, name: true, owner: { select: { name: true } } } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tripMember.findMany({
      where: { userId },
      select: { role: true, createdAt: true, trip: { select: { id: true, title: true, map: { select: { name: true, owner: { select: { name: true } } } } } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.photo.count({ where: { uploaderId: userId, map: { ownerId: { not: userId } } } }),
    prisma.avatarMediaItem.findUnique({ where: { userId }, select: { media: { select: { key: true } } } }),
  ]);
  return { user, profile, subscription, grants, ownedMaps, mapMemberships, tripMemberships, photosOnOtherMaps, avatarKey: avatar?.media?.key ?? null };
}

/** Who owns a map: -> its ownerId, or null when there's no such map. */
export const findMapOwnerId = async (mapId) =>
  (await prisma.travelMap.findUnique({ where: { id: mapId }, select: { ownerId: true } }))?.ownerId ?? null;

const PLACE = { landmarkId: true, landmark: { select: { name: true } }, placeName: true };

/** Everything on one map apart from its photos (they come a page at a time). */
export async function findMapForExport(mapId) {
  const onMap = { mapId };
  const onMapsTrips = { trip: { mapId } };
  const [map, travellers, visits, members, invites, trips, stops, tripTravellers, tripMembers, tripInvites, tripLinks, moments, momentTravellers, momentPhotos, goals, badges, stampPhotos, photoCount] =
    await Promise.all([
      prisma.travelMap.findUnique({
        where: { id: mapId },
        select: { id: true, name: true, groupType: true, isDefault: true, splitUk: true, linkAccess: true, shareCode: true, graceUntil: true, createdAt: true, updatedAt: true },
      }),
      prisma.traveller.findMany({
        where: onMap,
        select: { id: true, name: true, position: true, userId: true, birthCountryCode: true, favouriteCountryCode: true, createdAt: true },
        orderBy: { position: 'asc' },
      }),
      prisma.countryVisit.findMany({
        where: onMap,
        select: { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true, createdAt: true, updatedAt: true },
        orderBy: { countryCode: 'asc' },
      }),
      prisma.mapMember.findMany({ where: onMap, select: { role: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }),
      prisma.shareInvite.findMany({ where: onMap, select: { email: true, role: true, expiresAt: true, acceptedAt: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
      prisma.trip.findMany({
        where: onMap,
        select: { id: true, title: true, description: true, status: true, startDate: true, endDate: true, linkAccess: true, shareCode: true, coverPhotoId: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.tripStop.findMany({
        where: onMapsTrips,
        select: { id: true, tripId: true, position: true, countryCode: true, ...PLACE, arriveOn: true, leaveOn: true, notes: true },
        orderBy: [{ tripId: 'asc' }, { position: 'asc' }],
      }),
      prisma.tripTraveller.findMany({ where: onMapsTrips, select: { tripId: true, travellerId: true } }),
      prisma.tripMember.findMany({ where: onMapsTrips, select: { tripId: true, role: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }),
      prisma.shareInvite.findMany({ where: onMapsTrips, select: { tripId: true, email: true, role: true, expiresAt: true, acceptedAt: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
      prisma.tripMap.findMany({ where: onMap, select: { addedAt: true, trip: { select: { id: true, title: true, map: { select: { name: true } } } } }, orderBy: { addedAt: 'asc' } }),
      prisma.moment.findMany({
        where: onMap,
        select: { id: true, kind: true, title: true, text: true, happenedOn: true, datePrecision: true, countryCode: true, ...PLACE, tripId: true, hidden: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.momentTraveller.findMany({ where: { moment: onMap }, select: { momentId: true, travellerId: true } }),
      prisma.momentPhoto.findMany({ where: { moment: onMap }, select: { momentId: true, photoId: true, position: true }, orderBy: { position: 'asc' } }),
      prisma.goal.findMany({
        where: onMap,
        select: { id: true, kind: true, title: true, target: true, countryCodes: true, region: true, deadline: true, achievedAt: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.badgeAward.findMany({ where: onMap, select: { badgeKey: true, earnedAt: true }, orderBy: { earnedAt: 'asc' } }),
      prisma.landmarkCover.findMany({ where: onMap, select: { landmarkId: true, photoId: true, landmark: { select: { name: true } } } }),
      prisma.photo.count({ where: onMap }),
    ]);
  return { map, travellers, visits, members, invites, trips, stops, tripTravellers, tripMembers, tripInvites, tripLinks, moments, momentTravellers, momentPhotos, goals, badges, stampPhotos, photoCount };
}

const PHOTO_EXPORT_SELECT = {
  id: true,
  mapId: true,
  kind: true,
  caption: true,
  takenAt: true,
  countryCode: true,
  tripId: true,
  latitude: true,
  longitude: true,
  durationS: true,
  videoState: true,
  hidden: true,
  width: true,
  height: true,
  createdAt: true,
  uploaderId: true,
  uploader: { select: { name: true } },
  variants: { select: { size: true, width: true, height: true, media: { select: { key: true, contentType: true, bytes: true } } } },
  landmarks: { select: { landmarkId: true, source: true, confirmed: true, confirmedAt: true, distanceM: true, landmark: { select: { name: true } } } },
};

// Newest upload first, keyset on (createdAt, id): the [mapId, createdAt desc, id desc] index
const afterCursor = (cursor) =>
  cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {};
const NEWEST_FIRST = [{ createdAt: 'desc' }, { id: 'desc' }];

/** A page of a map's photos (one more than `take`, to tell whether there's another). */
export const findMapPhotosForExport = (mapId, { cursor, take }) =>
  prisma.photo.findMany({ where: { mapId, ...afterCursor(cursor) }, orderBy: NEWEST_FIRST, take: take + 1, select: PHOTO_EXPORT_SELECT });

/** A page of the photos someone added to maps they don't own (one more than `take`). */
export const findUploadsElsewhereForExport = (userId, { cursor, take }) =>
  prisma.photo.findMany({
    where: { uploaderId: userId, map: { ownerId: { not: userId } }, ...afterCursor(cursor) },
    orderBy: NEWEST_FIRST,
    take: take + 1,
    select: { ...PHOTO_EXPORT_SELECT, map: { select: { name: true, owner: { select: { name: true } } } } },
  });
