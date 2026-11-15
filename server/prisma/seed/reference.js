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

// Keyed by Wikidata id, so renaming a landmark (a new name and slug) updates its row
// and its photo matches stay with it. A landmark removed from the data stays in the
// table (photo matches may point at it); delete a retired one by hand.
export async function upsertLandmarks() {
  const rows = landmarkRows();
  for (const { wikidataId, ...fields } of rows) {
    await prisma.landmark.upsert({ where: { wikidataId }, update: fields, create: { wikidataId, ...fields } });
  }
  return rows.length;
}
