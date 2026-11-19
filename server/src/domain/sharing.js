import { prisma } from '../prisma.js';
import { higherRole } from '../utils/access.js';

// Share invites (people added by email who have no account yet)

const target = ({ mapId, tripId }) => (mapId ? { mapId } : { tripId });

const INVITE_SELECT = { id: true, email: true, role: true, expiresAt: true, mapId: true, tripId: true, travellerId: true, createdAt: true };

export const findPendingInvites = ({ mapId, tripId }) =>
  prisma.shareInvite.findMany({
    where: { ...target({ mapId, tripId }), acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { ...INVITE_SELECT, traveller: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });

const replaceInvite = async (tx, { mapId, tripId, email, role, invitedById, tokenHash, expiresAt, travellerId = null }) => {
  await tx.shareInvite.deleteMany({ where: { ...target({ mapId, tripId }), email, acceptedAt: null } });
  return tx.shareInvite.create({
    data: { mapId: mapId ?? null, tripId: tripId ?? null, email, role, invitedById, tokenHash, expiresAt, travellerId },
    select: { ...INVITE_SELECT, traveller: { select: { name: true } } },
  });
};

/** A new invite replaces any earlier pending one for the same address and resource (in `tx` when given). */
export const replaceInviteInDB = (data, tx) => (tx ? replaceInvite(tx, data) : prisma.$transaction((t) => replaceInvite(t, data)));

/**
 * `fn(tx)` with the map's or the trip's row locked (FOR NO KEY UPDATE), so the seats counted
 * inside it (the editor and trip-people caps) can't be taken by another request at the same
 * moment (19 Nov 2026, the audit). -> what `fn` returns
 */
export const withShareTargetLocked = ({ mapId, tripId }, fn) =>
  prisma.$transaction(async (tx) => {
    if (mapId) await tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;
    else await tx.$queryRaw`SELECT 1 FROM "trip" WHERE "id" = ${tripId} FOR NO KEY UPDATE`;
    return fn(tx);
  });

export const deleteInviteInDB = ({ inviteId, mapId, tripId }) =>
  prisma.shareInvite.deleteMany({ where: { id: inviteId, ...target({ mapId, tripId }), acceptedAt: null } });

export const findUsableInviteByHash = (tokenHash) =>
  prisma.shareInvite.findFirst({
    where: { tokenHash, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: INVITE_SELECT,
  });

/**
 * What an invite's link shows before anyone signs in (GET /api/invites/:token): the address
 * it was sent to, what it's for, who sent it and, for a co-owner, the traveller they'll be.
 */
export const findInvitePreviewByHash = (tokenHash) =>
  prisma.shareInvite.findFirst({
    where: { tokenHash, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: {
      ...INVITE_SELECT,
      map: { select: { name: true } },
      trip: { select: { title: true } },
      invitedBy: { select: { name: true } },
      traveller: { select: { name: true } },
    },
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
    let role = higherRole(current?.role, invite.role);
    // A co-owner becomes their traveller; if that traveller has gone to someone else since
    // (or was deleted), they join as an editor rather than not at all
    if (invite.role === 'CO_OWNER' && current?.role !== 'CO_OWNER') {
      const linked = invite.travellerId && (await linkTravellerInTx(tx, { mapId: invite.mapId, userId, travellerId: invite.travellerId }));
      if (!linked) role = higherRole(current?.role, 'EDITOR');
    }
    await tx[model].upsert({ where, create: { ...create, role }, update: { role } });
    return true;
  });

/**
 * Make `travellerId` (one of the map's) the traveller `userId` is, in `tx`: any other
 * traveller of theirs on the map lets go first (one per account per map). -> false when the
 * traveller isn't on the map or is someone else's.
 */
export async function linkTravellerInTx(tx, { mapId, userId, travellerId }) {
  const traveller = await tx.traveller.findFirst({ where: { id: travellerId, mapId }, select: { userId: true } });
  if (!traveller || (traveller.userId && traveller.userId !== userId)) return false;
  await tx.traveller.updateMany({ where: { mapId, userId, id: { not: travellerId } }, data: { userId: null } });
  await tx.traveller.update({ where: { id: travellerId }, data: { userId } });
  return true;
}

/** Let go of the traveller `userId` is on a map (a co-owner who leaves or is made an editor), in `db`. */
export const unlinkTravellerInDB = (mapId, userId, db = prisma) =>
  db.traveller.updateMany({ where: { mapId, userId }, data: { userId: null } });

/**
 * Can `travellerId` be a new co-owner's, in `tx`? One of the map's travellers, no one's yet
 * (or already `userId`'s), and not waiting on another address's co-owner invite.
 */
export async function travellerFreeForCoOwner(tx, { mapId, travellerId, userId = null, email = null }) {
  const now = new Date();
  const [traveller, pending] = await Promise.all([
    tx.traveller.findFirst({ where: { id: travellerId, mapId }, select: { userId: true } }),
    tx.shareInvite.count({
      where: { travellerId, acceptedAt: null, expiresAt: { gt: now }, ...(email ? { email: { not: email } } : {}) },
    }),
  ]);
  if (!traveller || pending) return false;
  return !traveller.userId || traveller.userId === userId;
}

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

/** Who owns a shared map (or a trip's map), for the sharing reply's first row: co-owners see them too. */
export const findSharingOwner = (userId) =>
  userId ? prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }) : null;

/** The account an address belongs to, if any: only a verified, active one is added directly. */
export const findUserForSharing = (email) =>
  prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isActive: true, emailVerified: true },
  });
