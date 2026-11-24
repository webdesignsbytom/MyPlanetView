// Demo travel data for the seeded USER account (its photos are photos.js, its moments and the
// trips' covers moments.js, both after). Its default map (made by the sign-up hook) becomes a
// couple's map, "Sam & Alex's travels", with the seeded ADMIN as an editor (the partner with
// their own login), and gets the demo couple's travels (data/demoTravels.js, mock mode's too;
// 24 Nov 2026, the user's wish): 20 places in a clear order, every kind of trip, both birth
// dates, heritage sites ticked, every trip's flights, the safari's One Shots and the strings.
// The other seeded accounts' own travellers get a birth date.
import { prisma } from '../../src/prisma.js';
import { seedAccounts } from './users.js';
import {
  DEMO_FLIGHTS,
  DEMO_LANDMARK_TICKS,
  DEMO_ONE_SHOTS,
  DEMO_STATES,
  DEMO_STRINGS,
  DEMO_TRAVELLERS,
  DEMO_TRIPS,
  DEMO_VISITS,
} from './data/demoTravels.js';

export const day = (iso) => (iso ? new Date(`${iso}T00:00:00.000Z`) : null);

// The travellers' names on this map, for the history's `{owner}` and `{partner}`
export const DEMO_NAMES = { owner: 'Sam', partner: 'Alex' };
export const named = (text) => (text ? text.replace(/\{owner\}/g, DEMO_NAMES.owner).replace(/\{partner\}/g, DEMO_NAMES.partner) : null);

// The other seeded accounts' birth dates, on their own map's traveller
const OTHER_BIRTH_DATES = { 'tom@gmail.com': DEMO_TRAVELLERS.partner.birthDate, 'dev@gmail.com': '1993-03-21', 'business@gmail.com': '1984-11-07', 'firstclass@gmail.com': '1987-08-09' };

const emailOf = (role) => seedAccounts.find((a) => a.role === role).email;

/**
 * The demo couple's accounts and map: `{ users: { owner, partner }, map }`. `ownerEmail` owns
 * the map (its default one), `partnerEmail` is the partner; both default to the seeded accounts.
 */
export async function findDemoMap({ ownerEmail = emailOf('USER'), partnerEmail = emailOf('ADMIN') } = {}) {
  const [owner, partner] = await Promise.all(
    [ownerEmail, partnerEmail].map((address) => prisma.user.findUniqueOrThrow({ where: { email: address }, select: { id: true, email: true } })),
  );
  const map = await prisma.travelMap.findFirstOrThrow({
    where: { ownerId: owner.id, isDefault: true },
    select: { id: true, travellers: { select: { id: true, userId: true }, orderBy: { position: 'asc' } } },
  });
  return { users: { owner, partner }, map };
}

/** The landmarks the history names, by slug: `Map(slug → id)`; one missing stops the seed. */
export async function demoLandmarkIds(slugs) {
  const wanted = [...new Set(slugs.filter(Boolean))];
  const rows = await prisma.landmark.findMany({ where: { slug: { in: wanted } }, select: { id: true, slug: true } });
  const ids = new Map(rows.map((row) => [row.slug, row.id]));
  const missing = wanted.filter((slug) => !ids.has(slug));
  if (missing.length) throw new Error(`data/demoTravels.js names landmarks the seed has no row for: ${missing.join(', ')}`);
  return ids;
}

