import { prisma } from '../prisma.js';

// Actor/target as { id, name, email }
const PERSON = { select: { id: true, name: true, email: true } };
const EVENT_INCLUDE = { actor: PERSON, target: PERSON };

const buildEventWhere = ({ level, domain, status, search } = {}) => {
  const where = {};
  if (level) where.level = level;
  if (domain) where.domain = domain;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { message: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
};

// `get-all-events` returns the newest ones only; the admin page pages through the rest
export const ALL_EVENTS_LIMIT = 500;

export const findAllEvents = () =>
  prisma.appEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: ALL_EVENTS_LIMIT,
    include: EVENT_INCLUDE,
  });

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Retention: deletes events older than `olderThanDays` (90 by default), for the
 * daily cron. Uses the `createdAt` index. → `{ count }`
 */
export const deleteOldEvents = async ({ olderThanDays = 90 } = {}) => {
  // 0, a negative or a non-number would delete recent events or everything
  if (!Number.isFinite(olderThanDays) || olderThanDays < 1) {
    throw new RangeError(`deleteOldEvents: olderThanDays must be 1 or more, got ${olderThanDays}`);
  }
  const before = new Date(Date.now() - olderThanDays * DAY_MS);
  return prisma.appEvent.deleteMany({ where: { createdAt: { lt: before } } });
};

// One page (newest first) plus the filtered total
export const findEventsPage = async ({ skip = 0, take = 20, ...filters } = {}) => {
  const where = buildEventWhere(filters);
  const [events, total] = await prisma.$transaction([
    prisma.appEvent.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: EVENT_INCLUDE }),
    prisma.appEvent.count({ where }),
  ]);
  return { events, total };
};

export const findEventById = (eventId) =>
  prisma.appEvent.findUnique({
    where: { id: eventId },
    include: EVENT_INCLUDE,
  });

export const updateEventStatusById = (eventId, status) =>
  prisma.appEvent.update({
    where: { id: eventId },
    data: { status },
    include: EVENT_INCLUDE,
  });

export const deleteEventId = (id) =>
  prisma.appEvent.delete({
    where: { id },
  });

export const deleteAllEventsFromDB = () => prisma.appEvent.deleteMany({});
