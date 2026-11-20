// Taking your travels with you (docs/API.md "Travel copies"): copying an approved request
// onto the new map, and its emails. A run copies for COPY_RUN_BUDGET_MS, holding the request
// (claimCopyRequest) so two runs never copy at once; the browser asks for more runs until
// it's done, and the daily cron finishes any left. Every copy remembers its original
// (`copiedFromId`, unique per map), so nothing is copied twice, by a later request either.
import crypto from 'node:crypto';
import { prisma } from '../../prisma.js';
import { createMissingVisits } from '../../domain/maps.js';
import { createPhotoInDB } from '../../domain/photos.js';
import { createMomentInDB } from '../../domain/moments.js';
import {
  claimCopyRequest,
  createCopiedLandmarksInDB,
  findApprovedCopyIds,
  findCopiedDates,
  findCopiesOn,
  findCopyEmailContact,
  findCopyRequest,
  findMomentsToCopy,
  findOwnTravellerIds,
  findPhotoToCopy,
  findTripsToCopy,
  saveCopyProgressInDB,
  setFirstVisitIfEarlierInDB,
  setTripCoversInDB,
} from '../../domain/travelCopies.js';
import { buildPhotoKey, copyPrivatePhotoFile, deleteStoredObjects } from '../s3/mediaService.js';
import { sendUserEmail } from '../email/emailHandler.js';
import { loadMapPlan } from './plans.js';
import { newUniqueShareCode } from './maps.js';
import { COPY_LOCK_MS, COPY_RUN_BUDGET_MS, copySummary, earliestDates, placeCopy } from '../../utils/travelCopies.js';
import { BusinessName, BusinessSiteUrl, BusinessUrl, LogoUrl, MapPageUrl } from '../../utils/constants/siteConstants.js';
import { cleanDisplayName } from '../../utils/displayName.js';

// Saved every this many photos, so a run cut short (a timeout) loses little
const SAVE_EVERY = 10;

const isDuplicate = (err) => err?.code === 'P2002';

/** The files a copy wrote before it failed or was refused: deleted with their MediaItem rows. */
async function removeFiles(keys) {
  if (!keys.length) return;
  try {
    await deleteStoredObjects(keys);
  } catch (err) {
    // The daily cron deletes any left (their MediaItems are used by no photo)
    console.error('[travel-copy] removing unsaved copies failed:', err?.message);
  }
}

/** What every step needs: the new map, its plan and places, and who's copying. */
async function copyContext(request) {
  const [plan, travellerIds] = await Promise.all([
    loadMapPlan(request.toMapId),
    findOwnTravellerIds(request.toMapId, request.requestedById),
  ]);
  return {
    fromMapId: request.fromMapId,
    toMapId: request.toMapId,
    splitUk: request.toMap.splitUk,
    userId: request.requestedById,
    plan,
    travellerIds,
  };
}

/** The trips, with their stops; completed ones mark their countries visited. -> Map original id -> copy id */
async function copyTrips(request, ctx) {
  const copies = await findCopiesOn('trip', ctx.toMapId, request.tripIds);
  const sources = await findTripsToCopy(
    request.tripIds.filter((id) => !copies.has(id)),
    ctx.fromMapId,
  );
  for (const trip of sources) {
    const stops = trip.stops.map((s) => ({
      position: s.position,
      ...placeCopy(
        { countryCode: s.countryCode, ukNation: s.ukNation, latitude: s.landmark?.latitude ?? null, longitude: s.landmark?.longitude ?? null },
        ctx.splitUk,
      ),
      landmarkId: s.landmarkId,
      placeName: s.placeName,
      arriveOn: s.arriveOn,
      leaveOn: s.leaveOn,
      notes: s.notes,
    }));
    const shareCode = await newUniqueShareCode();
    try {
      const created = await prisma.$transaction(async (tx) => {
        const row = await tx.trip.create({
          data: {
            mapId: ctx.toMapId,
            title: trip.title,
            description: trip.description,
            status: trip.status,
            startDate: trip.startDate,
            endDate: trip.endDate,
            createdById: ctx.userId,
            shareCode,
            copiedFromId: trip.id,
            travellers: { create: ctx.travellerIds.map((travellerId) => ({ travellerId })) },
            stops: { create: stops },
          },
          select: { id: true },
        });
        if (trip.status === 'COMPLETED') {
          await createMissingVisits(ctx.toMapId, [...new Set(stops.map((s) => s.countryCode))], 'TRIP', tx);
        }
        return row;
      });
      copies.set(trip.id, created.id);
    } catch (err) {
      // Another run copied it first
      if (!isDuplicate(err)) throw err;
      const again = await findCopiesOn('trip', ctx.toMapId, [trip.id]);
      if (again.has(trip.id)) copies.set(trip.id, again.get(trip.id));
    }
  }
  return copies;
}

/**
 * One photo: its files copied under the new map's keys, then saved as an upload is (the
 * plan's caps checked with the map's row locked), with its landmark matches as they were
 * (its passport stamps). -> 'copied', 'skipped' (gone, hidden since, or over the caps) or
 * 'present' (another run copied it)
 */
