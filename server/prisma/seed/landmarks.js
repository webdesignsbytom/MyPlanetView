// Database
import { prisma } from '../../src/prisma.js';
// Seed helpers
import { verifySeeded } from './utils.js';
import { LANDMARKS } from './data/landmarks.js';
// The passport's UNESCO World Heritage Sites (one landmark per inscription, with the
// landmarks.js items that already stand for one)
import { UNESCO_IN_EXISTING, UNESCO_LANDMARKS } from './data/landmarksUnesco.js';
// The map's projection: pins come from the real position
import { projectToMap } from '../../src/utils/projection.js';
import { slugify } from '../../src/utils/slug.js';

const unescoInExisting = new Set(UNESCO_IN_EXISTING);

/**
 * The rows as stored: the 177 of landmarks.js, then the UNESCO sites. `category`
 * documents the radius and isn't a column; `isUnesco` marks every World Heritage Site.
 */
export const landmarkRows = () =>
  [
    ...LANDMARKS.map((landmark) => ({ ...landmark, isUnesco: unescoInExisting.has(landmark.wikidataId) })),
    ...UNESCO_LANDMARKS.map((landmark) => ({ ...landmark, isUnesco: true })),
  ].map(({ category: _category, ...landmark }) => {
    const pin = projectToMap(landmark.latitude, landmark.longitude);
    return { ...landmark, slug: slugify(landmark.name), pinX: pin.x, pinY: pin.y };
  });

export async function seedLandmarks() {
  const rows = landmarkRows();
  await prisma.landmark.createMany({ data: rows });
  await verifySeeded('landmark', prisma.landmark, rows.length);
}
