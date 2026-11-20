// Plans and billing (docs/API.md, "Plans and billing"): GET /billing, Checkout, plan and
// extra-map changes and the portal against a fake Stripe client, the webhook with real
// signatures (the SDK's own signing code), complimentary memberships, and the cron purge.
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// A fake Stripe: records each call and keeps subscriptions in memory. Webhook signing
// and checking stay the real SDK's.
const fake = vi.hoisted(() => ({ calls: [], subscriptions: new Map(), openSessions: new Map(), next: 1, cancelFails: false }));

vi.mock('stripe', async (importOriginal) => {
  const actual = await importOriginal();
  const record = (name, fn) => async (...args) => {
    fake.calls.push({ name, args });
    return fn(...args);
  };
  // Stripe's update: items with an id change (or go, with `deleted`), the rest are added
  const update = (id, params) => {
    const sub = fake.subscriptions.get(id);
    let items = [...sub.items.data];
    for (const change of params.items ?? []) {
      if (change.deleted) items = items.filter((item) => item.id !== change.id);
      else if (change.id) {
        items = items.map((item) =>
          item.id === change.id
            ? { ...item, price: change.price ? { id: change.price } : item.price, quantity: change.quantity ?? item.quantity }
            : item
        );
      } else items.push({ id: `si_fake_${fake.next++}`, price: { id: change.price }, quantity: change.quantity ?? 1, current_period_end: 1893456000 });
    }
    const updated = { ...sub, items: { data: items } };
    fake.subscriptions.set(id, updated);
    return updated;
  };
  class FakeStripe {
    constructor(key) {
      this.key = key;
      this.customers = {
        create: record('customers.create', (params) => ({ id: `cus_fake_${fake.next++}`, ...params })),
      };
      // Sessions stay open per customer until expired (or completed, which these tests skip)
      this.checkout = {
        sessions: {
          create: record('checkout.sessions.create', (params) => {
            const id = `cs_fake_${fake.next++}`;
            fake.openSessions.set(params.customer, [...(fake.openSessions.get(params.customer) ?? []), id]);
            return { id, url: 'https://checkout.stripe.test/c/pay/cs_fake' };
          }),
          list: record('checkout.sessions.list', (params) => ({ data: (fake.openSessions.get(params.customer) ?? []).map((id) => ({ id })) })),
          expire: record('checkout.sessions.expire', (id) => {
            for (const [customer, ids] of fake.openSessions) fake.openSessions.set(customer, ids.filter((open) => open !== id));
            return { id, status: 'expired' };
          }),
        },
      };
      // The invite offer's coupons (made once, by id)
      this.coupons = {
        retrieve: record('coupons.retrieve', (id) => {
          if (!fake.coupons?.has(id)) throw Object.assign(new Error(`No such coupon: '${id}'`), { code: 'resource_missing', statusCode: 404 });
          return fake.coupons.get(id);
        }),
        create: record('coupons.create', (params) => {
          fake.coupons ??= new Map();
          fake.coupons.set(params.id, params);
          return params;
        }),
      };
      this.billingPortal = {
        sessions: { create: record('billingPortal.sessions.create', () => ({ url: 'https://billing.stripe.test/p/session' })) },
      };
      this.subscriptions = {
        retrieve: record('subscriptions.retrieve', (id) => fake.subscriptions.get(id)),
        update: record('subscriptions.update', update),
        // Ends it at once; Stripe's own error for one it doesn't have, or none reachable
        cancel: record('subscriptions.cancel', (id) => {
          if (fake.cancelFails) throw Object.assign(new Error('An error occurred with our connection to Stripe.'), { type: 'StripeConnectionError' });
          const sub = fake.subscriptions.get(id);
          if (!sub) throw Object.assign(new Error(`No such subscription: '${id}'`), { code: 'resource_missing' });
          const ended = { ...sub, status: 'canceled' };
          fake.subscriptions.set(id, ended);
          return ended;
        }),
      };
    }
  }
  FakeStripe.webhooks = actual.default.webhooks;
  return { default: FakeStripe };
});

const PRICES = {
  STRIPE_PRICE_REGULAR_MONTH: 'price_it_regular_month',
  STRIPE_PRICE_REGULAR_YEAR: 'price_it_regular_year',
  STRIPE_PRICE_PREMIUM_MONTH: 'price_it_premium_month',
  STRIPE_PRICE_PREMIUM_YEAR: 'price_it_premium_year',
  STRIPE_PRICE_EXTRA_MAP_MONTH: 'price_it_extra_month',
  STRIPE_PRICE_EXTRA_MAP_YEAR: 'price_it_extra_year',
  STRIPE_PRICE_PREMIUM_EXTRA_MAP_MONTH: 'price_it_premium_extra_month',
  STRIPE_PRICE_PREMIUM_EXTRA_MAP_YEAR: 'price_it_premium_extra_year',
};
const WEBHOOK_SECRET = 'whsec_it_placeholder';
// Placeholders only (test mode shape), read by the billing service when used
Object.assign(process.env, PRICES, { STRIPE_SECRET_KEY: 'sk_test_it_placeholder', STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });

const { default: Stripe } = await import('stripe');
const { default: app } = await import('../../src/server.js');
const { PASSWORD, anon, cleanUp, data, defaultMapOf, givePlan, prisma, sentEmails, signUp, testEmail, trackUser } = await import('./helpers.js');

const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const eventIds = [];
let eventCounter = 0;

