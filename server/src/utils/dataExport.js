// "Download my data" (docs/API.md "Your data"): the shape of the file, from the rows
// domain/dataExport.js reads. Pure, so it's tested without a database. The browser asks
// for the parts one at a time (the account, each map you own, its photos a page at a
// time, your photos on other people's maps) and joins them into one JSON file, as one
// answer would be too big for the host (Vercel's 4.5 MB) on a big map.
import { BusinessName } from './constants/siteConstants.js';
import { planOf } from './constants/plans.js';
import { effectivePlan } from './plans.js';
import { isUuid } from './travelValidation.js';
import { storedColours } from './mapDesigns.js';

export const EXPORT_FORMAT = 'my-planet-view-data';
export const EXPORT_VERSION = 1;
// Photos per page, and how long each photo's download link works
export const EXPORT_PHOTO_PAGE = 500;
export const EXPORT_LINK_DAYS = 7;

const iso = (date) => (date ? new Date(date).toISOString() : null);
// A calendar date (a @db.Date column) as YYYY-MM-DD
const day = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null);
const place = (row) => ({ landmarkId: row.landmarkId ?? null, landmarkName: row.landmark?.name ?? null, placeName: row.placeName ?? null });
const groupBy = (rows, key) => {
  const out = new Map();
  for (const row of rows) {
    const list = out.get(row[key]) ?? [];
    list.push(row);
    out.set(row[key], list);
  }
  return out;
};

// ── Cursors: "<createdAt in ms>.<photo id>", the last photo of the page before ──

export const encodeExportCursor = (photo) => `${new Date(photo.createdAt).getTime()}.${photo.id}`;

/** -> `{ ok: true, value: null | { createdAt, id } }`, or `{ ok: false }` for a cursor that can't be one. */
export function parseExportCursor(value) {
  if (value === undefined || value === null || value === '') return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const dot = value.indexOf('.');
  const ms = Number(value.slice(0, dot));
  const id = value.slice(dot + 1);
  if (dot < 1 || !Number.isSafeInteger(ms) || ms < 0 || !isUuid(id)) return { ok: false };
  return { ok: true, value: { createdAt: new Date(ms), id } };
}

/** A page of rows read with one extra: `{ rows, nextCursor }`. */
export function pageOf(rows, take) {
  const more = rows.length > take;
  const page = more ? rows.slice(0, take) : rows;
  return { rows: page, nextCursor: more ? encodeExportCursor(page[page.length - 1]) : null };
}

// ── The account ──────────────────────────────────────────────────────────────

