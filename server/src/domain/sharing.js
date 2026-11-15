import { prisma } from '../prisma.js';
import { higherRole } from '../utils/access.js';

// Share invites (people added by email who have no account yet)

const target = ({ mapId, tripId }) => (mapId ? { mapId } : { tripId });

const INVITE_SELECT = { id: true, email: true, role: true, expiresAt: true, mapId: true, tripId: true };

export const findPendingInvites = ({ mapId, tripId }) =>
  prisma.shareInvite.findMany({
    where: { ...target({ mapId, tripId }), acceptedAt: null, expiresAt: { gt: new Date() } },
    select: INVITE_SELECT,
    orderBy: { createdAt: 'asc' },
  });

/** A new invite replaces any earlier pending one for the same address and resource. */
export const replaceInviteInDB = ({ mapId, tripId, email, role, invitedById, tokenHash, expiresAt }) =>
  prisma.$transaction(async (tx) => {
    await tx.shareInvite.deleteMany({ where: { ...target({ mapId, tripId }), email, acceptedAt: null } });
    return tx.shareInvite.create({
      data: { mapId: mapId ?? null, tripId: tripId ?? null, email, role, invitedById, tokenHash, expiresAt },
      select: INVITE_SELECT,
    });
  });

export const deleteInviteInDB = ({ inviteId, mapId, tripId }) =>
  prisma.shareInvite.deleteMany({ where: { id: inviteId, ...target({ mapId, tripId }), acceptedAt: null } });

export const findUsableInviteByHash = (tokenHash) =>
  prisma.shareInvite.findFirst({
    where: { tokenHash, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: INVITE_SELECT,
  });

/** Pending invites for an address (turned into access once it's verified). */
export const findUsableInvitesForEmail = (email) =>
  prisma.shareInvite.findMany({
    where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: INVITE_SELECT,
  });

/**
 * Turn an invite into access for `userId`, in one transaction: the invite is marked
 * accepted (only if it's still usable, so two accepts can't both count) and the member
 * row is written, never lowering a role they already have. -> false when the invite
 * was used or expired meanwhile.
 */
export const acceptInviteInDB = (invite, userId) =>
  prisma.$transaction(async (tx) => {
    const now = new Date();
    const claimed = await tx.shareInvite.updateMany({
      where: { id: invite.id, acceptedAt: null, expiresAt: { gt: now } },
      data: { acceptedAt: now },
    });
    if (!claimed.count) return false;
    const [model, where, create] = invite.mapId
      ? ['mapMember', { mapId_userId: { mapId: invite.mapId, userId } }, { mapId: invite.mapId, userId }]
      : ['tripMember', { tripId_userId: { tripId: invite.tripId, userId } }, { tripId: invite.tripId, userId }];
    const current = await tx[model].findUnique({ where, select: { role: true } });
    const role = higherRole(current?.role, invite.role);
    await tx[model].upsert({ where, create: { ...create, role }, update: { role } });
    return true;
  });

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Retention, for the daily cron: invites accepted, or expired, more than
 * `olderThanDays` ago (cancelled and replaced ones are deleted at once). -> `{ count }`
 */
export const deleteOldInvites = ({ olderThanDays = 30 } = {}) => {
  if (!Number.isFinite(olderThanDays) || olderThanDays < 1) {
    throw new RangeError(`deleteOldInvites: olderThanDays must be 1 or more, got ${olderThanDays}`);
  }
  const before = new Date(Date.now() - olderThanDays * DAY_MS);
  return prisma.shareInvite.deleteMany({
    where: { OR: [{ acceptedAt: { lt: before } }, { expiresAt: { lt: before } }] },
  });
};

/** The account an address belongs to, if any: only a verified, active one is added directly. */
export const findUserForSharing = (email) =>
  prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isActive: true, emailVerified: true },
  });
