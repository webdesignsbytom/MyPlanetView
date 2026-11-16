// Leaving: what happens to the maps you own, and the photos you added to other people's
// maps, when you delete your account (docs/API.md, "Leaving"). The choice is stored on
// the profile and used by the deletion hook (services/travel/accounts.js) within
// LEAVING_PLAN_TTL_MINUTES; after that the defaults apply.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { findOwnedMapsWithMembers } from '../domain/maps.js';
import { countPhotosOnOtherMaps } from '../domain/photos.js';
import { saveLeavingPlan } from '../domain/profiles.js';
import { parseLeavingPlan } from '../utils/leavingPlan.js';
import { LEAVING_PLAN_TTL_MINUTES } from '../utils/constants/plans.js';
import { badRequest, handler } from './helpers/travel.js';

const D = DOMAINS.users;

export const getLeavingOptionsHandler = handler(D, 'Get leaving options', async (req, res) => {
  const [owned, photosOnOtherMaps] = await Promise.all([
    findOwnedMapsWithMembers(req.user.id),
    countPhotosOnOtherMaps(req.user.id),
  ]);
  const maps = owned.map((map) => ({
    id: map.id,
    name: map.name,
    members: map.members.map((m) => ({ userId: m.userId, name: m.user?.name ?? null, role: m.role })),
  }));
  return sendDataResponse(res, 200, { maps, photosOnOtherMaps });
});

export const putLeavingPlanHandler = handler(D, 'Save leaving plan', async (req, res) => {
  const owned = await findOwnedMapsWithMembers(req.user.id);
  const parsed = parseLeavingPlan(
    req.body,
    owned.map((map) => ({ id: map.id, memberIds: map.members.map((m) => m.userId) }))
  );
  if (parsed.error) return badRequest(req, res, D, EVENT_MESSAGES.leavingPlanInvalid);

  const saved = await saveLeavingPlan(req.user.id, parsed.value);
  return sendDataResponse(res, 200, {
    leavingPlan: saved.leavingPlan,
    savedAt: saved.leavingPlanAt,
    expiresAt: new Date(saved.leavingPlanAt.getTime() + LEAVING_PLAN_TTL_MINUTES * 60 * 1000),
  });
});