export function exportAccountView({
  user,
  profile,
  subscription,
  grants,
  ownedMaps,
  mapMemberships,
  tripMemberships,
  photosOnOtherMaps,
  giftsBought = [],
  referralCode = null,
  referralRewards = [],
  avatarUrl = null,
  now = new Date(),
}) {
  const inForce = effectivePlan({ subscription, grants, now });
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    site: BusinessName,
    exportedAt: iso(now),
    linksWorkUntil: iso(new Date(now.getTime() + EXPORT_LINK_DAYS * 86400000)),
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: iso(user.createdAt),
      avatarUrl,
      username: profile?.username ?? null,
      homeCountryCode: profile?.homeCountryCode ?? null,
      mapSettings: profile?.mapSettings ?? null,
      // Emails people can stop (docs/API.md "Emails")
      emails: { onThisDay: profile?.onThisDayEmails ?? true, tripShare: profile?.tripShareEmails ?? true },
      signedUpWithPromoCode: profile?.promoCode?.code ?? null,
      promoFreeMonthUsedAt: iso(profile?.promoTrialUsedAt),
      // Give a month, get a month: their own invite code and each month a friend brought
      inviteCode: referralCode?.code ?? null,
      friendRewards: referralRewards.map((r) => ({ kind: r.kind, amountPence: r.amountPence ?? null, given: iso(r.appliedAt), at: iso(r.createdAt) })),
    },
    plan: {
      inForce: { id: inForce.plan, name: planOf(inForce.plan).name, from: inForce.source },
      subscription: subscription
        ? {
            plan: subscription.plan,
            interval: subscription.interval,
            status: subscription.status,
            extraMaps: subscription.extraMaps,
            currentPeriodEnd: iso(subscription.currentPeriodEnd),
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            startedAt: iso(subscription.createdAt),
          }
        : null,
      complimentary: grants.map((g) => ({ plan: g.plan, startsAt: iso(g.startsAt), endsAt: iso(g.endsAt), reason: g.reason ?? null })),
      // Gifts of a year of a plan they bought (docs/API.md "Gifts")
      giftsBought: giftsBought.map((g) => ({
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
    mapsYouOwn: ownedMaps.map((m) => ({ id: m.id, name: m.name, isDefault: m.isDefault, createdAt: iso(m.createdAt) })),
    mapsSharedWithYou: mapMemberships.map((m) => ({ id: m.map.id, name: m.map.name, owner: m.map.owner?.name ?? null, role: m.role, since: iso(m.createdAt) })),
    tripsSharedWithYou: tripMemberships.map((m) => ({
      id: m.trip.id,
      title: m.trip.title,
      map: m.trip.map?.name ?? null,
      owner: m.trip.map?.owner?.name ?? null,
      role: m.role,
      since: iso(m.createdAt),
    })),
    photosOnOtherMaps,
  };
}

// ── A map you own ────────────────────────────────────────────────────────────

const inviteView = (i) => ({ email: i.email, role: i.role, invitedAt: iso(i.createdAt), expiresAt: iso(i.expiresAt), acceptedAt: iso(i.acceptedAt) });
const memberView = (m) => ({ name: m.user?.name ?? null, role: m.role, since: iso(m.createdAt) });

export function exportMapView(rows, { userId }) {
  const { map } = rows;
  const stopsByTrip = groupBy(rows.stops, 'tripId');
  const travellersByTrip = groupBy(rows.tripTravellers, 'tripId');
  const membersByTrip = groupBy(rows.tripMembers, 'tripId');
  const invitesByTrip = groupBy(rows.tripInvites, 'tripId');
  const travellersByMoment = groupBy(rows.momentTravellers, 'momentId');
  const photosByMoment = groupBy(rows.momentPhotos, 'momentId');
  const visitsByPin = groupBy(rows.pinVisits ?? [], 'pinId');
  const photosByPinVisit = groupBy(rows.pinVisitPhotos ?? [], 'visitId');
  return {
    id: map.id,
    name: map.name,
    groupType: map.groupType,
    isDefault: map.isDefault,
    // The UK shown as its four nations (docs/API.md "The UK's nations")
    splitUk: Boolean(map.splitUk),
    homeCountryCode: map.homeCountryCode ?? null,
    // The style chosen for it, shown to everyone who opens it (null: the owner's own)
    style: map.style ?? null,
    // Its passport's cover colour (null: the plan's own)
    passportColour: map.passportColour ?? null,
    // How the places been to show, in every style (docs/API.md "The visited look")
    visitedLook: map.visitedLook ?? 'BADGE',
    visitedColour: map.visitedColour ?? null,
    visitedFinish: map.visitedFinish ?? null,
    // Its own designs, one per map style (docs/API.md "Map designs"): a picture for the sea
    // and its colours
    designs: (map.designs ?? []).map((design) => ({
      style: design.style,
      shown: design.shown,
      countryColours: storedColours(design.countryColours),
      namesColour: design.namesColour ?? null,
      gridColour: design.gridColour ?? null,
      hoverColour: design.hoverColour ?? null,
      stringColour: design.stringColour ?? null,
      stringTwistColour: design.stringTwistColour ?? null,
      plannedStringColour: design.plannedStringColour ?? null,
      plannedStringTwistColour: design.plannedStringTwistColour ?? null,
      hasSeaPicture: Boolean(design.pictureId),
    })),
    // Landmarks ticked "been here" (docs/API.md "Collecting")
    landmarksBeenTo: (map.landmarkVisits ?? []).map((v) => ({ landmarkId: v.landmarkId, name: v.landmark?.name ?? null, countryCode: v.landmark?.countryCode ?? null, since: iso(v.createdAt) })),
    // Strings tied between its places (docs/API.md "Strings")
    strings: (map.strings ?? []).map((s) => ({ kind: s.kind ?? 'VISITED', from: s.fromCode, to: s.toCode, since: iso(s.createdAt) })),
    // Its flight log and "Guess where I was" games (their players' names aren't the owner's data)
    flights: (map.flights ?? []).map((f) => ({
      from: f.fromAirport,
      to: f.toAirport,
      flownOn: iso(f.flownOn)?.slice(0, 10) ?? null,
      airline: f.carrier,
      flightNumber: f.flightNumber,
      distanceKm: f.distanceKm,
      tripId: f.tripId,
      source: f.source,
    })),
    guessGames: (map.guessGames ?? []).map((g) => ({ code: g.code, title: g.title, photoIds: g.photoIds, made: iso(g.createdAt) })),
    // Slideshows shared by their own link (docs/API.md "Photo slideshows")
    photoShows: (map.photoShows ?? []).map((s) => ({ code: s.code, title: s.title, photoIds: s.photoIds, seconds: s.seconds, made: iso(s.createdAt) })),
    // Life's One Shots ticked (the item's key names it: utils/constants/oneShots.js)
    oneShots: (map.oneShots ?? []).map((o) => ({
      item: o.itemKey,
      seenOn: day(o.seenOn),
      datePrecision: o.datePrecision,
      countryCode: o.countryCode,
      notes: o.notes,
      source: o.source,
      // Its photos in order, the first on its card
      photoIds: (o.photos ?? []).map((p) => p.photoId),
      travellerIds: (o.travellers ?? []).map((t) => t.travellerId),
      ticked: iso(o.createdAt),
    })),
    linkAccess: map.linkAccess,
    shareCode: map.shareCode,
    graceUntil: iso(map.graceUntil),
    createdAt: iso(map.createdAt),
    updatedAt: iso(map.updatedAt),
    travellers: rows.travellers.map((t) => ({
      id: t.id,
      name: t.name,
      isYou: t.userId === userId,
      linkedToAnAccount: Boolean(t.userId),
      birthCountryCode: t.birthCountryCode ?? null,
      favouriteCountryCode: t.favouriteCountryCode ?? null,
      // "YYYY-MM-DD" or null (23 Nov 2026)
      birthDate: t.birthDate ? new Date(t.birthDate).toISOString().slice(0, 10) : null,
      // Their passport page (25 Nov 2026): the map photo chosen for it, with its crop, and their signature
      passportPhoto: t.portraitPhotoId
        ? { photoId: t.portraitPhotoId, focusX: t.portraitFocusX ?? null, focusY: t.portraitFocusY ?? null, zoom: t.portraitZoom ?? null }
        : null,
      signature: t.signature ?? null,
      addedAt: iso(t.createdAt),
    })),
    countries: rows.visits.map((v) => ({
      countryCode: v.countryCode,
      status: v.status,
      source: v.source,
      firstVisitedOn: day(v.firstVisitedOn),
      notes: v.notes ?? null,
      addedAt: iso(v.createdAt),
      updatedAt: iso(v.updatedAt),
    })),
    sharedWith: rows.members.map(memberView),
    invites: rows.invites.map(inviteView),
    trips: rows.trips.map((t) => ({
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
      updatedAt: iso(t.updatedAt),
      travellerIds: (travellersByTrip.get(t.id) ?? []).map((r) => r.travellerId),
      stops: (stopsByTrip.get(t.id) ?? []).map((s) => ({
        id: s.id,
        position: s.position,
        countryCode: s.countryCode,
        ...place(s),
        arriveOn: day(s.arriveOn),
        leaveOn: day(s.leaveOn),
        notes: s.notes ?? null,
      })),
      sharedWith: (membersByTrip.get(t.id) ?? []).map(memberView),
      invites: (invitesByTrip.get(t.id) ?? []).map(inviteView),
    })),
    groupTripsAdded: rows.tripLinks.map((l) => ({ tripId: l.trip.id, title: l.trip.title, fromMap: l.trip.map?.name ?? null, addedAt: iso(l.addedAt) })),
    moments: rows.moments.map((m) => ({
      id: m.id,
      kind: m.kind,
      title: m.title,
      text: m.text ?? null,
      happenedOn: day(m.happenedOn),
      datePrecision: m.datePrecision ?? null,
      countryCode: m.countryCode,
      ...place(m),
      spot: m.latitude === null || m.latitude === undefined ? null : { latitude: m.latitude, longitude: m.longitude, shared: m.spotShared },
      tripId: m.tripId ?? null,
      hidden: m.hidden,
      travellerIds: (travellersByMoment.get(m.id) ?? []).map((r) => r.travellerId),
      photoIds: (photosByMoment.get(m.id) ?? []).map((r) => r.photoId),
      createdAt: iso(m.createdAt),
      updatedAt: iso(m.updatedAt),
    })),
    // Country maps: the states marked, and the pins with a visit for every time
    statesVisited: (rows.subdivisionVisits ?? []).map((s) => ({
      code: s.subdivisionCode,
      countryCode: s.countryCode,
      status: s.status,
      createdAt: iso(s.createdAt),
      updatedAt: iso(s.updatedAt),
    })),
    pins: (rows.pins ?? []).map((p) => ({
      id: p.id,
      countryCode: p.countryCode,
      name: p.name,
      notes: p.notes ?? null,
      latitude: p.latitude,
      longitude: p.longitude,
      hidden: p.hidden,
      visits: (visitsByPin.get(p.id) ?? []).map((v) => ({
        id: v.id,
        visitedOn: day(v.visitedOn),
        datePrecision: v.datePrecision ?? null,
        notes: v.notes ?? null,
        photoIds: (photosByPinVisit.get(v.id) ?? []).map((r) => r.photoId),
        createdAt: iso(v.createdAt),
      })),
      createdAt: iso(p.createdAt),
      updatedAt: iso(p.updatedAt),
    })),
    goals: rows.goals.map((g) => ({
      id: g.id,
      kind: g.kind,
      title: g.title ?? null,
      target: g.target ?? null,
      countryCodes: g.countryCodes ?? [],
      region: g.region ?? null,
      deadline: day(g.deadline),
      achievedAt: iso(g.achievedAt),
      createdAt: iso(g.createdAt),
    })),
    badges: rows.badges.map((b) => ({ key: b.badgeKey, earnedAt: iso(b.earnedAt) })),
    passportStampPhotos: rows.stampPhotos.map((c) => ({ landmarkId: c.landmarkId, landmarkName: c.landmark?.name ?? null, photoId: c.photoId })),
    photoCount: rows.photoCount,
  };
}

// ── Photos ───────────────────────────────────────────────────────────────────

// The best copy kept: the original (Business, First Class), else the print copy (Economy)
const FILE_SIZES = ['ORIGINAL', 'PRINT', 'DISPLAY'];
const EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** The copy a photo's download link is for, or null (a video: Stream keeps no file to hand back). */
export function exportFileOf(photo) {
  if (photo.kind === 'VIDEO') return null;
  for (const size of FILE_SIZES) {
    const variant = photo.variants?.find((v) => v.size === size && v.media?.key);
    if (variant) return variant;
  }
  return null;
}

/** A plain file name for the download: "photo-2026-05-01-1a2b3c4d.jpg". */
export function exportFileName(photo, variant) {
  const ext = EXTENSION[variant.media.contentType] || 'jpg';
  const date = day(photo.takenAt ?? photo.createdAt) ?? 'undated';
  return `photo-${date}-${photo.id.slice(0, 8)}.${ext}`;
}

/** One photo or video, with `fileUrl` the signed link to its best copy (null for a video). */
export function exportPhotoView(photo, { userId, fileUrl = null }) {
  const variant = exportFileOf(photo);
  const video = photo.kind === 'VIDEO';
  return {
    id: photo.id,
    kind: photo.kind,
    caption: photo.caption ?? null,
    takenAt: iso(photo.takenAt),
    countryCode: photo.countryCode ?? null,
    tripId: photo.tripId ?? null,
    latitude: photo.latitude ?? null,
    longitude: photo.longitude ?? null,
    hidden: photo.hidden,
    width: photo.width,
    height: photo.height,
    uploadedAt: iso(photo.createdAt),
    uploadedByYou: photo.uploaderId === userId,
    uploadedBy: photo.uploader?.name ?? null,
    ...(video ? { lengthSeconds: photo.durationS ?? null, videoState: photo.videoState ?? null } : {}),
    landmarks: (photo.landmarks ?? []).map((l) => ({
      landmarkId: l.landmarkId,
      name: l.landmark?.name ?? null,
      source: l.source,
      confirmed: l.confirmed,
      confirmedAt: iso(l.confirmedAt),
      distanceM: l.distanceM ?? null,
    })),
    file:
      variant && fileUrl
        ? { copy: variant.size, contentType: variant.media.contentType, bytes: variant.media.bytes ?? null, width: variant.width, height: variant.height, url: fileUrl }
        : null,
    ...(video ? { fileNote: 'Videos are kept by Cloudflare Stream, which keeps no original file to download. It plays on the site.' } : {}),
  };
}

/** One of your photos on someone else's map: the same, plus whose map it's on. */
export const exportUploadView = (photo, options) => ({
  ...exportPhotoView(photo, options),
  mapId: photo.mapId,
  map: photo.map?.name ?? null,
  mapOwner: photo.map?.owner?.name ?? null,
});
