// Creates or updates the Country and Landmark tables from prisma/seed/data/.
// Never deletes, so it is the way to load them on production (the seed refuses to
// run there). Run after `prisma migrate deploy`, and again whenever the data changes:
//   npm run db:reference
// Env
import 'dotenv/config';
// Database
import { prisma } from '../src/prisma.js';
// Reference data
import { upsertCountries, upsertLandmarks } from '../prisma/seed/reference.js';

try {
  const countries = await upsertCountries();
  console.log(`Countries: ${countries} created or updated`);
  const landmarks = await upsertLandmarks();
  console.log(`Landmarks: ${landmarks} created or updated`);
} catch (err) {
  console.error('Loading reference data failed:', err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
