// Reference data (countries and landmarks) loaded without wiping anything, so it
// is safe on the production database: rows are created or updated, never deleted.
// Run with `npm run db:reference`. The dev seed (prisma/seed.js) wipes and inserts
// the same data with createMany instead.
// Database
import { prisma } from '../../src/prisma.js';
// Data
import { COUNTRIES } from './data/countries.js';
import { landmarkRows } from './landmarks.js';

export async function upsertCountries() {
  for (const { code, ...fields } of COUNTRIES) {
    await prisma.country.upsert({ where: { code }, update: fields, create: { code, ...fields } });
  }
  return COUNTRIES.length;
}

// Keyed by slug: renaming a landmark makes a new row, and the old one stays (any
// photo matches keep pointing at it). Remove a retired landmark by hand.
export async function upsertLandmarks() {
  const rows = landmarkRows();
  for (const { slug, ...fields } of rows) {
    await prisma.landmark.upsert({ where: { slug }, update: fields, create: { slug, ...fields } });
  }
  return rows.length;
}