afterAll(async () => {
  await prisma.stripeEvent.deleteMany({ where: { id: { in: eventIds } } });
  await cleanUp();
});

beforeEach(() => {
  fake.calls.length = 0;
});

const callsTo = (name) => fake.calls.filter((c) => c.name === name);

/** A Stripe event, signed as Stripe signs it, sent with no Origin (as Stripe sends it). */
async function sendEvent(type, object, { id = `evt_it_${RUN}_${++eventCounter}`, secret = WEBHOOK_SECRET, origin } = {}) {
  eventIds.push(id);
  const payload = JSON.stringify({ id, object: 'event', type, data: { object } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  const req = request(app).post('/api/billing/webhook').set('Stripe-Signature', signature).set('Content-Type', 'application/json');
  if (origin) req.set('Origin', origin);
  const res = await req.send(payload);
  res.eventId = id;
  return res;
}

/** A Stripe subscription object, with its lines as [priceId, quantity]. */
const subscriptionObject = ({ id, customer, userId, status = 'active', lines, cancelAtPeriodEnd = false }) => ({
  id,
  object: 'subscription',
  customer,
  status,
  cancel_at_period_end: cancelAtPeriodEnd,
  cancel_at: null,
  metadata: userId ? { userId } : {},
  items: {
    data: lines.map(([price, quantity], i) => ({ id: `si_${id}_${i}`, price: { id: price }, quantity, current_period_end: 1893456000 })),
  },
});

describe('GET /billing', () => {
  it('starts on Economy with one map, room for two more free, and every price', async () => {
    const { agent } = await signUp('Newbie');
    const res = await agent.get('/api/billing');
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({
      plan: 'FREE',
      planName: 'Economy',
      source: 'FREE',
      interval: null,
      status: null,
      renewsAt: null,
      cancelAtPeriodEnd: false,
      grant: null,
      promoTrial: null,
      inviteOffer: null,
      includedMaps: 1,
      freeEconomyMaps: 2,
      extraMapsPaid: 0,
      ownedMaps: 1,
      economyMapIds: [],
      lockedMapIds: [],
      prices: {
        currency: 'GBP',
        plans: { FREE: { MONTH: 0, YEAR: 0 }, REGULAR: { MONTH: 499, YEAR: 4900 }, PREMIUM: { MONTH: 999, YEAR: 9900 } },
        extraMap: { FREE: { MONTH: 399, YEAR: 3900 }, REGULAR: { MONTH: 399, YEAR: 3900 }, PREMIUM: { MONTH: 599, YEAR: 5900 } },
      },
      paymentsEnabled: true,
    });
    expect((await anon().get('/api/billing')).status).toBe(401);
  });

  it('says payments are off without a secret key, and the writes answer 503', async () => {
    const { agent } = await signUp('NoStripe');
    const key = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      expect(data(await agent.get('/api/billing')).paymentsEnabled).toBe(false);
      for (const [path, body] of [
        ['/api/billing/checkout', { plan: 'REGULAR', interval: 'MONTH' }],
        ['/api/billing/change-plan', { plan: 'REGULAR', interval: 'MONTH' }],
        ['/api/billing/extra-maps', { quantity: 1 }],
        ['/api/billing/portal', {}],
      ]) {
        const res = await agent.post(path).send(body);
        expect(res.status).toBe(503);
        expect(res.body).toEqual({ status: 'error', message: "Payments aren't set up yet." });
      }
    } finally {
      process.env.STRIPE_SECRET_KEY = key;
    }
    expect(fake.calls).toEqual([]);
  });
});

describe('checkout', () => {
  it('opens Stripe Checkout for a plan and extra maps, linked to the user', async () => {
    const { agent, user } = await signUp('Buyer');
    const res = await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'YEAR', extraMaps: 2 });
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({ url: 'https://checkout.stripe.test/c/pay/cs_fake' });
    const [params] = callsTo('checkout.sessions.create')[0].args;
    expect(params).toMatchObject({
      mode: 'subscription',
      line_items: [
        { price: 'price_it_premium_year', quantity: 1 },
        { price: 'price_it_premium_extra_year', quantity: 2 },
      ],
      client_reference_id: user.id,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      // A Stripe customer of its own, made for this first Checkout
      customer: expect.stringMatching(/^cus_fake_/),
      success_url: 'http://localhost:5173/account?billing=success',
      cancel_url: 'http://localhost:5173/account?billing=cancelled',
    });

    // No promo code: no free days, and Stripe's own card rules
    expect(params.subscription_data.trial_period_days).toBeUndefined();
    expect(params.payment_method_collection).toBeUndefined();

    // Extra maps only, on Economy's price
    await agent.post('/api/billing/checkout').send({ plan: 'FREE', interval: 'MONTH', extraMaps: 1 });
    expect(callsTo('checkout.sessions.create')[1].args[0].line_items).toEqual([{ price: 'price_it_extra_month', quantity: 1 }]);
  });

  it('keeps one Stripe customer and one open Checkout per account', async () => {
    const { agent, user, email } = await signUp('Two Tabs');
    expect((await agent.post('/api/billing/checkout').send({ plan: 'REGULAR', interval: 'MONTH' })).status).toBe(200);
    expect(callsTo('customers.create').map((c) => c.args[0])).toEqual([{ email, metadata: { userId: user.id } }]);
    const { stripeCustomerId: customer } = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(callsTo('checkout.sessions.create')[0].args[0]).toMatchObject({ customer });
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'FREE', status: null });

    // A second tab: the same customer, and the first Checkout expired so it can't be paid too
    expect((await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH' })).status).toBe(200);
    expect(callsTo('customers.create')).toHaveLength(1);
    expect(callsTo('checkout.sessions.expire')).toHaveLength(1);
    expect(callsTo('checkout.sessions.create')[1].args[0]).toMatchObject({ customer });
    expect(fake.openSessions.get(customer)).toHaveLength(1);
  });

  it('refuses bad input, nothing to buy, an unverified address and a second subscription', async () => {
    const { agent, user } = await signUp('Picky Buyer');
    for (const body of [
      { plan: 'GOLD', interval: 'MONTH' },
      { plan: 'REGULAR', interval: 'WEEK' },
      { plan: 'REGULAR', interval: 'MONTH', extraMaps: -1 },
      { plan: 'REGULAR', interval: 'MONTH', extraMaps: 1.5 },
      { plan: 'FREE', interval: 'MONTH' },
    ]) {
      expect((await agent.post('/api/billing/checkout').send(body)).status).toBe(400);
    }
    await givePlan(user.id, { plan: 'REGULAR' });
    const again = await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH' });
    expect(again.status).toBe(409);
    expect(again.body.message).toBe('You already have a subscription. Change its plan or extra maps instead.');
    // After it has ended, a new checkout reuses the Stripe customer
    await givePlan(user.id, { status: 'canceled' });
    expect((await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH' })).status).toBe(200);
    expect(callsTo('checkout.sessions.create').at(-1).args[0]).toMatchObject({ customer: `cus_it_${user.id}` });

    const unverified = await signUp('Unverified Buyer', { verified: false });
    expect((await unverified.agent.post('/api/billing/checkout').send({ plan: 'REGULAR', interval: 'MONTH' })).status).toBe(403);
    expect(fake.calls.filter((c) => c.name === 'checkout.sessions.create')).toHaveLength(1);
  });
});

describe("a promo code's free month", () => {
  const CODE = `IT${RUN}`.toUpperCase().slice(0, 24);
  let promo;

  beforeAll(async () => {
    promo = await prisma.promoCode.create({ data: { code: CODE, label: 'Integration test creator' } });
  });
  afterAll(async () => {
    if (promo) await prisma.promoCode.delete({ where: { id: promo.id } });
  });

  /** A verified account that signed up with the code. */
  async function follower(label) {
    const who = await signUp(label);
    await prisma.profile.upsert({
      where: { userId: who.user.id },
      update: { promoCodeId: promo.id },
      create: { userId: who.user.id, promoCodeId: promo.id },
    });
    return who;
  }

  it('makes the first paid Checkout free for 30 days, with a card, once', async () => {
    const { agent, user } = await follower('Follower');
    expect(data(await agent.get('/api/billing')).promoTrial).toEqual({ code: CODE, days: 30 });

    // Extra maps with the plan: no free month (it would cover them too); it stays for later
    await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH', extraMaps: 1 });
    expect(callsTo('checkout.sessions.create').at(-1).args[0].subscription_data).toEqual({ metadata: { userId: user.id } });
    expect(data(await agent.get('/api/billing')).promoTrial).toEqual({ code: CODE, days: 30 });

    // Extra maps alone: no free month, and it's still there afterwards
    await agent.post('/api/billing/checkout').send({ plan: 'FREE', interval: 'MONTH', extraMaps: 1 });
    const [extrasOnly] = callsTo('checkout.sessions.create').at(-1).args;
    expect(extrasOnly.subscription_data).toEqual({ metadata: { userId: user.id } });
    expect(extrasOnly.payment_method_collection).toBeUndefined();

    const res = await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH' });
    expect(res.status).toBe(200);
    expect(callsTo('checkout.sessions.create').at(-1).args[0]).toMatchObject({
      line_items: [{ price: 'price_it_premium_month', quantity: 1 }],
      payment_method_collection: 'always',
      subscription_data: { metadata: { userId: user.id, promoCode: CODE }, trial_period_days: 30 },
    });

    // Stripe makes the subscription in its trial: the plan counts, and the month is used
    const sub = {
      ...subscriptionObject({
        id: `sub_it_${RUN}_trial`,
        customer: `cus_it_${RUN}_trial`,
        userId: user.id,
        status: 'trialing',
        lines: [['price_it_premium_month', 1]],
      }),
      trial_end: 1893456000,
    };
    sub.metadata.promoCode = CODE;
    expect((await sendEvent('customer.subscription.created', sub)).status).toBe(200);
    expect((await prisma.profile.findUnique({ where: { userId: user.id } })).promoTrialUsedAt).toBeInstanceOf(Date);
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'PREMIUM', source: 'STRIPE', status: 'trialing', promoTrial: null });

    // Cancelled during the free month: a new Checkout pays from the first day
    expect((await sendEvent('customer.subscription.deleted', { ...sub, status: 'canceled' })).status).toBe(200);
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'FREE', promoTrial: null });
    expect((await agent.post('/api/billing/checkout').send({ plan: 'REGULAR', interval: 'MONTH' })).status).toBe(200);
    expect(callsTo('checkout.sessions.create').at(-1).args[0].subscription_data).toEqual({ metadata: { userId: user.id } });
  });

  it('is kept when the code is turned off, and shown only without a subscription', async () => {
    const { agent, user } = await follower('Late Follower');
    await prisma.promoCode.update({ where: { id: promo.id }, data: { active: false } });
    try {
      expect(data(await agent.get('/api/billing')).promoTrial).toEqual({ code: CODE, days: 30 });
    } finally {
      await prisma.promoCode.update({ where: { id: promo.id }, data: { active: true } });
    }
    await givePlan(user.id, { plan: 'REGULAR' });
    expect(data(await agent.get('/api/billing')).promoTrial).toBeNull();
  });
});

