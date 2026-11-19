// The plan in force and the map slots, loaded for an account or for a map's owner.
// The rules are pure (utils/plans.js, utils/mapSlots.js); this reads their inputs.
import { findMapGraceUntil, findPlanInputsForMap, findPlanInputsForUser } from '../../domain/billing.js';
import { effectivePlan, extraMapsPaid } from '../../utils/plans.js';
import { MAP_TIERS, mapSlots } from '../../utils/mapSlots.js';
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
 * A map's plan: its owner's when the map is on it (the main map, a grace period, a paid extra
 * map), else Economy's (one of the free maps, or a locked one; 19 Nov 2026, utils/mapSlots.js),
 * and whether the map is locked (no new photos). `plan` is the map's, `accountPlan` the
 * owner's, `tier` PLAN, ECONOMY or LOCKED.
 * -> `{ ...planStateFrom, plan, accountPlan, tier, ownerId, locked, graceUntil, upgradedAt }`, or null when there's no such map
 */
export async function loadMapPlan(mapId, now = new Date()) {
  const inputs = await findPlanInputsForMap(mapId, now);
  if (!inputs) return null;
  const state = planStateFrom(inputs, now);
  const tier = state.slots.tiers[mapId] ?? MAP_TIERS.LOCKED;
  const map = inputs.maps.find((m) => m.id === mapId);
  return {
    ...state,
    plan: tier === MAP_TIERS.PLAN ? state.plan : 'FREE',
    accountPlan: state.plan,
    tier,
    ownerId: inputs.ownerId,
    locked: tier === MAP_TIERS.LOCKED,
    graceUntil: map?.graceUntil ?? null,
    upgradedAt: map?.upgradedAt ?? null,
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
 * it gets TRANSFER_GRACE_DAYS of grace (the date), else none (null). Once per map (17 Nov
 * 2026, the audit): a map that has had a grace period keeps the date it had, so passing a
 * map back and forth between two accounts with no free slot can't keep it unlocked for good.
 */
export async function graceForNewOwner({ mapId, toUserId, now = new Date() }) {
  const earlier = await findMapGraceUntil(mapId);
  if (earlier) return earlier;
  const inputs = await findPlanInputsForUser(toUserId, now);
  const others = inputs.maps.filter((m) => m.id !== mapId);
  const { slots } = planStateFrom({ ...inputs, maps: others }, now);
  return slots.canCreate ? null : new Date(now.getTime() + TRANSFER_GRACE_DAYS * DAY_MS);
}
