// The demo couple's timeline (data/demoTravels.js DEMO_MOMENTS; 24 Nov 2026, the user's wish):
// both births, the move, the first trip, engaged, married, an anniversary and the trips' days,
// on the USER's map. After photos.js, so a moment can hold the photos it names (seed-photos/
// slugs; skipped when the photos were) and each trip gets its cover photo.
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../src/prisma.js';
import { DEMO_MOMENTS, DEMO_TRIPS } from './data/demoTravels.js';
import { day, demoLandmarkIds, findDemoMap, named } from './travel.js';
import { SEED_PHOTOS_DIR } from './photos.js';

/** The demo map's photos by their seed-photos/ slug (found by caption): `Map(slug → id)`. */
async function demoPhotoIds(mapId, dir) {
  const manifest = JSON.parse(await fs.readFile(path.join(dir, 'photos.json'), 'utf8'));
  const photos = await prisma.photo.findMany({ where: { mapId }, select: { id: true, caption: true } });
  const byCaption = new Map(photos.map((p) => [p.caption, p.id]));
  return new Map(manifest.filter((entry) => byCaption.has(entry.caption)).map((entry) => [entry.slug, byCaption.get(entry.caption)]));
}

export async function seedDemoMoments({ dir = SEED_PHOTOS_DIR, ...accounts } = {}) {
  const { users, map } = await findDemoMap(accounts);
  const travellerIds = { owner: map.travellers.find((t) => t.userId === users.owner.id)?.id ?? map.travellers[0].id, partner: map.travellers.find((t) => t.userId === users.partner.id).id };
  const trips = await prisma.trip.findMany({ where: { mapId: map.id }, select: { id: true, title: true } });
  const tripId = (key) => {
    const trip = DEMO_TRIPS.find((t) => t.key === key);
    return trip ? (trips.find((t) => t.title === named(trip.title))?.id ?? null) : null;
  };
  const photos = await demoPhotoIds(map.id, dir);
  const landmarks = await demoLandmarkIds(DEMO_MOMENTS.map((m) => m.landmark));

  for (const m of DEMO_MOMENTS) {
    // A moment only the partner was in is theirs; the rest the owner's
    const by = m.travellers.length === 1 && m.travellers[0] === 'partner' ? users.partner : users.owner;
    const photoIds = (m.photos ?? []).map((slug) => photos.get(slug)).filter(Boolean);
    await prisma.moment.create({
      data: {
        mapId: map.id,
        createdById: by.id,
        kind: m.kind,
        title: named(m.title),
        text: m.text ?? null,
        happenedOn: day(m.happenedOn),
        datePrecision: m.datePrecision,
        countryCode: m.countryCode,
        landmarkId: m.landmark ? landmarks.get(m.landmark) : null,
        placeName: m.placeName ?? null,
        latitude: m.spot?.latitude ?? null,
        longitude: m.spot?.longitude ?? null,
        spotShared: m.spot?.shared ?? false,
        tripId: m.trip ? tripId(m.trip) : null,
        hidden: m.hidden ?? false,
        travellers: { create: m.travellers.map((role) => ({ travellerId: travellerIds[role] })) },
        photos: { create: photoIds.map((photoId, position) => ({ photoId, position })) },
      },
    });
  }

  // Each trip's cover, where its photo was seeded
  let covers = 0;
  for (const trip of DEMO_TRIPS.filter((t) => t.cover && photos.has(t.cover))) {
    const id = tripId(trip.key);
    if (!id) continue;
    await prisma.trip.update({ where: { id }, data: { coverPhotoId: photos.get(trip.cover) } });
    covers += 1;
  }

  console.log(`✅ Seeded the demo couple's ${DEMO_MOMENTS.length} moments on ${users.owner.email}'s map (${photos.size} photos to show, ${covers} trip covers)`);
  return { moments: DEMO_MOMENTS.length, covers };
}
