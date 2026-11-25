// Mock mode only: "Download my data" (docs/API.md, "Your data"), as the server's
// controllers/dataExport.js and utils/dataExport.js: the account, each map the test user
// owns (anyone else's is a 404), its photos a page at a time with a link to each one's
// best copy, and their photos on other people's maps. The links are the mock's own files.
import { fail, ok, route } from '../mockAdapter';
import { feedbackExportItem } from '../feedback';
import { getDb, me } from '../store';
import { landmarkById, photoDetail, userName } from '../views';
import { effectivePlan, grantsOf, subscriptionOf } from '../plans';
import { designsOf } from '../mapDesigns';
import { PLANS } from '@/utils/constants/plans';

const PAGE = 500;
const LINK_DAYS = 7;
const MAP_NOT_FOUND = 'That map doesn’t exist, or it hasn’t been shared with you.';
const BAD_CURSOR = 'That page of the export doesn’t exist. Start the download again.';

const iso = (value) => (value ? new Date(value).toISOString() : null);
const day = (value) => (value ? String(value).slice(0, 10) : null);
const place = (row) => ({ landmarkId: row.landmarkId ?? null, landmarkName: landmarkById(row.landmarkId)?.name ?? null, placeName: row.placeName ?? null });
// A photo someone added to a map they don't own and can still open (a member of the map, or
// of the photo's trip), as the server: taken off a map, they no longer get its photos
const isUploadElsewhere = (db, photo, userId) =>
  photo.uploaderId === userId &&
  db.maps.find((m) => m.id === photo.mapId)?.ownerId !== userId &&
  (db.mapMembers.some((m) => m.mapId === photo.mapId && m.userId === userId) ||
    (Boolean(photo.tripId) && db.tripMembers.some((m) => m.tripId === photo.tripId && m.userId === userId)));
