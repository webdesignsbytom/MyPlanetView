// The plan in force and the map slots, loaded for an account or for a map's owner.
// The rules are pure (utils/plans.js, utils/mapSlots.js); this reads their inputs.
import { findPlanInputsForMap, findPlanInputsForUser } from '../../domain/billing.js';
import { effectivePlan, extraMapsPaid } from '../../utils/plans.js';
import { mapSlots } from '../../utils/mapSlots.js';
import { TRANSFER_GRACE_DAYS, VIDEO_MAX_SECONDS, planOf } from '../../utils/constants/plans.js';
import { VIDEO_CONTENT_TYPES, VIDEO_MAX_BYTES } from '../../utils/constants/mediaConstants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * `{ plan, source, grant, subscription, extraMapsPaid, maps, slots }` from the inputs
 * domain/billing.js reads.
 */
export function planStateFrom({ subscription, grants, maps }, now = new Date()) {
  const paid = extraMapsPaid(subscription);
  return {
    ...effectivePlan({ subscription, grants, now }),
    subscription,
    extraMapsPaid: paid,
    maps,
    slots: mapSlots({ maps, extraMapsPaid: paid, now }),
  };
}

/** An account's plan and map slots. */
export const loadUserPlan = async (userId, now = new Date()) => planStateFrom(await findPlanInputsForUser(userId, now), now);

/**
 * A map's owner's plan, and whether the map is locked (no new photos).
 * -> `{ ...planStateFrom, ownerId, locked, graceUntil }`, or null when there's no such map
 */
export async function loadMapPlan(mapId, now = new Date()) {
  const inputs = await findPlanInputsForMap(mapId, now);
  if (!inputs) return null;
  const state = planStateFrom(inputs, now);
  return {
    ...state,
    ownerId: inputs.ownerId,
    locked: state.slots.lockedIds.includes(mapId),
    graceUntil: inputs.maps.find((m) => m.id === mapId)?.graceUntil ?? null,
  };
}

/**
 * What an uploader needs to know before adding photos to a map (or a trip on it): the
 * owner's plan's `keepsOriginals` and `photosPerCountry`, and whether the map is locked.
 * The same shape on GET /maps/:mapId and GET /trips/:tripId. -> null when there's no such map
 */
export const uploadRulesFrom = (mapPlan) =>
  mapPlan && {
    keepsOriginals: planOf(mapPlan.plan).limits.keepsOriginals,
    photosPerCountry: planOf(mapPlan.plan).limits.photosPerCountry,
    // Videos (First Class): how many per country, how long and how big (docs/API.md "Videos")
    videos: planOf(mapPlan.plan).limits.videos
      ? {
          perCountry: planOf(mapPlan.plan).limits.videosPerCountry,
          maxSeconds: VIDEO_MAX_SECONDS,
          maxBytes: VIDEO_MAX_BYTES,
          contentTypes: VIDEO_CONTENT_TYPES,
        }
      : null,
    locked: mapPlan.locked,
  };

export const loadUploadRules = async (mapId, now = new Date()) => uploadRulesFrom(await loadMapPlan(mapId, now));

/**
 * A map moving to `toUserId`: when they have no free map slot it would be locked, so
 * it gets TRANSFER_GRACE_DAYS of grace (the date), else none (null).
 */
export async function graceForNewOwner({ mapId, toUserId, now = new Date() }) {
  const inputs = await findPlanInputsForUser(toUserId, now);
  const others = inputs.maps.filter((m) => m.id !== mapId);
  const { slots } = planStateFrom({ ...inputs, maps: others }, now);
  return slots.canCreate ? null : new Date(now.getTime() + TRANSFER_GRACE_DAYS * DAY_MS);
}
