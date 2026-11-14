import { prisma } from '../prisma.js';

export const findAllUsers = () =>
  prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

// Safe admin view of a user (no account/session data)
export const ADMIN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  role: true,
  isActive: true,
  image: true,
  createdAt: true,
  updatedAt: true,
};

const buildUserWhere = ({ search, role, isActive } = {}) => {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = { equals: role, mode: 'insensitive' };
  if (typeof isActive === 'boolean') where.isActive = isActive;
  return where;
};

// One page of users plus the filtered total
export const findUsersPage = async ({ skip = 0, take = 20, ...filters } = {}) => {
  const where = buildUserWhere(filters);
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, select: ADMIN_USER_SELECT }),
    prisma.user.count({ where }),
  ]);
  return { users, total };
};

export const findUserByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
  });

export const findUserByUsername = (username) =>
  prisma.user.findFirst({
    where: { profile: { username } },
    include: { profile: true },
  });

export const findUsersByRole = (role) =>
  prisma.user.findMany({
    where: {
      role,
    },
  });

export const findMinimalUserById = (userId) =>
  prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: { id: true, email: true },
  });

export const findMinimalUserByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

// Passwords/verification are handled by better-auth


export const findUserByIdForAuth = (userId) =>
  prisma.user.findUnique({
    where: { id: userId }
  });

export const findUserById = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: ADMIN_USER_SELECT,
  });

// Sign-in check (session create hook)
export const findUserStatusById = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });


export const deleteUserById = (userId) =>
  prisma.user.delete({
    where: {
      id: userId,
    },
  });

// Update role (USER/ADMIN/DEVELOPER)
export const updateUserRole = (userId, role) =>
  prisma.user.update({
    where: { id: userId },
    data: { role },
    select: ADMIN_USER_SELECT,
  });

// Deactivating also signs the user out everywhere
export const setUserActiveStatus = async (userId, isActive) => {
  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { isActive }, select: ADMIN_USER_SELECT }),
    ...(isActive ? [] : [prisma.session.deleteMany({ where: { userId } })]),
  ]);
  return user;
};

// The user's own confirmed avatar upload, or null
export const findOwnAvatarUpload = (userId, key) =>
  prisma.mediaItem.findFirst({
    where: { key, ownerId: userId, resource: 'avatar', bytes: { not: null } },
    select: { id: true, key: true, contentType: true },
  });

// Point user's avatar at their own avatar upload
export async function upsertUserAvatarWithMedia({
  userId,
  media,
  alt = null,
  focalX = null,
  focalY = null,
}) {
  const currentAvatar = await prisma.avatarMediaItem.findUnique({
    where: { userId },
    select: { mediaId: true, media: { select: { id: true, key: true } } },
  });

  const avatar = await prisma.avatarMediaItem.upsert({
    where: { userId },
    update: {
      mediaId: media.id,
      alt: alt ?? undefined,
      focalX: focalX ?? undefined,
      focalY: focalY ?? undefined,
    },
    create: {
      userId,
      mediaId: media.id,
      alt: alt ?? undefined,
      focalX: focalX ?? undefined,
      focalY: focalY ?? undefined,
    },
    select: {
      userId: true,
      alt: true,
      focalX: true,
      focalY: true,
      media: { select: { id: true, key: true, contentType: true } },
    },
  });

  // Keep User.image in sync
  await prisma.user.update({ where: { id: userId }, data: { image: media.key } });

  const oldKey =
    currentAvatar?.mediaId && currentAvatar.mediaId !== media.id
      ? currentAvatar.media?.key || null
      : null;

  return { avatar, oldKey };
}

// Unlink the avatar; returns its key (or null)
export async function clearUserAvatar(userId) {
  const current = await prisma.avatarMediaItem.findUnique({
    where: { userId },
    select: { media: { select: { key: true } } },
  });
  if (current) await prisma.avatarMediaItem.delete({ where: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  return current?.media?.key ?? null;
}

// Every avatar upload the user owns (for account deletion)
export const findOwnedAvatarKeys = async (userId) => {
  const items = await prisma.mediaItem.findMany({
    where: { ownerId: userId, resource: 'avatar' },
    select: { key: true },
  });
  return items.map((item) => item.key);
};
