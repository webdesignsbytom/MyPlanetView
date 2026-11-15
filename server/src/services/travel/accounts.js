// What happens to a person's travel data when their account changes.
import { deleteMapsInDB, findOwnedMapsWithFirstEditor, transferMapOwnership } from '../../domain/maps.js';
import { deletePhotosByUploader, findMapPhotoKeys, findUploadedPhotoFiles } from '../../domain/photos.js';
import { acceptInviteInDB, findUsableInvitesForEmail } from '../../domain/sharing.js';
import { deleteStoredObjects } from '../s3/mediaService.js';

/**
 * The editor a map passes to: the longest-standing active one (a deactivated
 * owner couldn't sign in to manage it), else a deactivated one rather than
 * deleting the map (an admin can reactivate them). Null when there are no editors.
 */
export const heirOf = (editors) => (editors.find((e) => e.user?.isActive !== false) ?? editors[0])?.userId ?? null;

/**
 * Before an account is deleted:
 * 1. each map it owns with an editor passes to the longest-standing active editor;
 * 2. every photo it uploaded, on any map, is deleted;
 * 3. its other maps are deleted;
 * 4. then the files of 2 and 3, in batches (one DeleteObjects per 1,000 files).
 * Rows always go before files: a failure leaves unused files for the daily clean-up,
 * never a photo pointing at a deleted file.
 */
export async function releaseTravelDataForDeletedUser(user) {
  const owned = await findOwnedMapsWithFirstEditor(user.id);
  const toDelete = [];
  for (const map of owned) {
    const heir = heirOf(map.members);
    if (heir) await transferMapOwnership(map.id, heir);
    else toDelete.push(map.id);
  }

  const keys = await findUploadedPhotoFiles(user.id);
  await deletePhotosByUploader(user.id);

  if (toDelete.length) {
    try {
      const mapKeys = await findMapPhotoKeys(toDelete);
      await deleteMapsInDB(toDelete);
      keys.push(...mapKeys);
    } catch (err) {
      // The user row's delete still cascades these maps; their files are then unused
      // uploads, which the daily clean-up removes
      console.error('[travel] map delete failed during account deletion:', err.message);
    }
  }

  await deleteStoredObjects(keys);
}

/**
 * Turn pending invites for a verified address into access (on sign-up with a
 * verified email, or when the address is verified). Never lowers a role. Each
 * invite is accepted in one transaction (domain/sharing.js).
 */
export async function acceptInvitesForVerifiedUser(user) {
  if (!user?.emailVerified || !user.email) return 0;
  const invites = await findUsableInvitesForEmail(String(user.email).toLowerCase());
  let accepted = 0;
  for (const invite of invites) {
    if (await acceptInviteInDB(invite, user.id)) accepted++;
  }
  return accepted;
}