describe('changing a subscription', () => {
  /** A user whose live subscription the fake Stripe holds, as the webhook would have recorded it. */
  async function subscriber(label, lines, { plan, extraMaps = 0, interval = 'MONTH' }) {
    const who = await signUp(label);
    const row = await givePlan(who.user.id, { plan, extraMaps, interval });
    fake.subscriptions.set(
      row.stripeSubscriptionId,
      subscriptionObject({ id: row.stripeSubscriptionId, customer: row.stripeCustomerId, lines })
    );
    return { ...who, subscriptionId: row.stripeSubscriptionId };
  }

  it('changes the plan line, moving the extra maps to the new plan’s price and interval', async () => {
    const s = await subscriber('Upgrader', [['price_it_regular_month', 1], ['price_it_extra_month', 2]], { plan: 'REGULAR', extraMaps: 2 });
    const res = await s.agent.post('/api/billing/change-plan').send({ plan: 'PREMIUM', interval: 'YEAR' });
    expect(res.status).toBe(200);
    expect(data(res).billing).toMatchObject({ plan: 'PREMIUM', planName: 'First Class', source: 'STRIPE', interval: 'YEAR', extraMapsPaid: 2 });
    const [id, params] = callsTo('subscriptions.update')[0].args;
    expect(id).toBe(s.subscriptionId);
    expect(params).toEqual({
      items: [
        { id: `si_${s.subscriptionId}_0`, price: 'price_it_premium_year', quantity: 1 },
        { id: `si_${s.subscriptionId}_1`, price: 'price_it_premium_extra_year', quantity: 2 },
      ],
      proration_behavior: 'create_prorations',
    });

    // Down to Economy keeps the extra maps only
    const down = await s.agent.post('/api/billing/change-plan').send({ plan: 'FREE', interval: 'YEAR' });
    expect(down.status).toBe(200);
    expect(data(down).billing).toMatchObject({ plan: 'FREE', extraMapsPaid: 2 });
    expect(callsTo('subscriptions.update')[1].args[1].items).toEqual([
      { id: `si_${s.subscriptionId}_0`, deleted: true },
      { id: `si_${s.subscriptionId}_1`, price: 'price_it_extra_year', quantity: 2 },
    ]);
  });

  it('needs a subscription, and won’t drop the last line', async () => {
    const none = await signUp('NoSub');
    expect((await none.agent.post('/api/billing/change-plan').send({ plan: 'PREMIUM', interval: 'MONTH' })).status).toBe(409);
    const s = await subscriber('PlanOnly', [['price_it_regular_month', 1]], { plan: 'REGULAR' });
    const res = await s.agent.post('/api/billing/change-plan').send({ plan: 'FREE', interval: 'MONTH' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('To stop paying altogether, cancel from the billing portal.');
    expect((await s.agent.post('/api/billing/change-plan').send({ plan: 'REGULAR' })).status).toBe(400);
  });

  it('extra maps: { billing } with a subscription, { url } without one', async () => {
    const s = await subscriber('MoreMaps', [['price_it_regular_month', 1]], { plan: 'REGULAR' });
    const added = await s.agent.post('/api/billing/extra-maps').send({ quantity: 3 });
    expect(added.status).toBe(200);
    expect(Object.keys(data(added))).toEqual(['billing']);
    expect(data(added).billing).toMatchObject({ plan: 'REGULAR', extraMapsPaid: 3 });
    expect(callsTo('subscriptions.update')[0].args[1].items).toEqual([{ price: 'price_it_extra_month', quantity: 3 }]);
    // Five new maps fit now: two free, three paid for
    for (let i = 0; i < 5; i++) {
      expect((await s.agent.post('/api/maps').send({ name: `Extra ${i}`, groupType: 'SOLO', travellers: [{ name: 'Me' }] })).status).toBe(201);
    }

    const fewer = await s.agent.post('/api/billing/extra-maps').send({ quantity: 1 });
    expect(data(fewer).billing).toMatchObject({ extraMapsPaid: 1, ownedMaps: 6 });
    // Fewer paid than in use: two run on Economy, two are locked, none deleted
    expect(data(fewer).billing.economyMapIds).toHaveLength(2);
    expect(data(fewer).billing.lockedMapIds).toHaveLength(2);
    const removed = await s.agent.post('/api/billing/extra-maps').send({ quantity: 0 });
    expect(data(removed).billing).toMatchObject({ extraMapsPaid: 0 });
    expect(callsTo('subscriptions.update').at(-1).args[1].items).toEqual([{ id: expect.stringMatching(/^si_/), deleted: true }]);

    const newcomer = await signUp('FirstExtra');
    const checkout = await newcomer.agent.post('/api/billing/extra-maps').send({ quantity: 2, interval: 'YEAR' });
    expect(checkout.status).toBe(200);
    expect(data(checkout)).toEqual({ url: 'https://checkout.stripe.test/c/pay/cs_fake' });
    expect(callsTo('checkout.sessions.create').at(-1).args[0].line_items).toEqual([{ price: 'price_it_extra_year', quantity: 2 }]);
    expect((await newcomer.agent.post('/api/billing/extra-maps').send({ quantity: 0 })).status).toBe(400);
    expect((await newcomer.agent.post('/api/billing/extra-maps').send({ quantity: 'lots' })).status).toBe(400);
  });

  it('a new plan ends a free month, and extra maps wait until it has ended', async () => {
    const s = await subscriber('Trialist', [['price_it_regular_month', 1]], { plan: 'REGULAR' });
    await prisma.subscription.update({ where: { userId: s.user.id }, data: { status: 'trialing' } });
    fake.subscriptions.set(s.subscriptionId, { ...fake.subscriptions.get(s.subscriptionId), status: 'trialing' });

    const extra = await s.agent.post('/api/billing/extra-maps').send({ quantity: 1 });
    expect(extra.status).toBe(409);
    expect(extra.body.message).toBe('Extra maps can be added once your free month ends.');
    expect(callsTo('subscriptions.update')).toHaveLength(0);

    // Monthly to yearly on the same plan keeps the free month; another plan ends it
    expect((await s.agent.post('/api/billing/change-plan').send({ plan: 'REGULAR', interval: 'YEAR' })).status).toBe(200);
    expect(callsTo('subscriptions.update').at(-1).args[1].trial_end).toBeUndefined();
    expect((await s.agent.post('/api/billing/change-plan').send({ plan: 'PREMIUM', interval: 'YEAR' })).status).toBe(200);
    expect(callsTo('subscriptions.update').at(-1).args[1].trial_end).toBe('now');
  });

  it('opens the customer portal for an account with a Stripe customer', async () => {
    const s = await subscriber('Portal', [['price_it_regular_month', 1]], { plan: 'REGULAR' });
    const res = await s.agent.post('/api/billing/portal');
    expect(data(res)).toEqual({ url: 'https://billing.stripe.test/p/session' });
    expect(callsTo('billingPortal.sessions.create')[0].args[0]).toEqual({
      customer: `cus_it_${s.user.id}`,
      return_url: 'http://localhost:5173/account',
    });
    const none = await signUp('NoCustomer');
    expect((await none.agent.post('/api/billing/portal')).status).toBe(409);
  });
});

describe('deleting an account', () => {
  const userRow = (id) => prisma.user.findUnique({ where: { id }, select: { id: true } });
  async function payer(label, { known = true } = {}) {
    const who = await signUp(label);
    const row = await givePlan(who.user.id, { plan: 'REGULAR' });
    if (known) {
      fake.subscriptions.set(
        row.stripeSubscriptionId,
        subscriptionObject({ id: row.stripeSubscriptionId, customer: row.stripeCustomerId, lines: [['price_it_regular_month', 1]] })
      );
    }
    return { ...who, subscriptionId: row.stripeSubscriptionId };
  }
  const deleteOwn = (who) => who.agent.post('/api/auth/delete-user').send({ password: PASSWORD });

  it('cancels its subscription with Stripe first, so the card stops being charged', async () => {
    const leaver = await payer('Leaving payer');
    expect((await deleteOwn(leaver)).status).toBe(200);
    expect(callsTo('subscriptions.cancel').map((c) => c.args[0])).toContain(leaver.subscriptionId);
    expect(fake.subscriptions.get(leaver.subscriptionId).status).toBe('canceled');
    expect(await userRow(leaver.user.id)).toBeNull();

    // Stripe's notice that it ended finds no account, and changes nothing
    const ended = fake.subscriptions.get(leaver.subscriptionId);
    expect((await sendEvent('customer.subscription.deleted', ended)).status).toBe(200);
  });

  it('keeps the account when Stripe can’t be told, and deletes it once it can', async () => {
    const leaver = await payer('Unlucky payer');
    fake.cancelFails = true;
    try {
      const res = await deleteOwn(leaver);
      expect(res.status).toBe(503);
      expect(res.body.message).toMatch(/couldn't cancel your subscription/);
      expect(await userRow(leaver.user.id)).not.toBeNull();
      expect(await prisma.subscription.findUnique({ where: { userId: leaver.user.id } })).not.toBeNull();
    } finally {
      fake.cancelFails = false;
    }
    expect((await deleteOwn(leaver)).status).toBe(200);
    expect(await userRow(leaver.user.id)).toBeNull();
  });

  it('goes ahead when Stripe no longer has the subscription', async () => {
    const leaver = await payer('Forgotten payer', { known: false });
    expect((await deleteOwn(leaver)).status).toBe(200);
    expect(await userRow(leaver.user.id)).toBeNull();
  });

  it('an admin’s delete cancels it too', async () => {
    const admin = await signUp('Billing admin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
    const target = await payer('Removed payer');
    expect((await admin.agent.delete(`/api/users/admin/delete-user-by-id/${target.user.id}`)).status).toBe(200);
    expect(callsTo('subscriptions.cancel').map((c) => c.args[0])).toContain(target.subscriptionId);
    expect(await userRow(target.user.id)).toBeNull();
  });
});

describe('the webhook', () => {
  it('links the checkout, then sets the plan from the subscription; a repeated event changes nothing', async () => {
    const { agent, user } = await signUp('Webhooked');
    const customer = `cus_it_wh_${RUN}`;
    const subId = `sub_it_wh_${RUN}`;

    const completed = await sendEvent('checkout.session.completed', {
      id: 'cs_fake',
      object: 'checkout.session',
      mode: 'subscription',
      client_reference_id: user.id,
      metadata: { userId: user.id },
      customer,
      subscription: subId,
    });
    // Stripe sends no Origin, and the cross-site check lets it through
    expect(completed.status).toBe(200);
    expect(data(completed)).toEqual({ received: true });
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({
      stripeCustomerId: customer,
      stripeSubscriptionId: subId,
      plan: 'FREE',
      status: null,
    });

    const created = subscriptionObject({ id: subId, customer, lines: [['price_it_regular_year', 1], ['price_it_extra_year', 2]] });
    const first = await sendEvent('customer.subscription.created', created);
    expect(first.status).toBe(200);
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({
      plan: 'REGULAR',
      interval: 'YEAR',
      extraMaps: 2,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(1893456000 * 1000),
    });
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'REGULAR', source: 'STRIPE', extraMapsPaid: 2 });

    // Stripe retries: the same event id is applied once
    await prisma.subscription.update({ where: { userId: user.id }, data: { extraMaps: 5 } });
    const payload = JSON.stringify({ id: first.eventId, object: 'event', type: 'customer.subscription.created', data: { object: created } });
    const retry = await request(app)
      .post('/api/billing/webhook')
      .set('Stripe-Signature', Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET }))
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(retry.status).toBe(200);
    expect(data(retry)).toEqual({ received: true, duplicate: true });
    expect((await prisma.subscription.findUnique({ where: { userId: user.id } })).extraMaps).toBe(5);
    expect(await prisma.stripeEvent.findUnique({ where: { id: first.eventId } })).toMatchObject({ type: 'customer.subscription.created' });

    // Cancelling at the period end, then the end itself
    await sendEvent('customer.subscription.updated', { ...created, cancel_at_period_end: true });
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'REGULAR', cancelAtPeriodEnd: true });
    await sendEvent('customer.subscription.deleted', { ...created, status: 'canceled' });
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({
      plan: 'FREE',
      extraMaps: 0,
      status: 'canceled',
    });
    // A late update can't revive it
    await sendEvent('customer.subscription.updated', created);
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'FREE', status: 'canceled', extraMapsPaid: 0 });
  });

  // 19 Nov 2026, the audit: the checkout linked the new subscription to a row still saying
  // "canceled", so every event about it was taken for a late one about a dead subscription
  it('applies a returning subscriber’s new subscription when the checkout’s event comes first', async () => {
    const { agent, user } = await signUp('Returning');
    const customer = `cus_it_back_${RUN}`;
    const before = subscriptionObject({ id: `sub_it_back1_${RUN}`, customer, userId: user.id, lines: [['price_it_regular_year', 1]] });
    await sendEvent('customer.subscription.created', before);
    await sendEvent('customer.subscription.deleted', { ...before, status: 'canceled' });
    expect((await prisma.subscription.findUnique({ where: { userId: user.id } })).status).toBe('canceled');

    const again = subscriptionObject({ id: `sub_it_back2_${RUN}`, customer, userId: user.id, lines: [['price_it_premium_month', 1]] });
    await sendEvent('checkout.session.completed', {
      id: 'cs_fake_back',
      object: 'checkout.session',
      mode: 'subscription',
      client_reference_id: user.id,
      metadata: { userId: user.id },
      customer,
      subscription: again.id,
    });
    expect((await sendEvent('customer.subscription.created', again)).status).toBe(200);
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({
      stripeSubscriptionId: again.id,
      plan: 'PREMIUM',
      status: 'active',
    });
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'PREMIUM', source: 'STRIPE' });
  });

  it('finds the account by the subscription’s metadata when it comes before the checkout', async () => {
    const { user } = await signUp('EarlyEvent');
    const sub = subscriptionObject({
      id: `sub_it_early_${RUN}`,
      customer: `cus_it_early_${RUN}`,
      userId: user.id,
      lines: [['price_it_premium_month', 1]],
    });
    expect((await sendEvent('customer.subscription.created', sub)).status).toBe(200);
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({
      stripeCustomerId: `cus_it_early_${RUN}`,
      plan: 'PREMIUM',
      status: 'active',
    });
    // An event for a customer and user nobody has is acknowledged and ignored
    const stranger = subscriptionObject({ id: `sub_it_x_${RUN}`, customer: `cus_it_x_${RUN}`, userId: 'no-such-user', lines: [] });
    expect((await sendEvent('customer.subscription.updated', stranger)).status).toBe(200);
    expect(await prisma.subscription.findUnique({ where: { stripeCustomerId: `cus_it_x_${RUN}` } })).toBeNull();
    // Types it doesn't handle are recorded and ignored
    expect((await sendEvent('invoice.paid', { id: 'in_1', object: 'invoice' })).status).toBe(200);
  });

  it('applies a subscription as Stripe has it now, not as a late event saw it', async () => {
    const { user } = await signUp('Late Event');
    const customer = `cus_it_late_${RUN}`;
    const now = subscriptionObject({ id: `sub_it_late_${RUN}`, customer, userId: user.id, lines: [['price_it_premium_month', 1]] });
    fake.subscriptions.set(now.id, now);
    // An old update (still on Business) arriving after the change to First Class
    const old = subscriptionObject({ id: now.id, customer, userId: user.id, lines: [['price_it_regular_month', 1]] });
    expect((await sendEvent('customer.subscription.updated', old)).status).toBe(200);
    expect(callsTo('subscriptions.retrieve').map((c) => c.args[0])).toEqual([now.id]);
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({ plan: 'PREMIUM' });
  });

  it('cancels a second live subscription for an account that already has one', async () => {
    const { user } = await signUp('Double Click');
    const customer = `cus_it_dup_${RUN}`;
    const first = subscriptionObject({ id: `sub_it_dup1_${RUN}`, customer, userId: user.id, lines: [['price_it_regular_month', 1]] });
    await sendEvent('customer.subscription.created', first);
    const second = subscriptionObject({ id: `sub_it_dup2_${RUN}`, customer, userId: user.id, lines: [['price_it_premium_month', 1]] });
    fake.subscriptions.set(second.id, second);

    // Its checkout completing never replaces the one the account has
    await sendEvent('checkout.session.completed', {
      id: 'cs_dup',
      object: 'checkout.session',
      mode: 'subscription',
      client_reference_id: user.id,
      metadata: { userId: user.id },
      customer,
      subscription: second.id,
    });
    expect((await sendEvent('customer.subscription.created', second)).status).toBe(200);
    expect(callsTo('subscriptions.cancel').map((c) => c.args[0])).toEqual([second.id]);
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({
      stripeSubscriptionId: first.id,
      plan: 'REGULAR',
      status: 'active',
    });
    // Its end is a late event about another subscription: nothing changes
    await sendEvent('customer.subscription.deleted', { ...second, status: 'canceled' });
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toMatchObject({ stripeSubscriptionId: first.id, status: 'active' });
  });

  it('refuses a bad signature, and a write from another site', async () => {
    const payload = JSON.stringify({ id: `evt_it_bad_${RUN}`, object: 'event', type: 'customer.subscription.created', data: { object: {} } });
    const wrongSecret = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_someone_else' });
    for (const signature of [wrongSecret, 't=1,v1=abc', undefined]) {
      const req = request(app).post('/api/billing/webhook').set('Content-Type', 'application/json');
      if (signature) req.set('Stripe-Signature', signature);
      const res = await req.send(payload);
      expect(res.status).toBe(400);
    }
    expect(await prisma.stripeEvent.findUnique({ where: { id: `evt_it_bad_${RUN}` } })).toBeNull();
    // A browser on another site is refused before the signature is even read
    expect((await sendEvent('invoice.paid', {}, { origin: 'https://evil.example' })).status).toBe(403);
  });
});

