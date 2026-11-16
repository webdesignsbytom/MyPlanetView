// Demo travel data for the seeded USER account (its photos are photos.js, next).
// Its default map (made by the sign-up hook) becomes a couple's map, and the
// seeded ADMIN is added as an editor (the partner with their own login).
import { prisma } from '../../src/prisma.js';
import { seedAccounts } from './users.js';
import { generateShareCode } from '../../src/utils/shareCodes.js';

const day = (iso) => new Date(`${iso}T00:00:00.000Z`);

export async function seedTravelDemo() {
  const userEmail = seedAccounts.find((a) => a.role === 'USER').email;
  const partnerEmail = seedAccounts.find((a) => a.role === 'ADMIN').email;
  const user = await prisma.user.findUniqueOrThrow({ where: { email: userEmail }, select: { id: true } });
  const partner = await prisma.user.findUniqueOrThrow({ where: { email: partnerEmail }, select: { id: true } });

  const map = await prisma.travelMap.findFirstOrThrow({
    where: { ownerId: user.id, isDefault: true },
    select: { id: true, travellers: { select: { id: true }, orderBy: { position: 'asc' } } },
  });

  // A couple: the account holder plus a partner who signs in separately
  await prisma.travelMap.update({
    where: { id: map.id },
    data: { name: "Sam & Alex's travels", groupType: 'COUPLE' },
  });
  const sam = map.travellers[0];
  await prisma.traveller.update({
    where: { id: sam.id },
    data: { name: 'Sam', birthCountryCode: 'GB', favouriteCountryCode: 'JP' },
  });
  const alex = await prisma.traveller.create({
    data: { mapId: map.id, name: 'Alex', position: 1, userId: partner.id, birthCountryCode: 'IE', favouriteCountryCode: 'IT' },
  });
  await prisma.mapMember.create({ data: { mapId: map.id, userId: partner.id, role: 'EDITOR' } });

  // Countries: some from before they met (manual), the rest from the completed trip below
  await prisma.countryVisit.createMany({
    data: [
      { mapId: map.id, countryCode: 'GB', status: 'LIVED', source: 'MANUAL' },
      { mapId: map.id, countryCode: 'IE', status: 'VISITED', source: 'MANUAL', firstVisitedOn: day('2019-08-02') },
      { mapId: map.id, countryCode: 'ES', status: 'VISITED', source: 'MANUAL', firstVisitedOn: day('2021-06-14') },
      { mapId: map.id, countryCode: 'PT', status: 'VISITED', source: 'MANUAL', firstVisitedOn: day('2022-04-09') },
      { mapId: map.id, countryCode: 'US', status: 'VISITED', source: 'MANUAL', firstVisitedOn: day('2018-10-20') },
      { mapId: map.id, countryCode: 'FR', status: 'VISITED', source: 'TRIP', firstVisitedOn: day('2025-05-03') },
      { mapId: map.id, countryCode: 'CH', status: 'VISITED', source: 'TRIP', firstVisitedOn: day('2025-05-07') },
      { mapId: map.id, countryCode: 'IT', status: 'VISITED', source: 'TRIP', firstVisitedOn: day('2025-05-10') },
      { mapId: map.id, countryCode: 'PE', status: 'WANT_TO_GO', source: 'MANUAL' },
    ],
  });

  const landmark = (name) => prisma.landmark.findFirstOrThrow({ where: { name }, select: { id: true } });
  const [eiffel, chillon, colosseum, machuPicchu] = await Promise.all([
    landmark('Eiffel Tower'),
    landmark('Château de Chillon'),
    landmark('Colosseum'),
    landmark('Machu Picchu'),
  ]);

  // A completed trip (both went) and a planned one (Sam is going alone)
  await prisma.trip.create({
    data: {
      mapId: map.id,
      createdById: user.id,
      title: 'Paris to Rome by train',
      description: 'Ten days across three countries, mostly on trains.',
      status: 'COMPLETED',
      startDate: day('2025-05-03'),
      endDate: day('2025-05-13'),
      shareCode: generateShareCode(),
      travellers: { create: [{ travellerId: sam.id }, { travellerId: alex.id }] },
      stops: {
        create: [
          { position: 0, countryCode: 'FR', landmarkId: eiffel.id, placeName: 'Paris', arriveOn: day('2025-05-03'), leaveOn: day('2025-05-07') },
          { position: 1, countryCode: 'CH', landmarkId: chillon.id, placeName: 'Montreux', arriveOn: day('2025-05-07'), leaveOn: day('2025-05-10') },
          { position: 2, countryCode: 'IT', landmarkId: colosseum.id, placeName: 'Rome', arriveOn: day('2025-05-10'), leaveOn: day('2025-05-13') },
        ],
      },
    },
  });
  await prisma.trip.create({
    data: {
      mapId: map.id,
      createdById: user.id,
      title: 'Peru next spring',
      status: 'PLANNED',
      startDate: day('2027-04-10'),
      shareCode: generateShareCode(),
      travellers: { create: [{ travellerId: sam.id }] },
      stops: { create: [{ position: 0, countryCode: 'PE', landmarkId: machuPicchu.id, placeName: 'Cusco' }] },
    },
  });

  console.log(`✅ Seeded demo travel data on ${userEmail}'s map (couple, partner ${partnerEmail} as editor)`);
}
