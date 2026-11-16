// Database
import { prisma } from '../../src/prisma.js';

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

export async function wipeDatabase() {
  await prisma.$transaction([
    // Travel (FK-safe order: moments before countries, photos before their media, trips
    // before maps)
    prisma.momentPhoto.deleteMany(),
    prisma.momentTraveller.deleteMany(),
    prisma.moment.deleteMany(),
    prisma.tripMap.deleteMany(),
    prisma.landmarkCover.deleteMany(),
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