describe('complimentary memberships', () => {
  it('an admin gives a plan for some months, lists it and ends it early', async () => {
    const admin = await signUp('GrantAdmin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
    const creator = await signUp('Influencer');
    const map = await defaultMapOf(creator.agent);

    const url = `/api/users/admin/plan-grants/${creator.user.id}`;
    expect((await creator.agent.post(url).send({ plan: 'PREMIUM', months: 12 })).status).toBe(403);
    for (const body of [{ plan: 'FREE', months: 12 }, { plan: 'PREMIUM', months: 0 }, { plan: 'PREMIUM', months: 37 }, { plan: 'PREMIUM' }]) {
      expect((await admin.agent.post(url).send(body)).status).toBe(400);
    }
    const self = await admin.agent.post(`/api/users/admin/plan-grants/${admin.user.id}`).send({ plan: 'PREMIUM', months: 1 });
    expect(self.status).toBe(403);
    expect((await admin.agent.post('/api/users/admin/plan-grants/no-such-user').send({ plan: 'PREMIUM', months: 1 })).status).toBe(404);

    const given = await admin.agent.post(url).send({ plan: 'PREMIUM', months: 12, reason: 'Travel creator, 2026 campaign' });
    expect(given.status).toBe(201);
    const grant = data(given).grant;
    expect(grant).toMatchObject({ plan: 'PREMIUM', reason: 'Travel creator, 2026 campaign', grantedById: admin.user.id, active: true });
    const months = (new Date(grant.endsAt) - new Date(grant.startsAt)) / (24 * 60 * 60 * 1000);
    expect(months).toBeGreaterThanOrEqual(365);
    expect(months).toBeLessThanOrEqual(366);

    // The plan follows, and so do their maps
    expect(data(await creator.agent.get('/api/billing'))).toMatchObject({
      plan: 'PREMIUM',
      source: 'COMPLIMENTARY',
      grant: { plan: 'PREMIUM', endsAt: grant.endsAt },
    });
    expect(data(await creator.agent.get(`/api/maps/${map.id}`)).map.uploadRules).toEqual({
      keepsOriginals: true,
      photosPerCountry: 1000,
      // First Class takes videos
      videos: { perCountry: 20, maxSeconds: 180, maxBytes: 500 * 1024 * 1024, contentTypes: ['video/mp4', 'video/quicktime'] },
      locked: false,
    });
    expect(data(await admin.agent.get(url))).toMatchObject({ plan: 'PREMIUM', source: 'COMPLIMENTARY', grants: [{ id: grant.id, active: true }] });

    const ended = await admin.agent.patch(`/api/users/admin/end-plan-grant/${grant.id}`);
    expect(ended.status).toBe(200);
    expect(data(ended).grant.active).toBe(false);
    expect((await admin.agent.patch(`/api/users/admin/end-plan-grant/${grant.id}`)).status).toBe(409);
    expect((await admin.agent.patch('/api/users/admin/end-plan-grant/00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect(data(await creator.agent.get('/api/billing'))).toMatchObject({ plan: 'FREE', source: 'FREE', grant: null });

    // Logged without the reason
    const events = await vi.waitFor(async () => {
      const rows = await prisma.appEvent.findMany({ where: { domain: 'billing', targetId: creator.user.id } });
      expect(rows.map((e) => e.action).sort()).toEqual(['Grant Create Success', 'Grant End Success']);
      return rows;
    });
    expect(events.some((e) => e.message.includes('Travel creator'))).toBe(false);
  });
});

describe('the daily clean-up', () => {
  it('purges webhook event ids over 90 days old', async () => {
    const old = `evt_it_old_${RUN}`;
    const recent = `evt_it_recent_${RUN}`;
    eventIds.push(old, recent);
    await prisma.stripeEvent.createMany({
      data: [
        { id: old, type: 'invoice.paid', processedAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000) },
        { id: recent, type: 'invoice.paid', processedAt: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000) },
      ],
    });
    // Its own secret, as cleanup.test.js does, so the run needs none on the command line
    vi.stubEnv('CRON_SECRET', 'it-cron-secret');
    const res = await request(app).get('/api/media-services/cron/cleanup-orphans').set('Authorization', 'Bearer it-cron-secret');
    vi.unstubAllEnvs();
    expect(res.status).toBe(200);
    expect(data(res).oldStripeEvents).toBeGreaterThanOrEqual(1);
    expect(await prisma.stripeEvent.findUnique({ where: { id: old } })).toBeNull();
    expect(await prisma.stripeEvent.findUnique({ where: { id: recent } })).not.toBeNull();
  });
});

// The invite offer (19 Nov 2026, docs/API.md "The invite offer"): half price for 3 months on the
// invited map's paid plan, for a new account that subscribes within 7 days
describe('the invite offer', () => {
  /** A First Class owner invites a new address; it signs up from the link. */
  async function invitedNewcomer(label) {
    const owner = await signUp(`${label}Owner`);
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    const map = await defaultMapOf(owner.agent);
    const email = testEmail(label);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email, role: 'VIEWER' })).status).toBe(201);
    await vi.waitFor(() => expect(sentEmails().filter((e) => e.to === email && e.template === 'shareEmail')).toHaveLength(1));
    const mail = sentEmails().find((e) => e.to === email && e.template === 'shareEmail');
    expect(mail.context).toMatchObject({ offerPlanName: 'First Class', offerYearly: '£14.99' });
    const token = mail.context.actionUrl.split('/').pop();
    expect(data(await anon().get(`/api/invites/${token}`)).invite.offer).toEqual({ plan: 'PREMIUM', planName: 'First Class' });
    const agent = anon();
    const res = await agent.post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name: label, inviteToken: token });
    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    trackUser(user.id);
    return { agent, user, map };
  }

  it('gives the new account the map’s plan at half price, for monthly and yearly Checkouts', async () => {
    const { agent, user } = await invitedNewcomer('Halfprice');
    await vi.waitFor(async () => expect(data(await agent.get('/api/billing')).inviteOffer).toMatchObject({ plan: 'PREMIUM' }));

    expect((await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH' })).status).toBe(200);
    expect(callsTo('checkout.sessions.create').at(-1).args[0]).toMatchObject({
      discounts: [{ coupon: 'invite-offer-half-3-months' }],
      subscription_data: { metadata: { userId: user.id, inviteOffer: 'PREMIUM' } },
    });
    expect(callsTo('coupons.create').at(-1).args[0]).toMatchObject({ id: 'invite-offer-half-3-months', percent_off: 50, duration: 'repeating', duration_in_months: 3 });

    // Yearly: the same saving off the first year, never half the year
    expect((await agent.post('/api/billing/checkout').send({ plan: 'REGULAR', interval: 'YEAR' })).status).toBe(200);
    expect(callsTo('checkout.sessions.create').at(-1).args[0].discounts).toEqual([{ coupon: 'invite-offer-year-regular' }]);
    expect(callsTo('coupons.create').at(-1).args[0]).toMatchObject({ amount_off: 749, currency: 'gbp', duration: 'once' });
    // Not with extra maps in the same Checkout
    await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH', extraMaps: 1 });
    expect(callsTo('checkout.sessions.create').at(-1).args[0].discounts).toBeUndefined();

    // The subscription it started: used, once
    const sub = subscriptionObject({ id: `sub_it_${RUN}_offer`, customer: `cus_it_${RUN}_offer`, userId: user.id, lines: [['price_it_premium_month', 1]] });
    sub.metadata.inviteOffer = 'PREMIUM';
    expect((await sendEvent('customer.subscription.created', sub)).status).toBe(200);
    expect((await prisma.profile.findUnique({ where: { userId: user.id } })).inviteOfferUsedAt).toBeInstanceOf(Date);
    expect(data(await agent.get('/api/billing')).inviteOffer).toBeNull();
  });

  it('ends 7 days after signing up', async () => {
    const { agent, user } = await invitedNewcomer('Lateone');
    await vi.waitFor(async () => expect(data(await agent.get('/api/billing')).inviteOffer).not.toBeNull());
    await prisma.profile.update({ where: { userId: user.id }, data: { inviteOfferEndsAt: new Date(Date.now() - 1000) } });
    expect(data(await agent.get('/api/billing')).inviteOffer).toBeNull();
    await agent.post('/api/billing/checkout').send({ plan: 'PREMIUM', interval: 'MONTH' });
    expect(callsTo('checkout.sessions.create').at(-1).args[0].discounts).toBeUndefined();
  });

  it('is never given to someone who already had an account', async () => {
    const owner = await signUp('PaidOwner');
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    const map = await defaultMapOf(owner.agent);
    const old = await signUp('OldTimer');
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: old.email, role: 'EDITOR' })).status).toBe(201);
    expect(data(await old.agent.get('/api/billing')).inviteOffer).toBeNull();
  });
});