async function copyOnePhoto(sourceId, ctx, trips) {
  if (ctx.plan?.locked) return 'skipped';
  const source = await findPhotoToCopy(sourceId, ctx.fromMapId);
  if (!source || !source.variants.length) return 'skipped';
  const photoId = crypto.randomUUID();
  const keys = source.variants.map((v) => buildPhotoKey({ mapId: ctx.toMapId, photoId, size: v.size, contentType: v.media.contentType }));
  try {
    const mediaIds = await Promise.all(
      source.variants.map((v, i) =>
        copyPrivatePhotoFile({ fromKey: v.media.key, toKey: keys.at(i), contentType: v.media.contentType, userId: ctx.userId }),
      ),
    );
    const place = placeCopy(source, ctx.splitUk);
    const saved = await createPhotoInDB({
      photo: {
        id: photoId,
        mapId: ctx.toMapId,
        uploaderId: ctx.userId,
        tripId: (source.tripId && trips.get(source.tripId)) || null,
        ...place,
        caption: source.caption,
        takenAt: source.takenAt,
        latitude: source.latitude,
        longitude: source.longitude,
        kind: 'PHOTO',
        width: source.width,
        height: source.height,
        copiedFromId: source.id,
      },
      variants: source.variants.map((v, i) => ({
        mediaId: mediaIds.at(i),
        size: v.size,
        bytes: v.media.bytes,
        contentType: v.media.contentType,
        width: v.width,
        height: v.height,
      })),
      landmarkMatches: [],
      limits: { planId: ctx.plan?.plan ?? 'FREE', countryName: place.countryCode },
    });
    if (!saved.id) {
      await removeFiles(keys);
      return 'skipped';
    }
    await createCopiedLandmarksInDB(photoId, ctx.toMapId, source.landmarks);
    return 'copied';
  } catch (err) {
    await removeFiles(keys);
    if (isDuplicate(err)) return 'present';
    throw err;
  }
}

/** Photos from the request's cursor until the run's time is up. -> the progress */
async function copyPhotos(request, ctx, trips, deadline) {
  let { photoCursor, copiedPhotos, skippedPhotos } = request;
  const ids = request.photoIds;
  // Photos already on the new map (an earlier request, or a run cut short) aren't copied again
  const present = await findCopiesOn('photo', ctx.toMapId, ids.slice(photoCursor));
  let sinceSave = 0;
  while (photoCursor < ids.length && Date.now() < deadline) {
    const sourceId = ids.at(photoCursor);
    const outcome = present.has(sourceId) ? 'present' : await copyOnePhoto(sourceId, ctx, trips);
    if (outcome === 'copied' || outcome === 'present') copiedPhotos += 1;
    else skippedPhotos += 1;
    photoCursor += 1;
    sinceSave += 1;
    if (sinceSave >= SAVE_EVERY) {
      await saveCopyProgressInDB(request.id, { photoCursor, copiedPhotos, skippedPhotos, release: false });
      sinceSave = 0;
    }
  }
  return { photoCursor, copiedPhotos, skippedPhotos };
}

/** The moments, with the copies of their photos; their trip, if it came too. */
async function copyMoments(request, ctx, trips) {
  const copies = await findCopiesOn('moment', ctx.toMapId, request.momentIds);
  const sources = await findMomentsToCopy(
    request.momentIds.filter((id) => !copies.has(id)),
    ctx.fromMapId,
  );
  const photoCopies = await findCopiesOn('photo', ctx.toMapId, [...new Set(sources.flatMap((m) => m.photos.map((p) => p.photoId)))]);
  for (const m of sources) {
    const place = placeCopy(
      {
        countryCode: m.countryCode,
        ukNation: m.ukNation,
        latitude: m.latitude ?? m.landmark?.latitude ?? null,
        longitude: m.longitude ?? m.landmark?.longitude ?? null,
      },
      ctx.splitUk,
    );
    try {
      await createMomentInDB({
        mapId: ctx.toMapId,
        kind: m.kind,
        title: m.title,
        text: m.text,
        happenedOn: m.happenedOn,
        datePrecision: m.datePrecision,
        countryCode: place.countryCode,
        ukNation: place.ukNation,
        landmarkId: m.landmarkId,
        placeName: m.placeName,
        latitude: m.latitude,
        longitude: m.longitude,
        // Its exact spot is private on the new map until they share it, as for a new pin
        spotShared: false,
        tripId: (m.tripId && trips.get(m.tripId)) || null,
        createdById: ctx.userId,
        copiedFromId: m.id,
        travellerIds: ctx.travellerIds,
        photoIds: m.photos.map((p) => photoCopies.get(p.photoId)).filter(Boolean),
      });
    } catch (err) {
      if (!isDuplicate(err)) throw err;
    }
  }
}

