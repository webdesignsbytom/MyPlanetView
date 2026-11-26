// Postcards (docs/API.md "Postcards"): thin Prisma queries; the rules are utils/postcards.js.
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { generateShareCode } from '../utils/shareCodes.js';

const POSTCARD_SELECT = {
  id: true,
  code: true,
  senderId: true,
  kind: true,
  countryCode: true,
  style: true,
  message: true,
  toName: true,
  fromName: true,
  createdAt: true,
  landmark: { select: { id: true, name: true, slug: true, wikidataId: true, countryCode: true } },
  picture: { select: { key: true } },
};

// A write with a new code, tried again on the (unlikely) clash with another card's
async function withFreshCode(write) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await write(generateShareCode());
    } catch (err) {
      const clash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && String(err.meta?.target).includes('code');
      if (!clash) throw err;
    }
  }
  throw new Error('Could not make a unique postcard code');
}

/** A picture upload by its key: who made it, when, for what, and whether a card has it already. */
export const findPostcardPictureUpload = (key) =>
  prisma.mediaItem.findUnique({
    where: { key },
    select: { id: true, key: true, resource: true, ownerId: true, createdAt: true, usedAsPostcardPicture: { select: { id: true } } },
  });

/**
 * A card sent, unless its sender keeps `cap` already (counted with their row locked, as every
 * cap is); its picture (`picture`: `{ mediaId, bytes, contentType }`) marked saved on its
 * MediaItem in the same transaction. -> `{ postcard }`, or `{ tooMany: true }`
 */
export const createPostcardInDB = ({ senderId, card, picture = null, cap }) =>
  withFreshCode((code) =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "user" WHERE "id" = ${senderId} FOR NO KEY UPDATE`;
      if ((await tx.postcard.count({ where: { senderId } })) >= cap) return { tooMany: true };
      if (picture) {
        await tx.mediaItem.update({ where: { id: picture.mediaId }, data: { bytes: picture.bytes, contentType: picture.contentType } });
      }
      const postcard = await tx.postcard.create({
        data: {
          code,
          senderId,
          kind: card.kind,
          countryCode: card.countryCode,
          landmarkId: card.landmarkId,
          pictureId: picture ? picture.mediaId : null,
          style: card.style,
          message: card.message,
          toName: card.toName,
          fromName: card.fromName,
        },
        select: POSTCARD_SELECT,
      });
      return { postcard };
    }),
  );

export const findPostcardById = (id) => prisma.postcard.findUnique({ where: { id }, select: POSTCARD_SELECT });

export const findPostcardByCode = (code) => prisma.postcard.findUnique({ where: { code }, select: POSTCARD_SELECT });

/** The cards a person sent, newest first. */
export const findPostcardsSentBy = (senderId) =>
  prisma.postcard.findMany({ where: { senderId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: POSTCARD_SELECT });

/** A new link: a new code, so the old link finds nothing. */
export const resetPostcardCodeInDB = (id) =>
  withFreshCode((code) => prisma.postcard.update({ where: { id }, data: { code }, select: POSTCARD_SELECT }));

/** The card deleted. -> its picture's key (its file is the caller's to delete), or null */
export async function deletePostcardInDB(id) {
  const deleted = await prisma.postcard.delete({ where: { id }, select: { picture: { select: { key: true } } } });
  return deleted.picture?.key ?? null;
}
