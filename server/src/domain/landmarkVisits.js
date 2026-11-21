// Landmarks ticked "been here" on a map (docs/API.md "Collecting"): thin queries.
import { prisma } from '../prisma.js';
import { createMissingVisits } from './maps.js';

/** The landmarks a map has ticked, as ids. */
export const findTickedLandmarkIds = async (mapId) =>
  (await prisma.landmarkVisit.findMany({ where: { mapId }, select: { landmarkId: true } })).map((row) => row.landmarkId);

/** Tick one (again is fine), and mark its place visited (MANUAL), in one transaction. */
export const tickLandmarkInDB = ({ mapId, landmarkId, userId, place }) =>
  prisma.$transaction(async (tx) => {
    await tx.landmarkVisit.createMany({ data: [{ mapId, landmarkId, createdById: userId }], skipDuplicates: true });
    await createMissingVisits(mapId, [place], 'MANUAL', tx);
  });

/** Untick one. The country stays visited (visits are never taken back). */
export const untickLandmarkInDB = (mapId, landmarkId) => prisma.landmarkVisit.deleteMany({ where: { mapId, landmarkId } });
