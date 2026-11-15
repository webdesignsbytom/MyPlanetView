// Map operations shared by the routes and the account hooks in auth.js.
import { generateShareCode } from '../../utils/shareCodes.js';
import { createMapInDB, deleteMapInDB, findDefaultMap, isShareCodeTaken } from '../../domain/maps.js';
import { findMapPhotoKeys } from '../../domain/photos.js';
import { deleteStoredObjects } from '../s3/mediaService.js';

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
 * Delete a map, then its photos' files. The rows go first (the map cascades to its
 * photos and their PhotoVariants), so nobody is ever shown a photo whose file is gone.
 * The files then go in batches (one DeleteObjects per 1,000), with their MediaItem
 * rows; any that fail stay as unused uploads for the daily clean-up.
 */
export async function deleteMapWithFiles(mapId) {
  const keys = await findMapPhotoKeys(mapId);
  await deleteMapInDB(mapId);
  await deleteStoredObjects(keys);
}
