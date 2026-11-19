import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { createMissingVisits } from './maps.js';
import { withParentPlaces } from '../utils/specialPlaces.js';

// Country maps (docs/API.md "Country maps"): the states a map has been to, and its pins with
// their visits

// ── States ────────────────────────────────────────────────────────────────────────────

/** A map's state visits on one country's map (the UK's for every UK state): `[{ subdivisionCode, status }]`. */
export const findSubdivisionVisits = (mapId, countryCode) =>
  prisma.subdivisionVisit.findMany({ where: { mapId, countryCode }, select: { subdivisionCode: true, status: true } });

/** The map's visits to these places (regions that are states): `[{ countryCode, status }]`. */
export const findPlaceVisits = (mapId, codes) =>
  codes.length ? prisma.countryVisit.findMany({ where: { mapId, countryCode: { in: codes } }, select: { countryCode: true, status: true } }) : [];

export const upsertSubdivisionVisitInDB = ({ mapId, subdivisionCode, countryCode, status }, db = prisma) =>
  db.subdivisionVisit.upsert({
    where: { mapId_subdivisionCode: { mapId, subdivisionCode } },
    create: { mapId, subdivisionCode, countryCode, status },
    update: { status },
    select: { subdivisionCode: true, status: true },
  });

const VISIT_FIELDS = { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true };

/**
 * Mark a state, and add the places it brings (`places`: its region, its country) as VISITED
 * where they're missing or only wanted, in one transaction. -> `{ row, implied }`, implied
 * being those places' visits as they now are when any changed (else []).
 */
export const markSubdivisionInDB = ({ mapId, subdivisionCode, countryCode, status, places }) =>
  prisma.$transaction(async (tx) => {
    const row = await upsertSubdivisionVisitInDB({ mapId, subdivisionCode, countryCode, status }, tx);
    if (!places.length) return { row, implied: [] };
    const { count } = await createMissingVisits(mapId, places, 'MANUAL', tx);
    const implied = count
      ? await tx.countryVisit.findMany({ where: { mapId, countryCode: { in: withParentPlaces(places) } }, select: VISIT_FIELDS })
      : [];
    return { row, implied };
  });

export const deleteSubdivisionVisitInDB = (mapId, subdivisionCode) =>
  prisma.subdivisionVisit.deleteMany({ where: { mapId, subdivisionCode } });

// ── Pins ──────────────────────────────────────────────────────────────────────────────

/**
 * Enough to decide the caller's role on a pin: the pin, its map's owner, and the caller's
 * own membership, read side by side (as findMomentAccess). The membership is read only when
 * there's a user: `userId: undefined` would mean no filter.
 * -> `{ id, mapId, countryCode, latitude, longitude, hidden, map: { ownerId, splitUk, members } }`, or null
 */
export const findPinAccess = async (pinId, userId) => {
  const ofPin = { pins: { some: { id: pinId } } };
  const [pin, map, member] = await Promise.all([
    prisma.mapPin.findUnique({
      where: { id: pinId },
      select: { id: true, mapId: true, countryCode: true, latitude: true, longitude: true, hidden: true },
    }),
    prisma.travelMap.findFirst({ where: ofPin, select: { ownerId: true, splitUk: true } }),
    userId ? prisma.mapMember.findFirst({ where: { userId, map: ofPin }, select: { role: true } }) : null,
  ]);
  if (!pin || !map) return null;
  return { ...pin, map: { ...map, members: member ? [member] : [] } };
};

const thumbOf = { where: { size: 'THUMB' }, select: { size: true, media: { select: { key: true } } } };

const PIN_SELECT = {
  id: true,
  mapId: true,
  countryCode: true,
  name: true,
  notes: true,
  latitude: true,
  longitude: true,
  hidden: true,
  createdAt: true,
};

/**
 * A country's pins on a map (every pin with no `countryCode`), with each one's visit count
 * and latest visit date; hidden ones for editors only.
 */
