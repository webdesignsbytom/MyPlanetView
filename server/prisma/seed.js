// Env (another file with DOTENV_CONFIG_PATH, e.g. the live database's), then the seed's own
// connection: the direct URL (never PgBouncer) and longer transactions
import 'dotenv/config';
import './seed/connection.js';
// Database
import { prisma } from '../src/prisma.js';
// Seed steps
import { assertNotProduction, deleteStoredFiles, wipeDatabase } from './seed/utils.js';
import { seedCountries } from './seed/countries.js';
import { seedLandmarks } from './seed/landmarks.js';
import { seedUsers } from './seed/users.js';
import { seedOwnerAccount } from './seed/owner.js';
import { seedTravelDemo } from './seed/travel.js';
import { seedDemoPhotos } from './seed/photos.js';
import { seedDemoMoments } from './seed/moments.js';
import { seedContactForms } from './seed/contact.js';
import { seedExampleOffers } from './seed/offers.js';
import { seedPlans } from './seed/plans.js';
import { seedDemoVideos } from './seed/videos.js';
import { seedExampleThemes } from './seed/themes.js';
import { seedDemoChallenge } from './seed/challenges.js';

async function seed() {
  assertNotProduction();

  console.log('🌱 Seeding (via better-auth sign-up + direct prisma role/verify updates)');

  // The files the rows point at go first (the last run's demo photos, avatars), as
  // deleting a map or an account deletes its files
  const files = await deleteStoredFiles();
  if (files.files) {
    console.log(`🧹 Stored files deleted: ${files.removed} of ${files.files}`);
    if (files.failed) console.warn(`⚠️  ${files.failed} stored files couldn't be deleted (nothing will point at them; delete them in the bucket by hand)`);
  }
  await wipeDatabase();
  console.log('🧹 Database wiped');

  // Reference data first: sign-up makes each user's default map
  await seedCountries();
  await seedLandmarks();
  await seedUsers();
  // One account per plan: Business and First Class get their subscriptions
  await seedPlans();
  // The owner's own account: First Class for life, Tom and Gigie's map (SEED_OWNER_PASSWORD)
  await seedOwnerAccount();
  await seedTravelDemo();
  // The demo photos go into the private bucket (skipped without one)
  await seedDemoPhotos();
  // The demo couple's timeline, holding those photos, and the trips' covers
  await seedDemoMoments();
  // The First Class account's sample videos (seed-videos/; skipped where a file is missing)
  await seedDemoVideos();
  await seedContactForms();
  await seedExampleOffers();
  // Example monthly photo themes (the real ones are written on the admin page)
  await seedExampleThemes();
  // A demo friends challenge between two seeded accounts
  await seedDemoChallenge();

  console.log('🌱 Seeding complete');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
