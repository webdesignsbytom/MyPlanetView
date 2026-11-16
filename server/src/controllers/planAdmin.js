// Admin (ADMIN or DEVELOPER): complimentary memberships, and moving a map to another
// account when its owner can't (docs/API.md, "Plans and billing" and "Transferring a map").
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createBillingEvent, createMapEvent } from '../event/travelUtils.js';
import { sanitizeEmail, sanitizeText } from '../utils/sanitize.js';
import { isEmail, isUuid } from '../utils/travelValidation.js';
import { GRANT_MONTHS, PAID_PLAN_IDS } from '../utils/constants/plans.js';
import { addMonths, effectivePlan, grantIsActive } from '../utils/plans.js';
import { createGrantInDB, endGrantInDB, findGrant, findGrantsForUser, findSubscription } from '../domain/billing.js';
import { findUserById, findUserForTransfer } from '../domain/users.js';
import { findMapAccess } from '../domain/maps.js';
import { ensureDefaultMap, transferMap } from '../services/travel/maps.js';
import { badRequest, conflict, forbidden, handler, notFound } from './helpers/travel.js';

const REASON_MAX = 200;

const grantView = (grant, now = new Date()) => ({
  id: grant.id,
  plan: grant.plan,
  startsAt: grant.startsAt,
  endsAt: grant.endsAt,
  reason: grant.reason,
  grantedById: grant.grantedById,
  createdAt: grant.createdAt,
  active: grantIsActive(grant, now),
});

// A user's grants, newest first, and the plan they have now
export const listGrantsHandler = handler(DOMAINS.billing, 'List plan grants', async (req, res) => {
  const target = await findUserById(req.params.userId);
  if (!target) return notFound(req, res, DOMAINS.billing, EVENT_MESSAGES.userNotFound);
  const now = new Date();
  const [grants, subscription] = await Promise.all([findGrantsForUser(target.id), findSubscription(target.id)]);
  const { plan, source } = effectivePlan({ subscription, grants, now });
  return sendDataResponse(res, 200, { grants: grants.map((g) => grantView(g, now)), plan, source });
});

// `{ plan: 'REGULAR' | 'PREMIUM', months: 1–36, reason? }`: from now, for whole months
export const createGrantHandler = handler(DOMAINS.billing, 'Create plan grant', async (req, res) => {
  const target = await findUserById(req.params.userId);
  if (!target) return notFound(req, res, DOMAINS.billing, EVENT_MESSAGES.userNotFound);
  if (target.id === req.user.id) return forbidden(req, res, DOMAINS.billing, EVENT_MESSAGES.cannotGrantSelf);

  const { plan, months, reason } = req.body || {};
  if (!PAID_PLAN_IDS.includes(plan) || !Number.isInteger(months) || months < GRANT_MONTHS.min || months > GRANT_MONTHS.max) {
    return badRequest(req, res, DOMAINS.billing, EVENT_MESSAGES.invalidGrant);
  }
  const now = new Date();
  const grant = await createGrantInDB({
    userId: target.id,
    plan,
    startsAt: now,
    endsAt: addMonths(now, months),
    reason: sanitizeText(reason, { maxLength: REASON_MAX }),
    grantedById: req.user.id,
  });
  // The reason is free text: it stays out of the event
  logEvent(createBillingEvent({ user: req.user, action: 'Grant Create Success', id: grant.id, targetId: target.id, detail: `plan=${plan} months=${months}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { grant: grantView(grant, now) });
});

// End a grant now (the account drops to its other plan, or Economy; nothing is deleted)
export const endGrantHandler = handler(DOMAINS.billing, 'End plan grant', async (req, res) => {
  const grant = isUuid(req.params.grantId) ? await findGrant(req.params.grantId) : null;
  if (!grant) return notFound(req, res, DOMAINS.billing, EVENT_MESSAGES.grantNotFound);
  const ended = await endGrantInDB(grant.id);
  if (!ended) return conflict(req, res, DOMAINS.billing, EVENT_MESSAGES.grantAlreadyEnded);
  logEvent(createBillingEvent({ user: req.user, action: 'Grant End Success', id: grant.id, targetId: grant.userId }));
  return sendDataResponse(res, 200, { grant: grantView(ended) });
});

/**
 * `{ mapId, toEmail, keepOldOwnerAsEditor = false }`: an admin moves a map when its
 * owner can't (a death, a lost address), after checking off the site. The new owner
 * needs an active account (not necessarily on the map yet). Same effects as the
 * owner's transfer, grace included.
 */
export const adminTransferMapHandler = handler(DOMAINS.maps, 'Admin transfer map', async (req, res) => {
  const body = req.body || {};
  const keepOldOwnerAsEditor = body.keepOldOwnerAsEditor ?? false;
  if (typeof keepOldOwnerAsEditor !== 'boolean') return badRequest(req, res, DOMAINS.maps, EVENT_MESSAGES.malformedData);
  const map = isUuid(body.mapId) ? await findMapAccess(body.mapId, null) : null;
  if (!map) return notFound(req, res, DOMAINS.maps, EVENT_MESSAGES.mapNotFound);
  const email = sanitizeEmail(body.toEmail);
  if (!isEmail(email)) return badRequest(req, res, DOMAINS.maps, EVENT_MESSAGES.invalidEmail);

  const target = await findUserForTransfer({ email });
  if (!target || target.isActive === false) return badRequest(req, res, DOMAINS.maps, EVENT_MESSAGES.transferTargetNoAccount);
  if (target.id === map.ownerId) return badRequest(req, res, DOMAINS.maps, EVENT_MESSAGES.transferToSelf);

  const result = await transferMap({ mapId: map.id, toUserId: target.id, keepOldOwnerAsEditor });
  if (!result) return notFound(req, res, DOMAINS.maps, EVENT_MESSAGES.mapNotFound);
  if (result.wasDefault) {
    const oldOwner = await findUserById(result.fromUserId);
    if (oldOwner) await ensureDefaultMap(oldOwner);
  }
  logEvent(createMapEvent({
    user: req.user,
    action: 'Admin Transfer Success',
    id: map.id,
    targetId: target.id,
    detail: `from=${result.fromUserId} keepOldOwnerAsEditor=${keepOldOwnerAsEditor} grace=${Boolean(result.graceUntil)}`,
  }));
  return sendDataResponse(res, 200, {
    map: { id: map.id, name: map.name, ownerId: target.id, previousOwnerId: result.fromUserId, graceUntil: result.graceUntil },
  });
});