export const findPins = async (mapId, { countryCode, includeHidden = false } = {}) => {
  const pins = await prisma.mapPin.findMany({
    where: { mapId, ...(countryCode ? { countryCode } : {}), ...(includeHidden ? {} : { hidden: false }) },
    select: PIN_SELECT,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  });
  if (!pins.length) return [];
  // Counted over these pins only (domain/counts.js's way: never a _count in a select)
  const ids = pins.map((p) => p.id);
  const [visits, latest] = await Promise.all([
    prisma.mapPinVisit.groupBy({ by: ['pinId'], where: { pinId: { in: ids } }, _count: { _all: true } }),
    // Each pin's latest dated visit, chosen by Postgres (Prisma's `distinct` fetches every
    // row and drops the rest itself; 19 Nov 2026, the audit)
    prisma.$queryRaw`
      SELECT DISTINCT ON ("pinId") "pinId", "visitedOn", "datePrecision"::text AS "datePrecision"
      FROM "map_pin_visit"
      WHERE "pinId" IN (${Prisma.join(ids)}) AND "visitedOn" IS NOT NULL
      ORDER BY "pinId", "visitedOn" DESC, "id"`,
  ]);
  const countOf = new Map(visits.map((v) => [v.pinId, v._count._all]));
  const latestOf = new Map(latest.map((v) => [v.pinId, v]));
  return pins.map((pin) => ({ ...pin, visitCount: countOf.get(pin.id) ?? 0, latestVisit: latestOf.get(pin.id) ?? null }));
};

/** One pin with its visits (newest first, undated last) and their photos, or null. */
export const findPinDetail = (pinId) =>
  prisma.mapPin.findUnique({
    where: { id: pinId },
    select: {
      ...PIN_SELECT,
      visits: {
        select: {
          id: true,
          visitedOn: true,
          datePrecision: true,
          notes: true,
          createdAt: true,
          photos: {
            select: { photo: { select: { id: true, tripId: true, hidden: true, kind: true, videoState: true, countryCode: true, variants: thumbOf } } },
            orderBy: [{ position: 'asc' }, { photoId: 'asc' }],
          },
        },
        orderBy: [{ visitedOn: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      },
    },
  });

/**
 * A new pin, with its first visit when given (and that visit's photos, in order), unless the
 * map has `cap` pins already: counted with the map row locked, so two at once can't both
 * pass it (19 Nov 2026, the audit). -> `{ id }`, or null when full
 */
export const createPinInDB = ({ visit, cap, ...data }) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${data.mapId} FOR NO KEY UPDATE`;
    if ((await tx.mapPin.count({ where: { mapId: data.mapId } })) >= cap) return null;
    return tx.mapPin.create({
      data: {
        ...data,
        ...(visit
          ? { visits: { create: { ...visit.data, photos: { create: (visit.photoIds ?? []).map((photoId, position) => ({ photoId, position })) } } } }
          : {}),
      },
      select: { id: true },
    });
  });

export const updatePinInDB = (pinId, data) => prisma.mapPin.update({ where: { id: pinId }, data, select: { id: true } });
export const deletePinInDB = (pinId) => prisma.mapPin.delete({ where: { id: pinId } });

/** One of a pin's visits (`{ id, pinId }`), or null. */
export const findPinVisit = (visitId, pinId) => prisma.mapPinVisit.findFirst({ where: { id: visitId, pinId }, select: { id: true, pinId: true } });

/** A new visit to a pin, unless it has `cap` already (counted with the pin row locked). -> `{ id }`, or null when full */
export const createPinVisitInDB = (pinId, { data, photoIds = [] }, cap) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "map_pin" WHERE "id" = ${pinId} FOR NO KEY UPDATE`;
    if ((await tx.mapPinVisit.count({ where: { pinId } })) >= cap) return null;
    return tx.mapPinVisit.create({
      data: { ...data, pinId, photos: { create: photoIds.map((photoId, position) => ({ photoId, position })) } },
      select: { id: true },
    });
  });

/** Change a visit; `photoIds`, when given, replaces its photos (in that order). One transaction. */
export const updatePinVisitInDB = (visitId, { data, photoIds }) =>
  prisma.$transaction(async (tx) => {
    await tx.mapPinVisit.update({ where: { id: visitId }, data: { ...data, updatedAt: new Date() } });
    if (photoIds) {
      await tx.mapPinVisitPhoto.deleteMany({ where: { visitId } });
      await tx.mapPinVisitPhoto.createMany({ data: photoIds.map((photoId, position) => ({ visitId, photoId, position })) });
    }
  });

export const deletePinVisitInDB = (visitId) => prisma.mapPinVisit.delete({ where: { id: visitId } });