export async function seedTravelDemo(accounts = {}) {
  const { users, map } = await findDemoMap(accounts);

  // A couple: the account holder plus a partner who signs in separately. The UK as one place,
  // as mock mode's demo map
  await prisma.travelMap.update({ where: { id: map.id }, data: { name: "Sam & Alex's travels", groupType: 'COUPLE', splitUk: false } });
  const traveller = (role) => ({ ...DEMO_TRAVELLERS[role], birthDate: day(DEMO_TRAVELLERS[role].birthDate) });
  const sam = map.travellers[0];
  await prisma.traveller.update({ where: { id: sam.id }, data: { name: DEMO_NAMES.owner, ...traveller('owner') } });
  const alex = await prisma.traveller.create({ data: { mapId: map.id, name: DEMO_NAMES.partner, position: 1, userId: users.partner.id, ...traveller('partner') } });
  await prisma.mapMember.create({ data: { mapId: map.id, userId: users.partner.id, role: 'EDITOR' } });
  const travellerIds = { owner: sam.id, partner: alex.id };
  const who = (roles) => roles.map((role) => ({ travellerId: travellerIds[role] }));

  await prisma.countryVisit.createMany({
    data: DEMO_VISITS.map((v) => ({ mapId: map.id, countryCode: v.countryCode, status: v.status, source: v.source, firstVisitedOn: day(v.firstVisitedOn), notes: v.notes })),
  });

  const landmarks = await demoLandmarkIds([...DEMO_TRIPS.flatMap((t) => t.stops.map((s) => s.landmark)), ...DEMO_LANDMARK_TICKS.map((t) => t.landmark)]);
  const tripIds = {};
  for (const trip of DEMO_TRIPS) {
    const made = await prisma.trip.create({
      data: {
        mapId: map.id,
        createdById: users[trip.createdBy].id,
        title: named(trip.title),
        description: trip.description,
        status: trip.status,
        startDate: day(trip.startDate),
        endDate: day(trip.endDate),
        linkAccess: trip.linkAccess ?? 'RESTRICTED',
        shareCode: trip.shareCode,
        travellers: { create: who(trip.travellers) },
        stops: {
          create: trip.stops.map((stop, position) => ({
            position,
            countryCode: stop.countryCode,
            landmarkId: stop.landmark ? landmarks.get(stop.landmark) : null,
            placeName: stop.placeName,
            arriveOn: day(stop.arriveOn),
            leaveOn: day(stop.leaveOn),
            notes: stop.notes,
          })),
        },
      },
      select: { id: true },
    });
    tripIds[trip.key] = made.id;
  }

  await prisma.flight.createMany({
    data: DEMO_FLIGHTS.map((f) => ({
      mapId: map.id,
      tripId: tripIds[f.trip],
      fromAirport: f.from,
      toAirport: f.to,
      flownOn: day(f.flownOn),
      carrier: f.carrier,
      flightNumber: f.flightNumber,
      distanceKm: f.distanceKm,
      source: f.source,
      createdById: users[f.by].id,
    })),
  });
  // Heritage sites ticked "been here": each a passport stamp, dated by its tick
  await prisma.landmarkVisit.createMany({
    data: DEMO_LANDMARK_TICKS.map((tick) => ({ mapId: map.id, landmarkId: landmarks.get(tick.landmark), createdById: users[tick.by].id, createdAt: new Date(`${tick.on}T12:00:00.000Z`) })),
  });
  await prisma.mapString.createMany({ data: DEMO_STRINGS.map(([fromCode, toCode]) => ({ mapId: map.id, fromCode, toCode, createdById: users.owner.id })) });
  for (const shot of DEMO_ONE_SHOTS) {
    await prisma.oneShot.create({
      data: {
        mapId: map.id,
        itemKey: shot.itemKey,
        seenOn: day(shot.seenOn),
        datePrecision: shot.datePrecision,
        countryCode: shot.countryCode,
        notes: shot.notes,
        createdById: users.owner.id,
        travellers: { create: who(shot.travellers) },
      },
    });
  }
  await prisma.subdivisionVisit.createMany({ data: DEMO_STATES.map((code) => ({ mapId: map.id, subdivisionCode: code, countryCode: 'US', status: 'VISITED' })) });

  // Everyone else's own traveller (their default map's) gets a birth date
  for (const [email, birthDate] of Object.entries(OTHER_BIRTH_DATES)) {
    await prisma.traveller.updateMany({ where: { position: 0, map: { isDefault: true, owner: { email } } }, data: { birthDate: day(birthDate) } });
  }

  console.log(
    `✅ Seeded the demo couple's travels on ${users.owner.email}'s map (partner ${users.partner.email} as editor): ${DEMO_VISITS.length} places, ${DEMO_TRIPS.length} trips, ${DEMO_FLIGHTS.length} flights, ${DEMO_LANDMARK_TICKS.length} landmarks ticked`,
  );
}
