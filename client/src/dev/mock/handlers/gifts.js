// Mock mode only: gifts of a year of a plan (docs/API.md "Gifts"), as the server's
// controllers/gifts.js and utils/gifts.js. Unlike the server, Checkout is paid at once (the
// gift is ready straight away, and answers `{ url: '/gifts?bought=1' }`), no email is sent,
// and refunds don't happen. Gifts live in `db.gifts`.
import { fail, ok, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, normaliseShareCode, session } from '../store';
import { addMonths, grantsOf, isLive, subscriptionOf } from '../plans';
import { userName } from '../views';
import { planOf } from '@/utils/constants/plans';

const GIFT_PLANS = ['REGULAR', 'PREMIUM'];
const GIFT_MONTHS = 12;
const FOR_LIFE = '9999-12-31';
const M = {
  invalidGiftPlan: 'Choose Business or First Class for the gift.',
  invalidGiftText: 'Keep the name to 60 characters and the message to 300.',
  giftNotFound: 'That gift code doesn’t exist. Check it and try again.',
  giftUsed: 'That gift has already been used.',
  giftCovered: 'You already have that plan or a better one, so keep this gift for someone else.',
};

const signedOut = () => fail(401, 'No valid session. Please sign in.');
const gifts = () => {
  const db = getDb();
  if (!Array.isArray(db.gifts)) db.gifts = [];
  return db.gifts;
};
const status = (gift) => (gift.refundedAt ? 'REFUNDED' : gift.redeemedAt ? 'REDEEMED' : gift.paidAt ? 'READY' : 'UNPAID');
const clean = (value, max) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim().slice(0, max) || null : null);

const boughtView = (gift) => ({
  id: gift.id,
  code: formatShareCode(gift.code),
  plan: gift.plan,
  planName: planOf(gift.plan).name,
  months: gift.months,
  amountPence: gift.amountPence,
  toName: gift.toName,
  message: gift.message,
  status: status(gift),
  paidAt: gift.paidAt,
  redeemedAt: gift.redeemedAt,
  createdAt: gift.createdAt,
});
const pageView = (gift) => ({
  code: formatShareCode(gift.code),
  plan: gift.plan,
  planName: planOf(gift.plan).name,
  months: gift.months,
  toName: gift.toName,
  message: gift.message,
  fromName: gift.buyerId ? userName(gift.buyerId) : null,
  status: status(gift),
});
const offers = () => GIFT_PLANS.map((plan) => ({ plan, name: planOf(plan).name, months: GIFT_MONTHS, pence: planOf(plan).price.YEAR }));

export function registerGiftRoutes() {
  route('GET', '/api/gifts', () => {
    if (!session.signedIn) return signedOut();
    const mine = gifts().filter((g) => g.buyerId === me().id && g.paidAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok({ offers: offers(), gifts: mine.map(boughtView), paymentsEnabled: true });
  });

  route('POST', '/api/billing/gift-checkout', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const input = body || {};
    if (!GIFT_PLANS.includes(input.plan)) return fail(400, M.invalidGiftPlan);
    for (const [field, max] of [['toName', 60], ['message', 300]]) {
      if (input[field] != null && (typeof input[field] !== 'string' || input[field].trim().length > max)) return fail(400, M.invalidGiftText);
    }
    const now = new Date().toISOString();
    gifts().push({
      id: newId(),
      code: newShareCode(),
      plan: input.plan,
      months: GIFT_MONTHS,
      amountPence: planOf(input.plan).price.YEAR,
      buyerId: me().id,
      toName: clean(input.toName, 60),
      message: clean(input.message, 300),
      // Paid at once in mock mode (the server waits for Stripe's webhook)
      paidAt: now,
      refundedAt: null,
      redeemedById: null,
      redeemedAt: null,
      createdAt: now,
    });
    return ok({ url: '/gifts?bought=1' });
  });

  route('GET', '/api/gifts/:code', ({ params }) => {
    const code = normaliseShareCode(params.code);
    const gift = code && gifts().find((g) => g.code === code && g.paidAt);
    return gift ? ok({ gift: pageView(gift) }) : fail(404, M.giftNotFound);
  });

  route('POST', '/api/gifts/redeem', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const code = normaliseShareCode(body?.code);
    const gift = code && gifts().find((g) => g.code === code && g.paidAt);
    if (!gift) return fail(404, M.giftNotFound);
    if (gift.redeemedAt || gift.refundedAt) return fail(409, M.giftUsed);
    const userId = me().id;
    const rank = planOf(gift.plan).rank;
    const sub = subscriptionOf(userId);
    const now = Date.now();
    const running = grantsOf(userId).filter((g) => new Date(g.endsAt).getTime() > now);
    const covered =
      (isLive(sub) && ['active', 'trialing', 'past_due'].includes(sub.status) && planOf(sub.plan).rank >= rank) ||
      running.some((g) => g.endsAt.startsWith(FOR_LIFE) && planOf(g.plan).rank >= rank);
    if (covered) return fail(409, M.giftCovered);
    // After any of the same plan running or waiting: one gift after another
    let startsAt = new Date(now);
    for (let moved = true; moved; ) {
      moved = false;
      for (const g of running) {
        if (g.plan === gift.plan && !g.endsAt.startsWith(FOR_LIFE) && new Date(g.startsAt) <= startsAt && new Date(g.endsAt) > startsAt) {
          startsAt = new Date(g.endsAt);
          moved = true;
        }
      }
    }
    const grant = {
      id: newId(),
      userId,
      plan: gift.plan,
      startsAt: startsAt.toISOString(),
      endsAt: addMonths(startsAt, gift.months).toISOString(),
      reason: 'A gift',
      grantedById: null,
      createdAt: new Date(now).toISOString(),
    };
    getDb().planGrants.push(grant);
    Object.assign(gift, { redeemedById: userId, redeemedAt: new Date(now).toISOString(), grantId: grant.id });
    return ok({ grant: { plan: grant.plan, planName: planOf(grant.plan).name, startsAt: grant.startsAt, endsAt: grant.endsAt } });
  });
}
