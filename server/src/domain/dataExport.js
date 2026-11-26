// "Download my data" (docs/API.md "Your data"): the rows behind the file, read flat and
// side by side. utils/dataExport.js shapes them. Every read is the caller's own: their
// account, a map they own (the controller checks), or photos they uploaded.
import { prisma } from '../prisma.js';

/** The account part: who they are, their plan, and the maps and trips they're on. */
export async function findAccountForExport(userId) {
  const [user, profile, subscription, grants, ownedMaps, mapMemberships, tripMemberships, photosOnOtherMaps, avatar, giftsBought, referralCode, referralRewards] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, emailVerified: true, createdAt: true } }),
    prisma.profile.findUnique({
      where: { userId },
      select: { username: true, homeCountryCode: true, mapSettings: true, onThisDayEmails: true, tripShareEmails: true, promoTrialUsedAt: true, promoCode: { select: { code: true } } },
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
    prisma.photo.count({ where: uploadsElsewhere(userId) }),
    prisma.avatarMediaItem.findUnique({ where: { userId }, select: { media: { select: { key: true } } } }),
    // Gifts they bought (docs/API.md "Gifts"), paid for
    prisma.giftCode.findMany({
      where: { buyerId: userId, paidAt: { not: null } },
      select: { code: true, plan: true, months: true, amountPence: true, toName: true, message: true, paidAt: true, redeemedAt: true, refundedAt: true },
      orderBy: { paidAt: 'asc' },
    }),
    // Their own invite code and the months it brought (docs/API.md "Give a month, get a month")
    prisma.promoCode.findUnique({ where: { ownerId: userId }, select: { code: true, createdAt: true } }),
    prisma.referralReward.findMany({
      where: { referrerId: userId },
      select: { kind: true, amountPence: true, appliedAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  return {
    user,
    profile,
    subscription,
    grants,
    ownedMaps,
    mapMemberships,
    tripMemberships,
    photosOnOtherMaps,
    avatarKey: avatar?.media?.key ?? null,
    giftsBought,
    referralCode,
    referralRewards,
  };
}

/** Who owns a map: -> its ownerId, or null when there's no such map. */
export const findMapOwnerId = async (mapId) =>
  (await prisma.travelMap.findUnique({ where: { id: mapId }, select: { ownerId: true } }))?.ownerId ?? null;

const PLACE = { landmarkId: true, landmark: { select: { name: true } }, placeName: true };

/** Everything on one map apart from its photos (they come a page at a time). */
export async function findMapForExport(mapId) {
  const onMap = { mapId };
  const onMapsTrips = { trip: { mapId } };
  const [map, travellers, visits, members, invites, trips, stops, tripTravellers, tripMembers, tripInvites, tripLinks, moments, momentTravellers, momentPhotos, goals, badges, stampPhotos, photoCount, subdivisionVisits, pins, pinVisits, pinVisitPhotos] =
    await Promise.all([
      prisma.travelMap.findUnique({
        where: { id: mapId },
        select: {
          id: true, name: true, groupType: true, isDefault: true, splitUk: true, homeCountryCode: true, style: true, passportColour: true, visitedLook: true, visitedColour: true, visitedFinish: true, linkAccess: true, shareCode: true, graceUntil: true, createdAt: true, updatedAt: true,
          // Its own designs, one per map style (docs/API.md "Map designs"): the colours, and
          // whether each has a picture
          designs: {
            select: { style: true, shown: true, countryColours: true, namesColour: true, gridColour: true, hoverColour: true, stringColour: true, stringTwistColour: true, plannedStringColour: true, plannedStringTwistColour: true, pictureId: true },
            orderBy: { style: 'asc' },
          },
          // Landmarks ticked "been here" (docs/API.md "Collecting")
          landmarkVisits: { select: { landmarkId: true, createdAt: true, landmark: { select: { name: true, countryCode: true } } }, orderBy: { createdAt: 'asc' } },
          // Strings tied between its places (docs/API.md "Strings")
          strings: { select: { kind: true, fromCode: true, toCode: true, createdAt: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
          // Its flight log and "Guess where I was" games (docs/API.md "Flights", "Guess where I was")
          flights: {
            select: { fromAirport: true, toAirport: true, flownOn: true, carrier: true, flightNumber: true, distanceKm: true, tripId: true, source: true },
            orderBy: [{ flownOn: 'asc' }, { createdAt: 'asc' }],
          },
          guessGames: { select: { code: true, title: true, photoIds: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
          photoShows: { select: { code: true, title: true, photoIds: true, seconds: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
          // Life's One Shots ticked (docs/API.md "Life's One Shots")
          oneShots: {
            select: {
              itemKey: true,
              seenOn: true,
              datePrecision: true,
              countryCode: true,
              notes: true,
              source: true,
              photos: { select: { photoId: true }, orderBy: [{ position: 'asc' }, { photoId: 'asc' }] },
              createdAt: true,
              travellers: { select: { travellerId: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.traveller.findMany({
        where: onMap,
        select: {
          id: true,
          name: true,
          position: true,
          userId: true,
          birthCountryCode: true,
          favouriteCountryCode: true,
          birthDate: true,
          createdAt: true,
          portraitPhotoId: true,
          portraitFocusX: true,
          portraitFocusY: true,
          portraitZoom: true,
          signature: true,
        },
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
        select: { id: true, kind: true, title: true, text: true, happenedOn: true, datePrecision: true, countryCode: true, ...PLACE, latitude: true, longitude: true, spotShared: true, tripId: true, hidden: true, createdAt: true, updatedAt: true },
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
      // Country maps: states visited, and pins with their visits and those visits' photos
      prisma.subdivisionVisit.findMany({
        where: onMap,
        select: { subdivisionCode: true, countryCode: true, status: true, createdAt: true, updatedAt: true },
        orderBy: { subdivisionCode: 'asc' },
      }),
      prisma.mapPin.findMany({
        where: onMap,
        select: { id: true, countryCode: true, name: true, notes: true, latitude: true, longitude: true, hidden: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.mapPinVisit.findMany({
        where: { pin: onMap },
        select: { id: true, pinId: true, visitedOn: true, datePrecision: true, notes: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.mapPinVisitPhoto.findMany({ where: { visit: { pin: onMap } }, select: { visitId: true, photoId: true, position: true }, orderBy: { position: 'asc' } }),
    ]);
  return { map, travellers, visits, members, invites, trips, stops, tripTravellers, tripMembers, tripInvites, tripLinks, moments, momentTravellers, momentPhotos, goals, badges, stampPhotos, photoCount, subdivisionVisits, pins, pinVisits, pinVisitPhotos };
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

/**
 * The photos someone added to maps they don't own and can still open: as a member of the map,
 * or of the photo's trip. Someone taken off a map (or who left it) no longer gets the photos
 * they'd added there, with their originals and positions (19 Nov 2026, the user's decision,
 * the audit's D2).
 */
function uploadsElsewhere(userId) {
  return {
    uploaderId: userId,
    map: { ownerId: { not: userId } },
    OR: [{ map: { members: { some: { userId } } } }, { trip: { members: { some: { userId } } } }],
  };
}

/** A page of the photos someone added to maps they don't own and can still open (one more than `take`). */
export const findUploadsElsewhereForExport = (userId, { cursor, take }) =>
  prisma.photo.findMany({
    // AND, not a spread: the cursor's own OR would replace the membership's
    where: { AND: [uploadsElsewhere(userId), afterCursor(cursor)] },
    orderBy: NEWEST_FIRST,
    take: take + 1,
    select: { ...PHOTO_EXPORT_SELECT, map: { select: { name: true, owner: { select: { name: true } } } } },
  });
