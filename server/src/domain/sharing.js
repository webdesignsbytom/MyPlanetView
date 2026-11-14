import { prisma } from '../prisma.js';

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

export const markInviteAccepted = (inviteId) =>
  prisma.shareInvite.update({ where: { id: inviteId }, data: { acceptedAt: new Date() } });

export const findUserForSharing = (email) =>
  prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, isActive: true } });
