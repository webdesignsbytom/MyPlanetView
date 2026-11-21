// Map operations shared by the routes and the account hooks in auth.js.
import { generateShareCode } from '../../utils/shareCodes.js';
import { createMapInDB, deleteMapInDB, findDefaultMap, isShareCodeTaken, transferMapInDB } from '../../domain/maps.js';
import { findMapPhotoKeys } from '../../domain/photos.js';
import { findMapDesignPictureKeys } from '../../domain/mapDesigns.js';
import { deleteStoredObjects } from '../s3/mediaService.js';
import { graceForNewOwner } from './plans.js';

export const DEFAULT_MAP_NAME = 'My map';

/** A share code no map or trip uses yet. */
export async function newUniqueShareCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateShareCode();
    if (!(await isShareCodeTaken(code))) return code;
  }
  // ~5e17 codes: five collisions in a row means something else is wrong
  throw new Error('Could not generate a unique share code');
}

/**
 * Every account has one default map. Made at sign-up (auth.js hook); also made
 * here on demand (GET /api/maps) if the hook ever failed. Two of these can run at
 * once (two requests, or the hook and a request), so the database keeps it to one:
 * TravelMap.defaultForOwnerId is unique, and the one that loses uses the winner's.
 */
export async function ensureDefaultMap(user) {
  const existing = await findDefaultMap(user.id);
  if (existing) return existing;
  try {
    return await createMapInDB({
      ownerId: user.id,
      name: DEFAULT_MAP_NAME,
      groupType: 'SOLO',
      isDefault: true,
      shareCode: await newUniqueShareCode(),
      travellers: [{ name: user.name || 'Me', userId: user.id }],
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      const made = await findDefaultMap(user.id);
      if (made) return made;
    }
    throw err;
  }
}

/**
 * Delete a map, then its photos' files (and its design's picture). The rows go first (the map cascades to its
 * photos and their PhotoVariants), so nobody is ever shown a photo whose file is gone.
 * The files then go in batches (one DeleteObjects per 1,000), with their MediaItem
 * rows; any that fail stay as unused uploads for the daily clean-up.
 */
export async function deleteMapWithFiles(mapId) {
  const keys = [...(await findMapPhotoKeys(mapId)), ...(await findMapDesignPictureKeys(mapId))];
  await deleteMapInDB(mapId);
  await deleteStoredObjects(keys);
}

/**
 * Hand a map to someone else (the owner's transfer, an admin's, or account deletion).
 * The map becomes theirs with its plan: if they have no free map slot it gets
 * TRANSFER_GRACE_DAYS of grace before it needs paying for (graceForNewOwner). The old
 * owner stays as an editor with `keepOldOwnerAsEditor`. Callers recreate the old
 * owner's default map (ensureDefaultMap) when `wasDefault`.
 * -> `{ fromUserId, wasDefault, graceUntil }`, or null when the map doesn't exist
 */
export async function transferMap({ mapId, toUserId, keepOldOwnerAsEditor = false, now = new Date() }) {
  const graceUntil = await graceForNewOwner({ mapId, toUserId, now });
  const result = await transferMapInDB({ mapId, toUserId, keepOldOwnerAsEditor, graceUntil });
  return result && { ...result, graceUntil };
}