const newestFirst = (a, b) => (a.createdAt === b.createdAt ? (a.id < b.id ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1);

// The server's cursor: "<createdAt in ms>.<photo id>"
const cursorOf = (photo) => `${Date.parse(photo.createdAt)}.${photo.id}`;
function pageAfterCursor(photos, cursor) {
  const sorted = [...photos].sort(newestFirst);
  let start = 0;
  if (cursor) {
    const at = sorted.findIndex((p) => cursorOf(p) === cursor);
    if (at === -1) return null;
    start = at + 1;
  }
  const rows = sorted.slice(start, start + PAGE);
  return { rows, nextCursor: start + PAGE < sorted.length ? cursorOf(rows[rows.length - 1]) : null };
}

function photoView(photo) {
  const db = getDb();
  const video = photo.kind === 'VIDEO';
  const best = video ? null : photoDetail(photo, 'OWNER');
  return {
    id: photo.id,
    kind: photo.kind || 'PHOTO',
    caption: photo.caption ?? null,
    takenAt: iso(photo.takenAt),
    countryCode: photo.countryCode ?? null,
    tripId: photo.tripId ?? null,
    latitude: photo.latitude ?? null,
    longitude: photo.longitude ?? null,
    hidden: Boolean(photo.hidden),
    width: photo.width,
    height: photo.height,
    uploadedAt: iso(photo.createdAt),
    uploadedByYou: photo.uploaderId === me().id,
    uploadedBy: userName(photo.uploaderId),
    ...(video ? { lengthSeconds: photo.durationS ?? null, videoState: photo.videoState ?? 'READY' } : {}),
    landmarks: db.photoLandmarks
      .filter((pl) => pl.photoId === photo.id)
      .map((pl) => ({
        landmarkId: pl.landmarkId,
        name: landmarkById(pl.landmarkId)?.name ?? null,
        source: pl.source,
        confirmed: pl.confirmed,
        confirmedAt: iso(pl.confirmedAt),
        distanceM: pl.distanceM ?? null,
      })),
    file: best?.originalUrl ? { copy: best.bestCopy, contentType: 'image/jpeg', bytes: null, width: photo.width, height: photo.height, url: best.originalUrl } : null,
    ...(video ? { fileNote: 'Videos are kept by Cloudflare Stream, which keeps no original file to download. It plays on the site.' } : {}),
  };
}

const ownMap = (mapId) => getDb().maps.find((m) => m.id === mapId && m.ownerId === me().id) || null;

function mapView(map) {
  const db = getDb();
  const memberView = (m) => ({ name: userName(m.userId), role: m.role, since: iso(m.createdAt) });
  const inviteView = (i) => ({ email: i.email, role: i.role, invitedAt: iso(i.createdAt), expiresAt: iso(i.expiresAt), acceptedAt: iso(i.acceptedAt) });
  const trips = db.trips.filter((t) => t.mapId === map.id);
  return {
    id: map.id,
    name: map.name,
    groupType: map.groupType,
    isDefault: map.isDefault,
    splitUk: Boolean(map.splitUk),
    homeCountryCode: map.homeCountryCode ?? null,
    // The style chosen for it (null: the owner's own)
    style: map.style ?? null,
    linkAccess: map.linkAccess,
    shareCode: map.shareCode,
    graceUntil: iso(map.graceUntil),
    createdAt: iso(map.createdAt),
    updatedAt: iso(map.updatedAt ?? map.createdAt),
    travellers: db.travellers
      .filter((t) => t.mapId === map.id)
      .sort((a, b) => a.position - b.position)
      .map((t) => ({
        id: t.id,
        name: t.name,
        isYou: t.userId === me().id,
        linkedToAnAccount: Boolean(t.userId),
        birthCountryCode: t.birthCountryCode ?? null,
        favouriteCountryCode: t.favouriteCountryCode ?? null,
        birthDate: t.birthDate ?? null,
        addedAt: iso(t.createdAt),
      })),
    countries: db.visits
      .filter((v) => v.mapId === map.id)
      .sort((a, b) => (a.countryCode < b.countryCode ? -1 : 1))
      .map((v) => ({ countryCode: v.countryCode, status: v.status, source: v.source, firstVisitedOn: day(v.firstVisitedOn), notes: v.notes ?? null, addedAt: iso(v.createdAt), updatedAt: iso(v.updatedAt) })),
    sharedWith: db.mapMembers.filter((m) => m.mapId === map.id).map(memberView),
    invites: db.invites.filter((i) => i.mapId === map.id).map(inviteView),
    trips: trips.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      status: t.status,
      startDate: day(t.startDate),
      endDate: day(t.endDate),
      linkAccess: t.linkAccess,
      shareCode: t.shareCode,
      coverPhotoId: t.coverPhotoId ?? null,
      createdAt: iso(t.createdAt),
      updatedAt: iso(t.updatedAt ?? t.createdAt),
      travellerIds: t.travellerIds || [],
      stops: db.stops
        .filter((s) => s.tripId === t.id)
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ id: s.id, position: s.position, countryCode: s.countryCode, ...place(s), arriveOn: day(s.arriveOn), leaveOn: day(s.leaveOn), notes: s.notes ?? null })),
      sharedWith: db.tripMembers.filter((m) => m.tripId === t.id).map(memberView),
      invites: db.invites.filter((i) => i.tripId === t.id).map(inviteView),
    })),
    groupTripsAdded: db.tripMaps
      .filter((l) => l.mapId === map.id)
      .map((l) => {
        const trip = db.trips.find((t) => t.id === l.tripId);
        return { tripId: l.tripId, title: trip?.title ?? null, fromMap: db.maps.find((m) => m.id === trip?.mapId)?.name ?? null, addedAt: iso(l.createdAt) };
      }),
    moments: db.moments
      .filter((m) => m.mapId === map.id)
      .map((m) => ({
        id: m.id,
        kind: m.kind,
        title: m.title,
        text: m.text ?? null,
        happenedOn: day(m.happenedOn),
        datePrecision: m.datePrecision ?? null,
        countryCode: m.countryCode,
        ...place(m),
        spot: m.latitude == null ? null : { latitude: m.latitude, longitude: m.longitude, shared: Boolean(m.spotShared) },
        tripId: m.tripId ?? null,
        hidden: Boolean(m.hidden),
        travellerIds: m.travellerIds || [],
        photoIds: m.photoIds || [],
        createdAt: iso(m.createdAt),
        updatedAt: iso(m.updatedAt),
      })),
    // Country maps: the states marked, and the pins with a visit for every time (as the server)
    statesVisited: (db.subdivisionVisits || [])
      .filter((s) => s.mapId === map.id)
      .map((s) => ({ code: s.code, countryCode: s.countryCode, status: s.status, createdAt: null, updatedAt: null })),
    pins: (db.pins || [])
      .filter((p) => p.mapId === map.id)
      .map((p) => ({
        id: p.id,
        countryCode: p.countryCode,
        name: p.name,
        notes: p.notes ?? null,
        latitude: p.latitude,
        longitude: p.longitude,
        hidden: Boolean(p.hidden),
        visits: (db.pinVisits || [])
          .filter((v) => v.pinId === p.id)
          .map((v) => ({
            id: v.id,
            visitedOn: day(v.visitedOn),
            datePrecision: v.datePrecision ?? null,
            notes: v.notes ?? null,
            photoIds: v.photoIds || [],
            createdAt: iso(v.createdAt),
          })),
        createdAt: iso(p.createdAt),
        updatedAt: iso(p.createdAt),
      })),
    goals: (db.goals || [])
      .filter((g) => g.mapId === map.id)
      .map((g) => ({ id: g.id, kind: g.kind, title: g.title ?? null, target: g.target ?? null, countryCodes: g.countryCodes || [], region: g.region ?? null, deadline: day(g.deadline), achievedAt: iso(g.achievedAt), createdAt: iso(g.createdAt) })),
    badges: (db.badgeAwards || []).filter((b) => b.mapId === map.id).map((b) => ({ key: b.badgeKey, earnedAt: iso(b.earnedAt) })),
    passportStampPhotos: (db.landmarkCovers || [])
      .filter((c) => c.mapId === map.id)
      .map((c) => ({ landmarkId: c.landmarkId, landmarkName: landmarkById(c.landmarkId)?.name ?? null, photoId: c.photoId })),
    // Its own designs, one per map style, and the landmarks ticked "been here", as the server's
    designs: Object.entries(designsOf(map)).map(([style, d]) => ({
      style,
      shown: Boolean(d.shown),
      countryColours: d.countries || {},
      namesColour: d.names ?? null,
      gridColour: d.grid ?? null,
      hoverColour: d.hover ?? null,
      stringColour: d.string ?? null,
      stringTwistColour: d.stringTwist ?? null,
      plannedStringColour: d.plannedString ?? null,
      plannedStringTwistColour: d.plannedStringTwist ?? null,
      hasSeaPicture: Boolean(d.pictureKey),
    })),
    landmarksBeenTo: (db.landmarkVisits || [])
      .filter((v) => v.mapId === map.id)
      .map((v) => ({ landmarkId: v.landmarkId, name: landmarkById(v.landmarkId)?.name ?? null, countryCode: landmarkById(v.landmarkId)?.countryCode ?? null, since: iso(v.createdAt) })),
    strings: (db.mapStrings || []).filter((s) => s.mapId === map.id).map((s) => ({ kind: s.kind === 'PLANNED' ? 'PLANNED' : 'VISITED', from: s.from, to: s.to, since: iso(s.createdAt) })),
    // Life's One Shots ticked (as the server's utils/dataExport.js)
    oneShots: (db.oneShots || [])
      .filter((o) => o.mapId === map.id)
      .map((o) => ({
        item: o.itemKey,
        seenOn: o.seenOn,
        datePrecision: o.datePrecision,
        countryCode: o.countryCode,
        notes: o.notes,
        source: o.source,
        photoId: o.photoId,
        travellerIds: [...(o.travellerIds || [])],
        ticked: iso(o.createdAt),
      })),
    photoCount: db.photos.filter((p) => p.mapId === map.id).length,
  };
}