/** The copied trips' covers (where the cover came too), and the first visits' dates. */
async function finishCopy(request, ctx, trips) {
  const sources = await findTripsToCopy(request.tripIds, ctx.fromMapId);
  const covers = await findCopiesOn('photo', ctx.toMapId, sources.map((t) => t.coverPhotoId).filter(Boolean));
  const coverRows = sources
    .filter((t) => t.coverPhotoId && covers.has(t.coverPhotoId) && trips.has(t.id))
    .map((t) => ({ tripId: trips.get(t.id), coverPhotoId: covers.get(t.coverPhotoId) }));
  if (coverRows.length) await setTripCoversInDB(coverRows);
  // A country's first visit is the earliest copied photo or completed stop there, when that's
  // earlier than what the new map has (never the family's own first visit: that may be before
  // this traveller was born)
  const dates = earliestDates(await findCopiedDates(ctx.toMapId, { photoIds: request.photoIds, tripIds: request.tripIds }));
  for (const [countryCode, date] of dates) await setFirstVisitIfEarlierInDB(ctx.toMapId, countryCode, date);
}

/**
 * Copy an approved request for one run of `budgetMs`: the trips, then photos from where the
 * last run stopped, and once the photos are done, the moments, covers and first visits.
 * Another run holding it -> nothing is done. -> the request as it now is
 */
export async function runTravelCopy(id, { budgetMs = COPY_RUN_BUDGET_MS } = {}) {
  const deadline = Date.now() + budgetMs;
  if (!(await claimCopyRequest(id, COPY_LOCK_MS))) return findCopyRequest(id);
  const request = await findCopyRequest(id);
  let progress = { photoCursor: request.photoCursor, copiedPhotos: request.copiedPhotos, skippedPhotos: request.skippedPhotos };
  try {
    const ctx = await copyContext(request);
    const trips = await copyTrips(request, ctx);
    progress = await copyPhotos(request, ctx, trips, deadline);
    const done = progress.photoCursor >= request.photoIds.length;
    if (done) {
      await copyMoments(request, ctx, trips);
      await finishCopy(request, ctx, trips);
    }
    const saved = await saveCopyProgressInDB(id, { ...progress, done });
    if (done) await emailCopyDone(saved);
    return saved;
  } catch (err) {
    // Keep what was done and let the request go: the next run carries on
    await saveCopyProgressInDB(id, progress).catch(() => {});
    throw err;
  }
}

/**
 * The daily cron: carry on with approved copies a run left unfinished, within `budgetMs`.
 * -> `{ count }`, the copies it finished
 */
export async function continueApprovedCopies({ budgetMs = 15000 } = {}) {
  const deadline = Date.now() + budgetMs;
  let count = 0;
  for (const id of await findApprovedCopyIds()) {
    const left = deadline - Date.now();
    if (left < 1000) break;
    const request = await runTravelCopy(id, { budgetMs: Math.min(left, COPY_RUN_BUDGET_MS) });
    if (request?.status === 'DONE') count += 1;
  }
  return { count };
}

// Emails (sent after the response; addresses come from the accounts, never the request)

function emailContext(request, extra) {
  return {
    requesterName: cleanDisplayName(request.requestedBy.name) || 'Someone',
    travellerName: cleanDisplayName(request.traveller.name) || 'themselves',
    fromMapName: request.fromMap.name,
    toMapName: request.toMap.name,
    summary: copySummary({
      photos: request.status === 'DONE' ? request.copiedPhotos : request.photoIds.length,
      trips: request.tripIds.length,
      moments: request.momentIds.length,
    }),
    businessName: BusinessName,
    businessUrl: BusinessUrl,
    businessSiteUrl: BusinessSiteUrl,
    logoUrl: LogoUrl,
    year: new Date().getFullYear(),
    ...extra,
  };
}

async function send(userId, subject, context) {
  const contact = await findCopyEmailContact(userId);
  if (!contact?.email || !contact.isActive) return false;
  return sendUserEmail(contact.email, subject, 'travelCopyEmail', { title: subject, ...context });
}

// Subjects are fixed: names (anyone's to choose) stay in the escaped body, as in the share email
/** To the family map's owner: someone asks for a copy. */
export const emailCopyRequested = (request) =>
  send(
    request.fromMap.ownerId,
    `${BusinessName}: someone asks to copy their travels`,
    emailContext(request, {
      isRequest: true,
      preheader: 'A traveller on your map asks for a copy of their travels.',
      actionUrl: `${MapPageUrl}/${request.fromMapId}`,
    }),
  );

/** To the person who asked: their travels are on their map. */
export const emailCopyDone = (request) =>
  send(
    request.requestedById,
    `${BusinessName}: your travels are on your map`,
    emailContext(request, {
      isDone: true,
      preheader: 'Your travels have been copied to your map.',
      skipped: request.skippedPhotos || 0,
      oneSkipped: request.skippedPhotos === 1,
      actionUrl: `${MapPageUrl}/${request.toMapId}`,
    }),
  );

/** To the person who asked: it was declined. */
export const emailCopyDeclined = (request) =>
  send(
    request.requestedById,
    `${BusinessName}: your request to copy your travels`,
    emailContext(request, {
      preheader: 'Your request to copy your travels was declined.',
      actionUrl: `${MapPageUrl}/${request.toMapId}`,
    }),
  );
