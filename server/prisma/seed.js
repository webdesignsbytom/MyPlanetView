// Env
import 'dotenv/config';
// Database
import { prisma } from '../src/prisma.js';
// Seed steps
import { assertNotProduction, wipeDatabase } from './seed/utils.js';
import { seedCountries } from './seed/countries.js';
import { seedLandmarks } from './seed/landmarks.js';
import { seedUsers } from './seed/users.js';
import { seedTravelDemo } from './seed/travel.js';
import { seedDemoPhotos } from './seed/photos.js';
import { seedContactForms } from './seed/contact.js';
import { seedExampleOffers } from './seed/offers.js';
import { seedPlans } from './seed/plans.js';
import { seedDemoVideos } from './seed/videos.js';

async function seed() {
  assertNotProduction();

  console.log('🌱 Seeding (via better-auth sign-up + direct prisma role/verify updates)');

  await wipeDatabase();
  console.log('🧹 Database wiped');

  // Reference data first: sign-up makes each user's default map
  await seedCountries();
  await seedLandmarks();
  await seedUsers();
  // One account per plan: Business and First Class get their subscriptions
  await seedPlans();
  await seedTravelDemo();
  // The demo photos go into the private bucket (skipped without one)
  await seedDemoPhotos();
  // The First Class account's sample videos (seed-videos/; skipped where a file is missing)
  await seedDemoVideos();
  await seedContactForms();
  await seedExampleOffers();

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
