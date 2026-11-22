// Gifts of a year of a paid plan (docs/API.md "Gifts"; 21 Nov 2026, the user's wish, from the
// business review: "a year of Business or First Class as a gift, for Christmas"). Bought with
// a one-off Stripe Checkout; the webhook makes it usable and emails the buyer its code; anyone
// redeems it for a year of the plan (a PlanGrant), signing up first if they're new.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { runAfterResponse } from '../utils/background.js';
import { createBillingEvent } from '../event/travelUtils.js';
import { OtherErrorEvent } from '../event/errorUtils.js';
import { FRONTEND_ORIGINS } from '../utils/config.js';
import { BusinessName, BusinessSiteUrl, BusinessUrl, FrontendUrl, LogoUrl } from '../utils/constants/siteConstants.js';
import { planOf } from '../utils/constants/plans.js';
import { formatShareCode, normaliseShareCode } from '../utils/shareCodes.js';
import { GIFT_MONTHS, giftOffers, giftPricePence, giftStatus, parseGiftOrder } from '../utils/gifts.js';
import {
  createGiftInDB,
  deleteUnpaidGiftInDB,
  findGiftByCode,
  findGiftsBoughtBy,
  markGiftPaidInDB,
  markGiftRefundedInDB,
  redeemGiftInDB,
  setGiftSessionInDB,
} from '../domain/gifts.js';
import { findSubscription } from '../domain/billing.js';
import { paymentsEnabled, stripeClient } from '../services/billing/stripe.js';
import { ensureStripeCustomer } from '../services/billing/customers.js';
import { sendUserEmail } from '../services/email/emailHandler.js';
import { badRequest, conflict, handler, notFound, reply } from './helpers/travel.js';

const D = DOMAINS.billing;

const siteOrigin = () => FRONTEND_ORIGINS[0] ?? FrontendUrl;
const giftUrl = (code) => `${siteOrigin()}/gift/${formatShareCode(code)}`;
const paymentsOff = (req, res) => reply(res, new OtherErrorEvent(req.user, D, 503, EVENT_MESSAGES.paymentsOff, 'payments-off'));

/** A gift as its buyer sees it (their gifts page). */
const boughtView = (gift) => ({
  id: gift.id,
  code: formatShareCode(gift.code),
  plan: gift.plan,
  planName: planOf(gift.plan).name,
  months: gift.months,
  amountPence: gift.amountPence,
  toName: gift.toName,
  message: gift.message,
  status: giftStatus(gift),
  paidAt: gift.paidAt,
  redeemedAt: gift.redeemedAt,
  createdAt: gift.createdAt,
});

/** A gift as its page shows it to anyone with the code: never the buyer's address. */
const pageView = (gift) => ({
  code: formatShareCode(gift.code),
  plan: gift.plan,
  planName: planOf(gift.plan).name,
  months: gift.months,
  toName: gift.toName,
  message: gift.message,
  fromName: gift.buyer?.name ?? null,
  status: giftStatus(gift),
});

// GET /api/gifts (signed in): the gifts on offer and those you've bought
export const getMyGiftsHandler = handler(D, 'Get gifts', async (req, res) => {
  const gifts = await findGiftsBoughtBy(req.user.id);
  return sendDataResponse(res, 200, { offers: giftOffers(), gifts: gifts.map(boughtView), paymentsEnabled: paymentsEnabled() });
});

// POST /api/billing/gift-checkout (signed in, verified): `{ plan, toName?, message? }` ->
// `{ url }`, a one-off Checkout for a year of the plan at its yearly price. The gift is made
// now, unpaid; the webhook makes it usable.
export const giftCheckoutHandler = handler(D, 'Gift checkout', async (req, res) => {
  if (!paymentsEnabled()) return paymentsOff(req, res);
  const order = parseGiftOrder(req.body);
  if (order.error) return badRequest(req, res, D, EVENT_MESSAGES[order.error]);

  const amountPence = giftPricePence(order.plan);
  const gift = await createGiftInDB({ ...order, months: GIFT_MONTHS, amountPence, buyerId: req.user.id });
  let session;
  try {
    const stripe = await stripeClient();
    const customer = await ensureStripeCustomer(stripe, req.user, (await findSubscription(req.user.id))?.stripeCustomerId);
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer,
      client_reference_id: req.user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: amountPence,
            product_data: { name: `A year of ${planOf(order.plan).name}, a gift` },
          },
        },
      ],
      // Only ids: the names and message stay in our database
      metadata: { userId: req.user.id, giftId: gift.id },
      payment_intent_data: { metadata: { giftId: gift.id } },
      success_url: `${siteOrigin()}/gifts?bought=1`,
      cancel_url: `${siteOrigin()}/gifts?cancelled=1`,
    });
  } catch (err) {
    await deleteUnpaidGiftInDB(gift.id).catch(() => {});
    throw err;
  }
  await setGiftSessionInDB(gift.id, session.id);
  logEvent(createBillingEvent({ user: req.user, action: 'Gift Checkout Started', detail: `plan=${order.plan} gift=${gift.id}` }));
  return sendDataResponse(res, 200, { url: session.url });
});

