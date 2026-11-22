import { prisma } from '../prisma.js';

// Matches the MediaKind enum in schema.prisma (IMAGE / VIDEO / FILE).
export function mediaKindFromContentType(contentType) {
  if (contentType?.startsWith('image/')) return 'IMAGE';
  if (contentType?.startsWith('video/')) return 'VIDEO';
  return 'FILE';
}

/**
 * Uploads a user started (presigned) and never confirmed since `since`, among
 * `resources`. A confirmed upload has its `bytes` set.
 */
export const countUnconfirmedUploads = ({ ownerId, resources, since }) =>
  prisma.mediaItem.count({
    where: { ownerId, resource: { in: resources }, bytes: null, createdAt: { gte: since } },
  });

/**
 * The next uploads nothing uses, oldest first: no PhotoVariant, no avatar, no map design's
 * picture, and no contact form names the key (a form refers to its image by key, not by a relation,
 * hence the raw query). Photo files are taken once older than `photoCutoff`, everything
 * else once older than `cutoff`. `after` (`{ createdAt, id }` of the previous batch's
 * last row) moves on past rows that couldn't be deleted. -> `[{ id, key, createdAt }]`
 */
export const findOrphanUploads = ({ cutoff, photoCutoff, after = null, take }) => {
  const afterCreatedAt = after?.createdAt ?? new Date(0);
  const afterId = after?.id ?? '';
  return prisma.$queryRaw`
    SELECT m."id", m."key", m."createdAt"
    FROM "media_item" m
    WHERE (m."createdAt" < ${cutoff} OR (m."resource" = 'photo' AND m."createdAt" < ${photoCutoff}))
      AND (m."createdAt", m."id") > (${afterCreatedAt}, ${afterId})
      AND NOT EXISTS (SELECT 1 FROM "photo_variant" v WHERE v."mediaId" = m."id")
      AND NOT EXISTS (SELECT 1 FROM "avatar_media_item" a WHERE a."mediaId" = m."id")
      AND NOT EXISTS (SELECT 1 FROM "map_design" d WHERE d."pictureId" = m."id")
      AND NOT EXISTS (SELECT 1 FROM "contact_form" c WHERE c."imageKey" = m."key")
    ORDER BY m."createdAt" ASC, m."id" ASC
    LIMIT ${take}`;
};

/**
 * Delete the MediaItem rows of these keys, but never one a photo, an avatar or a map design uses
 * (a row that became used meanwhile stays). -> `{ count }`
 */
export const deleteUnusedMediaItems = (keys) =>
  prisma.mediaItem.deleteMany({
    where: { key: { in: keys }, photoVariant: { is: null }, usedAsAvatarBy: { is: null }, usedAsMapDesign: { is: null } },
  });
