// Influencer codes (docs/API.md, "Promo codes"): a public check for the sign-up page, and
// the admin's list, new code and changes (ADMIN or DEVELOPER).
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createBillingEvent } from '../event/travelUtils.js';
import { isUuid } from '../utils/travelValidation.js';
import { PROMO_TRIAL_DAYS, parsePromoCodeInput } from '../utils/promoCodes.js';
import { usablePromoCode } from '../services/billing/promo.js';
import { firstNameOf } from '../utils/referrals.js';
import {
  createPromoCodeInDB,
  findPromoCodeByCode,
  findOwnerName,
  findPromoCodeById,
  listPromoCodesWithCounts,
  updatePromoCodeInDB,
} from '../domain/promoCodes.js';
import { badRequest, conflict, handler, notFound } from './helpers/travel.js';

const D = DOMAINS.billing;

// Before signing up: is this code usable, and what does it give? (No label: that's for
// admins.) A plan for life (`freePlan`), or the first PROMO_TRIAL_DAYS free on a paid plan.
// A member's invite code also says who it's from, by first name (`fromFriend`: they shared
// it; docs/API.md "Give a month, get a month").
export const checkPromoCodeHandler = handler(D, 'Check promo code', async (req, res) => {
  const promo = await usablePromoCode(req.params.code);
  if (!promo) return notFound(req, res, D, EVENT_MESSAGES.promoCodeInvalid);
  return sendDataResponse(res, 200, {
    promoCode: {
      code: promo.code,
      freePlan: promo.freePlan ?? null,
      trialDays: promo.freePlan ? 0 : PROMO_TRIAL_DAYS,
      fromFriend: promo.ownerId ? firstNameOf(await findOwnerName(promo.ownerId)) : null,
    },
  });
});

// Admins see what each gives; who made it stays out of the reply
const promoView = ({ createdById: _createdById, ownerId: _ownerId, ...promo }) => ({
  ...promo,
  freePlan: promo.freePlan ?? null,
  trialDays: promo.freePlan ? 0 : PROMO_TRIAL_DAYS,
});

export const listPromoCodesHandler = handler(D, 'List promo codes', async (req, res) => {
  const promoCodes = await listPromoCodesWithCounts();
  return sendDataResponse(res, 200, { promoCodes: promoCodes.map(promoView) });
});

// `{ code, label, freePlan?, maxUses?, endsAt? }` (`freePlan`: REGULAR or PREMIUM for life)
export const createPromoCodeHandler = handler(D, 'Create promo code', async (req, res) => {
  const parsed = parsePromoCodeInput(req.body);
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.message]);
  if (await findPromoCodeByCode(parsed.data.code)) return conflict(req, res, D, EVENT_MESSAGES.promoCodeTaken);
  const promo = await createPromoCodeInDB({ ...parsed.data, createdById: req.user.id });
  logEvent(
    createBillingEvent({
      user: req.user,
      action: 'Promo Code Create Success',
      id: promo.id,
      detail: `code=${promo.code}${promo.freePlan ? ` freePlan=${promo.freePlan}` : ''}`,
      statusCode: 201,
    }),
  );
  return sendDataResponse(res, 201, { promoCode: promoView({ ...promo, signUps: 0, verified: 0, trials: 0, paying: 0 }) });
});

// `{ label?, active?, maxUses?, endsAt? }`: the code itself and what it gives never change
export const updatePromoCodeHandler = handler(D, 'Update promo code', async (req, res) => {
  const existing = isUuid(req.params.promoCodeId) ? await findPromoCodeById(req.params.promoCodeId) : null;
  // A member's own invite code isn't the admins' to change
  if (!existing || existing.ownerId) return notFound(req, res, D, EVENT_MESSAGES.promoCodeNotFound);
  const parsed = parsePromoCodeInput(req.body, { existing });
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.message]);
  const promo = Object.keys(parsed.data).length ? await updatePromoCodeInDB(existing.id, parsed.data) : existing;
  logEvent(createBillingEvent({ user: req.user, action: 'Promo Code Update Success', id: promo.id, detail: Object.keys(parsed.data).join(',') }));
  return sendDataResponse(res, 200, { promoCode: promoView(promo) });
});
