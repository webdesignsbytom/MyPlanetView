import { prisma } from '../prisma.js';

// Badges and goals (docs/API.md, "Badges and goals"). Progress is counted from the map's
// data (services/travel/achievements.js); only awards and goals are stored.

export const findBadgeAwards = (mapId) =>
  prisma.badgeAward.findMany({ where: { mapId }, select: { badgeKey: true, earnedAt: true } });

/** Award badges; one already there is left alone, so two requests can't award one twice. */
export const createBadgeAwards = (mapId, badgeKeys) =>
  badgeKeys.length
    ? prisma.badgeAward.createMany({ data: badgeKeys.map((badgeKey) => ({ mapId, badgeKey })), skipDuplicates: true })
    : { count: 0 };

const GOAL_SELECT = {
  id: true,
  mapId: true,
  kind: true,
  title: true,
  target: true,
  countryCodes: true,
  region: true,
  deadline: true,
  achievedAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
};

export const findGoals = (mapId) =>
  prisma.goal.findMany({ where: { mapId }, select: GOAL_SELECT, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });

export const countGoals = (mapId) => prisma.goal.count({ where: { mapId } });

export const findGoal = (goalId) => prisma.goal.findUnique({ where: { id: goalId }, select: GOAL_SELECT });

export const createGoalInDB = (data) => prisma.goal.create({ data, select: GOAL_SELECT });

export const updateGoalInDB = (goalId, data) => prisma.goal.update({ where: { id: goalId }, data, select: GOAL_SELECT });

export const deleteGoalInDB = (goalId) => prisma.goal.delete({ where: { id: goalId } });

/**
 * Mark goals achieved now; one achieved meanwhile keeps its first date. -> the ids this
 * call marked (only those: two requests at once never both announce the same goal).
 */
export const markGoalsAchieved = async (goalIds, now = new Date()) => {
  if (!goalIds.length) return [];
  const marked = await prisma.goal.updateManyAndReturn({
    where: { id: { in: goalIds }, achievedAt: null },
    data: { achievedAt: now },
    select: { id: true },
  });
  return marked.map((goal) => goal.id);
};

/**
 * The map's completed trips for the travellers' badges: `[{ travellerIds, countryCodes,
 * startDate, endDate }]` (dates "YYYY-MM-DD" or null). Three flat reads, merged here.
 */
export async function findCompletedTripsForTravellers(mapId) {
  const completed = { mapId, status: 'COMPLETED' };
  const [trips, travellers, stops] = await Promise.all([
    prisma.trip.findMany({ where: completed, select: { id: true, startDate: true, endDate: true } }),
    prisma.tripTraveller.findMany({ where: { trip: completed }, select: { tripId: true, travellerId: true } }),
    prisma.tripStop.findMany({ where: { trip: completed }, select: { tripId: true, countryCode: true } }),
  ]);
  const day = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null);
  const byTrip = new Map(trips.map((t) => [t.id, { travellerIds: [], countryCodes: [], startDate: day(t.startDate), endDate: day(t.endDate) }]));
  for (const t of travellers) byTrip.get(t.tripId)?.travellerIds.push(t.travellerId);
  for (const s of stops) byTrip.get(s.tripId)?.countryCodes.push(s.countryCode);
  return [...byTrip.values()];
}
