// Map operations shared by the routes and the account hooks in auth.js.
import { generateShareCode } from '../../utils/shareCodes.js';
import {
  createMapInDB,
  deleteMapInDB,
  findDefaultMap,
  findMapPhotoKeys,
  isShareCodeTaken,
} from '../../domain/maps.js';
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
 * here on demand if the hook ever failed. One per user is enforced here, not by
 * an index (Prisma can't keep a partial unique index).
 */
export async function ensureDefaultMap(user) {
  const existing = await findDefaultMap(user.id);
  if (existing) return existing;
  return createMapInDB({
    ownerId: user.id,
    name: DEFAULT_MAP_NAME,
    groupType: 'SOLO',
    isDefault: true,
    shareCode: await newUniqueShareCode(),
    travellers: [{ name: user.name || 'Me', userId: user.id }],
  });
}

/** Delete a map, then its photos' files (rows first: a file still referenced can't go). */
export async function deleteMapWithFiles(mapId) {
  const keys = await findMapPhotoKeys(mapId);
  await deleteMapInDB(mapId);
  await deleteStoredObjects(keys);
}
