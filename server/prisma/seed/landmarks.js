// Database
import { prisma } from '../../src/prisma.js';
// Seed helpers
import { verifySeeded } from './utils.js';
import { LANDMARKS } from './data/landmarks.js';
// The map's projection: pins come from the real position
import { projectToMap } from '../../src/utils/projection.js';
import { slugify } from '../../src/utils/slug.js';

/** The rows as stored: `category` documents the radius and isn't a column. */
export const landmarkRows = () =>
  LANDMARKS.map(({ category: _category, ...landmark }) => {
    const pin = projectToMap(landmark.latitude, landmark.longitude);
    return { ...landmark, slug: slugify(landmark.name), pinX: pin.x, pinY: pin.y };
  });

export async function seedLandmarks() {
  const rows = landmarkRows();
  await prisma.landmark.createMany({ data: rows });
  await verifySeeded('landmark', prisma.landmark, rows.length);
}
