// What happens to a person's travel data when their account changes.
import { deleteMapsInDB, findOwnedMapsWithMembers } from '../../domain/maps.js';
import {
  deletePhotosByUploader,
  findMapPhotoKeys,
  findUploadedPhotoFiles,
  reassignUploadsToMapOwners,
} from '../../domain/photos.js';
import { findMapDesignPictureKeys } from '../../domain/mapDesigns.js';
import { findLeavingPlan } from '../../domain/profiles.js';
import { acceptInviteInDB, findUsableInvitesForEmail } from '../../domain/sharing.js';
import { heirFor, heirOf, usableLeavingPlan } from '../../utils/leavingPlan.js';
import { deleteStoredObjects } from '../s3/mediaService.js';
import { transferMap } from './maps.js';
import { recordInviteOffer } from '../billing/inviteOffer.js';

// The editor a map passes to by default: the longest-standing active one (a deactivated
// owner couldn't sign in to manage it), else a deactivated one rather than deleting the
// map (an admin can reactivate them). Null when there are no editors.
export { heirOf };

/**
 * Before an account is deleted (docs/API.md, "Leaving"). The leaving plan the person
 * saved (PUT /users/leaving-plan) is used if it's under LEAVING_PLAN_TTL_MINUTES old;
 * otherwise the defaults apply.
 * 1. Each map it owns passes to the plan's choice (someone still on the map), or is
 *    deleted if the plan says so; with no choice, a map with editors passes to the
 *    longest-standing active one and the rest are deleted. A map handed over gets the
 *    transfer's grace rule, and keeps every photo on it.
 * 2. Photos it uploaded to other people's maps (those handed over included) are left
 *    there, now the map owner's (the default); with `leavePhotos: false` the ones on
 *    maps it didn't own are deleted.
 * 3. Its other maps are deleted.
 * 4. Then the files of 2 and 3, in batches (one DeleteObjects per 1,000 files).
 * Rows always go before files: a failure leaves unused files for the daily clean-up,
 * never a photo pointing at a deleted file.
 */
export async function releaseTravelDataForDeletedUser(user) {
  const now = new Date();
  const [owned, profile] = await Promise.all([findOwnedMapsWithMembers(user.id), findLeavingPlan(user.id)]);
  const plan = usableLeavingPlan(profile, now);
  const choices = new Map((plan?.maps ?? []).map((choice) => [choice.mapId, choice]));

  const toDelete = [];
  const handedOver = [];
  for (const map of owned) {
    const heir = heirFor(map, choices.get(map.id));
    if (heir && (await transferMap({ mapId: map.id, toUserId: heir, now }))) handedOver.push(map.id);
    else toDelete.push(map.id);
  }

  // A handed-over map keeps the leaver's photos (they're its new owner's now)
  const leavePhotos = plan ? plan.leavePhotos : true;
  const keys = [];
  if (leavePhotos || handedOver.length) await reassignUploadsToMapOwners(user.id, leavePhotos ? undefined : handedOver);
  if (!leavePhotos) {
    keys.push(...(await findUploadedPhotoFiles(user.id)));
    await deletePhotosByUploader(user.id);
  }

  if (toDelete.length) {
    try {
      const mapKeys = [...(await findMapPhotoKeys(toDelete)), ...(await findMapDesignPictureKeys(toDelete))];
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
    if (await acceptInviteInDB(invite, user.id)) {
      accepted++;
      // A new account invited to a paid map: half price for 3 months (utils/inviteOffer.js)
      await recordInviteOffer(user.id, invite).catch((err) => console.error('[INVITE] offer not recorded:', err.message));
    }
  }
  return accepted;
}
