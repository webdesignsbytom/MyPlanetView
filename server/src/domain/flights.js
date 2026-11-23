// The flight log (docs/API.md "Flights"): thin queries.
import { prisma } from '../prisma.js';

const FLIGHT_SELECT = {
  id: true,
  mapId: true,
  tripId: true,
  fromAirport: true,
  toAirport: true,
  flownOn: true,
  carrier: true,
  flightNumber: true,
  distanceKm: true,
  source: true,
  createdAt: true,
};

/** A map's flights, newest first (the [mapId, flownOn] index). */
export const findFlightsForMap = (mapId) =>
  prisma.flight.findMany({ where: { mapId }, orderBy: [{ flownOn: 'desc' }, { createdAt: 'desc' }], select: FLIGHT_SELECT });

/**
 * Flights logged; one already on the map (the same day, airports, airline and number) is
 * skipped. -> the flights made
 */
export const createFlightsInDB = (rows) => prisma.flight.createManyAndReturn({ data: rows, skipDuplicates: true, select: FLIGHT_SELECT });

export const findFlightById = (id) => prisma.flight.findUnique({ where: { id }, select: FLIGHT_SELECT });

export const deleteFlightInDB = (id) => prisma.flight.delete({ where: { id } });

/** Is `tripId` one of this map's own trips? */
export const isTripOfMap = async (tripId, mapId) => Boolean(await prisma.trip.findFirst({ where: { id: tripId, mapId }, select: { id: true } }));
