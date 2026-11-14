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

export const upsertProfileUsername = (userId, username) =>
  prisma.profile.upsert({
    where: { userId },
    update: { username },
    create: { userId, username },
  });
