import { prisma } from '../prisma.js';

// Profile (minimal: one row per user, username)

export const findProfileByUserId = (userId) =>
  prisma.profile.findUnique({ where: { userId } });

// Map viewing preferences (null when never saved)
export const findMapSettings = async (userId) =>
  (await prisma.profile.findUnique({ where: { userId }, select: { mapSettings: true } }))?.mapSettings ?? null;

/** Saves the settings, creating the Profile row if it's missing. */
export const saveMapSettings = (userId, mapSettings) =>
  prisma.profile.upsert({
    where: { userId },
    update: { mapSettings },
    create: { userId, mapSettings },
    select: { mapSettings: true },
  });

// Leaving (docs/API.md, "Leaving"): what to do with the account's maps and photos

/** `{ leavingPlan, leavingPlanAt }`, or null when there's no profile row. */
export const findLeavingPlan = (userId) =>
  prisma.profile.findUnique({ where: { userId }, select: { leavingPlan: true, leavingPlanAt: true } });

/** Store a checked leaving plan with the time it was saved (creating the Profile row if it's missing). */
export const saveLeavingPlan = (userId, leavingPlan, leavingPlanAt = new Date()) =>
  prisma.profile.upsert({
    where: { userId },
    update: { leavingPlan, leavingPlanAt },
    create: { userId, leavingPlan, leavingPlanAt },
    select: { leavingPlan: true, leavingPlanAt: true },
  });

export const upsertProfileUsername = (userId, username) =>
  prisma.profile.upsert({
    where: { userId },
    update: { username },
    create: { userId, username },
  });
