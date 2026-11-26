// Database
import { prisma } from '../../src/prisma.js';
// Storage
import { deleteStoredFilesOnly } from '../../src/services/s3/mediaService.js';

// Refuse to seed a production database
export function assertNotProduction() {
  if (process.env.IS_PRODUCTION_DATABASE === 'true') {
    throw new Error(
      'Refusing to seed: IS_PRODUCTION_DATABASE=true is set in the current ' +
        'environment. This script wipes every table — it must never run ' +
        'against a production database. If this is genuinely not production, ' +
        'remove/unset IS_PRODUCTION_DATABASE before running the seed again.'
    );
  }
}

/**
 * Delete the stored files the database's MediaItem rows point at (photos in the private
 * bucket, avatars and contact images in the public one), before wipeDatabase drops the
 * rows: as deleting a map or an account deletes its files. The demo photos are stored at
 * new keys each run, as uploads are, so without this every re-seed would leave the last
 * run's files behind with nothing pointing at them (the daily clean-up finds files by
 * their rows). The posters and landmark photos have no rows and are never touched.
 * `where` narrows the rows (the tests). A file that can't be deleted is reported, and the
 * seed goes on. -> `{ files, removed, failed }`
 */
export async function deleteStoredFiles({ where = {} } = {}) {
  const keys = (await prisma.mediaItem.findMany({ where, select: { key: true } })).map((m) => m.key);
  if (!keys.length) return { files: 0, removed: 0, failed: 0 };
  const { removed, failed } = await deleteStoredFilesOnly(keys);
  return { files: keys.length, removed, failed };
}

export async function wipeDatabase() {
  await prisma.$transaction([
    // Travel (FK-safe order: moments before countries, photos before their media, trips
    // before maps)
    prisma.momentPhoto.deleteMany(),
    prisma.momentTraveller.deleteMany(),
    prisma.moment.deleteMany(),
    prisma.tripMap.deleteMany(),
    prisma.landmarkCover.deleteMany(),
    prisma.photoThemeEntry.deleteMany(),
    prisma.photoTheme.deleteMany(),
    prisma.friendChallengeEntry.deleteMany(),
    prisma.friendChallenge.deleteMany(),
    prisma.offerClickDaily.deleteMany(),
    prisma.affiliateOffer.deleteMany(),
    prisma.badgeAward.deleteMany(),
    prisma.goal.deleteMany(),
    prisma.photoLandmark.deleteMany(),
    prisma.photoVariant.deleteMany(),
    prisma.photo.deleteMany(),
    prisma.tripStop.deleteMany(),
    prisma.tripTraveller.deleteMany(),
    prisma.tripMember.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.shareInvite.deleteMany(),
    prisma.countryVisit.deleteMany(),
    prisma.mapMember.deleteMany(),
    prisma.traveller.deleteMany(),
    prisma.travelMap.deleteMany(),
    // Postcards point at a country and a landmark (docs/API.md "Postcards"), so they go first
    prisma.postcard.deleteMany(),
    prisma.landmark.deleteMany(),
    prisma.country.deleteMany(),
    prisma.rateLimit.deleteMany(),
    prisma.authRateLimit.deleteMany(),

    // App tables (FK-safe order)
    prisma.avatarMediaItem.deleteMany(),
    prisma.mediaItem.deleteMany(),
    prisma.appEvent.deleteMany(),
    prisma.contactForm.deleteMany(),

    // better-auth tables
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.promoCode.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

// Confirm seeded row count
export async function verifySeeded(label, model, expectedCount) {
  const actualCount = await model.count();
  if (actualCount !== expectedCount) {
    throw new Error(
      `Seed verification failed for ${label}: expected ${expectedCount} row(s), found ${actualCount} in the database`
    );
  }
  console.log(`✅ Verified ${label}: ${actualCount} row(s) in database`);
}