export function registerDataExportRoutes() {
  route('GET', '/api/users/export', () => {
    const db = getDb();
    const user = me();
    const now = new Date();
    const inForce = effectivePlan(user.id);
    const sub = subscriptionOf(user.id);
    return ok({
      format: 'my-planet-view-data',
      version: 1,
      site: 'My Planet View',
      exportedAt: now.toISOString(),
      linksWorkUntil: new Date(now.getTime() + LINK_DAYS * 86400000).toISOString(),
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        createdAt: iso(user.createdAt),
        avatarUrl: user.image ?? null,
        username: null,
        homeCountryCode: user.homeCountryCode ?? null,
        mapSettings: db.mapSettings ?? null,
        signedUpWithPromoCode: db.promoCodes.find((p) => p.id === user.promoCodeId)?.code ?? null,
        promoFreeMonthUsedAt: iso(user.promoTrialUsedAt),
      },
      plan: {
        inForce: { id: inForce.plan, name: PLANS[inForce.plan].name, from: inForce.source },
        subscription: sub
          ? { plan: sub.plan, interval: sub.interval, status: sub.status, extraMaps: sub.extraMaps, currentPeriodEnd: iso(sub.currentPeriodEnd), cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd), startedAt: null }
          : null,
        complimentary: grantsOf(user.id).map((g) => ({ plan: g.plan, startsAt: iso(g.startsAt), endsAt: iso(g.endsAt), reason: g.reason ?? null })),
        // Gifts of a year of a plan they bought, as the server's (docs/API.md "Gifts")
        giftsBought: (db.gifts || [])
          .filter((g) => g.buyerId === user.id && g.paidAt)
          .map((g) => ({
            code: g.code,
            plan: g.plan,
            months: g.months,
            pricePence: g.amountPence,
            forName: g.toName ?? null,
            message: g.message ?? null,
            paidAt: iso(g.paidAt),
            redeemedAt: iso(g.redeemedAt),
            refundedAt: iso(g.refundedAt),
          })),
      },
      mapsYouOwn: db.maps.filter((m) => m.ownerId === user.id).map((m) => ({ id: m.id, name: m.name, isDefault: m.isDefault, createdAt: iso(m.createdAt) })),
      mapsSharedWithYou: db.mapMembers
        .filter((m) => m.userId === user.id)
        .map((m) => {
          const map = db.maps.find((x) => x.id === m.mapId);
          return { id: m.mapId, name: map?.name ?? null, owner: userName(map?.ownerId), role: m.role, since: iso(m.createdAt) };
        }),
      tripsSharedWithYou: db.tripMembers
        .filter((m) => m.userId === user.id)
        .map((m) => {
          const trip = db.trips.find((t) => t.id === m.tripId);
          const map = db.maps.find((x) => x.id === trip?.mapId);
          return { id: m.tripId, title: trip?.title ?? null, map: map?.name ?? null, owner: userName(map?.ownerId), role: m.role, since: iso(m.createdAt) };
        }),
      photosOnOtherMaps: db.photos.filter((p) => isUploadElsewhere(db, p, user.id)).length,
      // The feedback they sent (docs/API.md "Feedback"): their words and where each stands
      feedback: (db.feedback || []).filter((f) => f.userId === user.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map(feedbackExportItem),
    });
  });

  route('GET', '/api/users/export/maps/:mapId', ({ params }) => {
    const map = ownMap(params.mapId);
    return map ? ok({ map: mapView(map) }) : fail(404, MAP_NOT_FOUND);
  });

  route('GET', '/api/users/export/maps/:mapId/photos', ({ params, query }) => {
    const map = ownMap(params.mapId);
    if (!map) return fail(404, MAP_NOT_FOUND);
    const page = pageAfterCursor(getDb().photos.filter((p) => p.mapId === map.id), query.cursor);
    if (!page) return fail(400, BAD_CURSOR);
    return ok({ photos: page.rows.map(photoView), nextCursor: page.nextCursor });
  });

  route('GET', '/api/users/export/uploads', ({ query }) => {
    const db = getDb();
    const mine = db.photos.filter((p) => isUploadElsewhere(db, p, me().id));
    const page = pageAfterCursor(mine, query.cursor);
    if (!page) return fail(400, BAD_CURSOR);
    return ok({
      photos: page.rows.map((p) => {
        const map = db.maps.find((m) => m.id === p.mapId);
        return { ...photoView(p), mapId: p.mapId, map: map?.name ?? null, mapOwner: userName(map?.ownerId) };
      }),
      nextCursor: page.nextCursor,
    });
  });
}
