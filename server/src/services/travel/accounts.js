// What happens to a person's travel data when their account changes.
import { findOwnedMapsWithFirstEditor, transferMapOwnership, upsertMapMember, findMapMember } from '../../domain/maps.js';
import { findTripMember, upsertTripMember } from '../../domain/trips.js';
import { deletePhotosInDB, findUploadedPhotoFiles } from '../../domain/photos.js';
import { findUsableInvitesForEmail, markInviteAccepted } from '../../domain/sharing.js';
import { deleteStoredObjects } from '../s3/mediaService.js';
import { higherRole } from '../../utils/access.js';
import { deleteMapWithFiles } from './maps.js';

/**
 * The editor a map passes to: the longest-standing active one (a deactivated
 * owner couldn't sign in to manage it), else a deactivated one rather than
 * deleting the map (an admin can reactivate them). Null when there are no editors.
 */
export const heirOf = (editors) => (editors.find((e) => e.user?.isActive !== false) ?? editors[0])?.userId ?? null;

/**
 * Before an account is deleted:
 * 1. each map it owns with an editor passes to the longest-standing active editor;
 * 2. every photo it uploaded, on any map, is deleted with its files;
 * 3. its other maps are deleted with their files.
 */
export async function releaseTravelDataForDeletedUser(user) {
  const owned = await findOwnedMapsWithFirstEditor(user.id);
  const toDelete = [];
  for (const map of owned) {
    const heir = heirOf(map.members);
    if (heir) await transferMapOwnership(map.id, heir);
    else toDelete.push(map.id);
  }

  const { photoIds, keys } = await findUploadedPhotoFiles(user.id);
  if (photoIds.length) {
    await deletePhotosInDB(photoIds);
    await deleteStoredObjects(keys);
  }

  for (const mapId of toDelete) {
    try {
      await deleteMapWithFiles(mapId);
    } catch (err) {
      // The user row's delete still cascades the map; files left behind go with the orphan clean-up
      console.error('[travel] map delete failed during account deletion:', mapId, err.message);
    }
  }
}

/**
 * Turn pending invites for a verified address into access (on sign-up with a
 * verified email, or when the address is verified). Never lowers a role.
 */
export async function acceptInvitesForVerifiedUser(user) {
  if (!user?.emailVerified || !user.email) return 0;
  const invites = await findUsableInvitesForEmail(String(user.email).toLowerCase());
  for (const invite of invites) {
    if (invite.mapId) {
      const current = await findMapMember(invite.mapId, user.id);
      await upsertMapMember(invite.mapId, user.id, higherRole(current?.role, invite.role));
    } else if (invite.tripId) {
      const current = await findTripMember(invite.tripId, user.id);
      await upsertTripMember(invite.tripId, user.id, higherRole(current?.role, invite.role));
    }
    await markInviteAccepted(invite.id);
  }
  return invites.length;
}
