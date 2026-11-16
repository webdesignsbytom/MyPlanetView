// A demo friends challenge (docs/API.md, "Friends challenges"): the demo couple's account
// (USER) started "Most new countries this year", counting their map, and the ADMIN joined
// with their own default map, so the leaderboard has two people in development.
import { prisma } from '../../src/prisma.js';
import { generateShareCode } from '../../src/utils/shareCodes.js';
import { seedAccounts } from './users.js';

const emailOf = (role) => seedAccounts.find((a) => a.role === role).email;

export async function seedDemoChallenge({ now = new Date() } = {}) {
  const [starter, friend] = await Promise.all(
    ['USER', 'ADMIN'].map((role) => prisma.user.findUnique({ where: { email: emailOf(role) }, select: { id: true } })),
  );
  if (!starter || !friend) return;
  const mapOf = (user) => prisma.travelMap.findFirst({ where: { ownerId: user.id, isDefault: true }, select: { id: true } });
  const [starterMap, friendMap] = await Promise.all([mapOf(starter), mapOf(friend)]);
  const year = now.getUTCFullYear();
  const challenge = await prisma.friendChallenge.create({
    data: {
      title: 'Most new countries this year',
      measure: 'NEW_COUNTRIES',
      startsOn: new Date(Date.UTC(year, 0, 1)),
      endsOn: new Date(Date.UTC(year, 11, 31)),
      joinCode: generateShareCode(),
      createdById: starter.id,
      entries: {
        create: [
          { userId: starter.id, mapId: starterMap?.id ?? null },
          { userId: friend.id, mapId: friendMap?.id ?? null },
        ],
      },
    },
  });
  console.log(`✅ Seeded a demo friends challenge (${challenge.title})`);
}
