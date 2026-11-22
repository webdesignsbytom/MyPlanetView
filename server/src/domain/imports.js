// Importing from other apps (docs/API.md "Importing from Polarsteps"): thin queries.
import { prisma } from '../prisma.js';
import { createMissingVisits } from './maps.js';

const SOURCE = { startsWith: 'polarsteps:' };

/** What's been imported onto a map already: its trips (key -> id), photos' and moments' keys. */
export async function findImportedKeys(mapId) {
  const [trips, photos, moments] = await Promise.all([
    prisma.trip.findMany({ where: { mapId, importedFrom: SOURCE }, select: { id: true, importedFrom: true } }),
    prisma.photo.findMany({ where: { mapId, importedFrom: SOURCE }, select: { importedFrom: true } }),
    prisma.moment.findMany({ where: { mapId, importedFrom: SOURCE }, select: { importedFrom: true } }),
  ]);
  return {
    trips: trips.map((trip) => ({ key: trip.importedFrom, tripId: trip.id })),
    photos: photos.map((photo) => photo.importedFrom),
    moments: moments.map((moment) => moment.importedFrom),
  };
}

/** The importing person's own traveller on the map (the one linked to their account), if any. */
export const findLinkedTravellerId = async (mapId, userId) =>
  (await prisma.traveller.findFirst({ where: { mapId, userId }, select: { id: true } }))?.id ?? null;

/**
 * One imported trip with its stops, in one transaction; a completed one marks its countries
 * visited, as completing a trip does. -> its id (another run's, when that made it first)
 */
export async function createImportedTripInDB({ mapId, userId, travellerId, trip, shareCode }) {
  try {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.trip.create({
        data: {
          mapId,
          title: trip.title,
          status: trip.status,
          startDate: trip.startDate,
          endDate: trip.endDate,
          createdById: userId,
          shareCode,
          importedFrom: trip.key,
          travellers: { create: travellerId ? [{ travellerId }] : [] },
          stops: {
            create: trip.stops.map((stop, position) => ({
              position,
              countryCode: stop.countryCode,
              placeName: stop.placeName,
              arriveOn: stop.arriveOn,
              leaveOn: stop.leaveOn,
            })),
          },
        },
        select: { id: true },
      });
      if (trip.status === 'COMPLETED' && trip.stops.length) {
        await createMissingVisits(mapId, [...new Set(trip.stops.map((stop) => stop.countryCode))], 'TRIP', tx);
      }
      return row;
    });
    return created.id;
  } catch (err) {
    if (err?.code !== 'P2002') throw err;
    const again = await prisma.trip.findFirst({ where: { mapId, importedFrom: trip.key }, select: { id: true } });
    if (!again) throw err;
    return again.id;
  }
}
