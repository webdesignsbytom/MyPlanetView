// Strings tied between places on a map (docs/API.md "Strings"): thin queries. Every add counts
// the map's strings of its kind with its row locked, so two at once never pass MAP_STRINGS_MAX.
// Each kind (VISITED, PLANNED; 25 Nov 2026) is its own set: a pair can be one of each.
import { prisma } from '../prisma.js';
import { MAP_STRINGS_MAX } from '../utils/mapStrings.js';

const SELECT = { id: true, kind: true, fromCode: true, toCode: true };
const lockMap = (tx, mapId) => tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;

/** A map's strings, both kinds, oldest first. */
export const findMapStrings = (mapId) => prisma.mapString.findMany({ where: { mapId }, select: SELECT, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });

/**
 * Tie one string of a kind (`pair` in code order): `{ string, created }` (an existing one comes
 * back with `created: false`), or `{ full: true }` at MAP_STRINGS_MAX of that kind.
 */
export const addMapStringInDB = ({ mapId, kind = 'VISITED', pair: [fromCode, toCode], userId }) =>
  prisma.$transaction(async (tx) => {
    await lockMap(tx, mapId);
    const existing = await tx.mapString.findUnique({ where: { mapId_kind_fromCode_toCode: { mapId, kind, fromCode, toCode } }, select: SELECT });
    if (existing) return { string: existing, created: false };
    if ((await tx.mapString.count({ where: { mapId, kind } })) >= MAP_STRINGS_MAX) return { full: true };
    const string = await tx.mapString.create({ data: { mapId, kind, fromCode, toCode, createdById: userId }, select: SELECT });
    return { string, created: true };
  });

/**
 * Tie many strings of a kind at once (the automatic ones), skipping those already tied, as many
 * as there's room for: `{ added, full }` (`full` when some didn't fit).
 */
export const addMapStringsInDB = ({ mapId, kind = 'VISITED', pairs, userId }) =>
  prisma.$transaction(async (tx) => {
    await lockMap(tx, mapId);
    const have = await tx.mapString.findMany({ where: { mapId, kind }, select: { fromCode: true, toCode: true } });
    const tied = new Set(have.map((row) => `${row.fromCode}-${row.toCode}`));
    const fresh = pairs.filter(([from, to]) => !tied.has(`${from}-${to}`));
    const room = Math.max(0, MAP_STRINGS_MAX - have.length);
    const taken = fresh.slice(0, room);
    if (taken.length) {
      await tx.mapString.createMany({ data: taken.map(([fromCode, toCode]) => ({ mapId, kind, fromCode, toCode, createdById: userId })), skipDuplicates: true });
    }
    return { added: taken.length, full: fresh.length > room };
  });

/** Untie one string; `true` when it was the map's. */
export const deleteMapStringInDB = async (mapId, stringId) => (await prisma.mapString.deleteMany({ where: { id: stringId, mapId } })).count > 0;

/** Untie every string of a kind on a map; how many went. */
export const deleteAllMapStringsInDB = async (mapId, kind = 'VISITED') => (await prisma.mapString.deleteMany({ where: { mapId, kind } })).count;

/**
 * What the automatic strings are worked out from: the map's own trips (status, start, their
 * stops' places in order) and its visits.
 */
export async function findAutoStringInputs(mapId) {
  const [trips, visits] = await Promise.all([
    prisma.trip.findMany({
      where: { mapId },
      select: { status: true, startDate: true, stops: { select: { countryCode: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
    }),
    prisma.countryVisit.findMany({ where: { mapId }, select: { countryCode: true, status: true, firstVisitedOn: true, createdAt: true } }),
  ]);
  return {
    trips: trips.map((trip) => ({ status: trip.status, startDate: trip.startDate, countryCodes: trip.stops.map((stop) => stop.countryCode).filter(Boolean) })),
    visits,
  };
}