// GET /api/gifts/:code (anyone; looked up with a rate limit, as codes could be guessed):
// what the gift is, for its page. An unpaid or unknown code is a 404.
export const getGiftHandler = handler(D, 'Get gift', async (req, res) => {
  const code = normaliseShareCode(req.params.code);
  const gift = code ? await findGiftByCode(code) : null;
  if (!gift) return notFound(req, res, D, EVENT_MESSAGES.giftNotFound);
  return sendDataResponse(res, 200, { gift: pageView(gift) });
});

const REDEEM_ERRORS = {
  notFound: (req, res) => notFound(req, res, D, EVENT_MESSAGES.giftNotFound),
  used: (req, res) => conflict(req, res, D, EVENT_MESSAGES.giftUsed),
  covered: (req, res) => conflict(req, res, D, EVENT_MESSAGES.giftCovered),
};

// POST /api/gifts/redeem (signed in, verified): `{ code }` -> `{ grant: { plan, startsAt, endsAt } }`
export const redeemGiftHandler = handler(D, 'Redeem gift', async (req, res) => {
  const code = normaliseShareCode(req.body?.code);
  if (!code) return REDEEM_ERRORS.notFound(req, res);
  const result = await redeemGiftInDB({ code, userId: req.user.id });
  if (result.error) return REDEEM_ERRORS[result.error](req, res);
  logEvent(createBillingEvent({ user: req.user, action: 'Gift Redeemed', detail: `plan=${result.grant.plan} grant=${result.grant.id}` }));
  const { plan, startsAt, endsAt } = result.grant;
  return sendDataResponse(res, 200, { grant: { plan, planName: planOf(plan).name, startsAt, endsAt } });
});

// ── The webhook's part (controllers/billing.js handleStripeEvent) ────────────────────

/** A gift's Checkout finished and paid: make it usable and email the buyer its code. -> true when it was a gift's */
export async function handleGiftCheckout(session) {
  const giftId = session?.metadata?.giftId;
  if (session?.mode !== 'payment' || !giftId) return false;
  if (session.payment_status !== 'paid') return true;
  const intent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  const gift = await markGiftPaidInDB({ giftId, stripeSessionId: session.id, stripePaymentIntentId: intent });
  if (!gift) return true;
  logEvent(createBillingEvent({ user: { id: session.client_reference_id || null }, action: 'Gift Paid', detail: `plan=${gift.plan} gift=${gift.id}` }));
  if (gift.buyer?.email && gift.buyer.isActive !== false) {
    runAfterResponse(
      // A fixed subject; the names and message are only in the escaped body
      sendUserEmail(gift.buyer.email, `Your gift of ${planOf(gift.plan).name} is ready`, 'giftEmail', {
        title: 'Your gift is ready',
        preheader: `The code for a year of ${planOf(gift.plan).name}.`,
        giftName: `A year of ${planOf(gift.plan).name}`,
        planName: planOf(gift.plan).name,
        code: formatShareCode(gift.code),
        toName: gift.toName,
        message: gift.message,
        giftUrl: giftUrl(gift.code),
        giftsUrl: `${siteOrigin()}/gifts`,
        businessName: BusinessName,
        businessUrl: BusinessUrl,
        businessSiteUrl: BusinessSiteUrl,
        logoUrl: LogoUrl,
        year: new Date().getFullYear(),
      }),
    );
  }
  return true;
}

/** A payment refunded (charge.refunded): a gift not yet redeemed stops working. */
export async function handleGiftRefund(charge) {
  const intent = typeof charge?.payment_intent === 'string' ? charge.payment_intent : charge?.payment_intent?.id;
  if (!intent || !charge?.refunded) return;
  const result = await markGiftRefundedInDB(intent);
  if (!result) return;
  logEvent(
    createBillingEvent({
      user: null,
      action: result.redeemed ? 'Redeemed Gift Refunded' : 'Gift Refunded',
      // Redeemed already: its year runs on unless an admin ends that membership
      detail: result.redeemed ? `gift=${result.gift.id} grant=${result.gift.grantId} (end the membership by hand if wanted)` : `gift=${result.gift.id}`,
    }),
  );
}
