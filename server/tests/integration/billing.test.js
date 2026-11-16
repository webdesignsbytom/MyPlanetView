// Plans and billing (docs/API.md, "Plans and billing"): GET /billing, Checkout, plan and
// extra-map changes and the portal against a fake Stripe client, the webhook with real
// signatures (the SDK's own signing code), complimentary memberships, and the cron purge.
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// A fake Stripe: records each call and keeps subscriptions in memory. Webhook signing
// and checking stay the real SDK's.
const fake = vi.hoisted(() => ({ calls: [], subscriptions: new Map(), next: 1 }));

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
      this.checkout = {
        sessions: {
          create: record('checkout.sessions.create', () => ({ id: 'cs_fake', url: 'https://checkout.stripe.test/c/pay/cs_fake' })),
        },
      };
      this.billingPortal = {
        sessions: { create: record('billingPortal.sessions.create', () => ({ url: 'https://billing.stripe.test/p/session' })) },
      };
      this.subscriptions = {
        retrieve: record('subscriptions.retrieve', (id) => fake.subscriptions.get(id)),
        update: record('subscriptions.update', update),
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
const { anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp } = await import('./helpers.js');

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
  it('starts on Economy with one map and every price', async () => {
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
      includedMaps: 1,
      extraMapsPaid: 0,
      ownedMaps: 1,
      lockedMapIds: [],
      prices: {
        currency: 'GBP',
        plans: { FREE: { MONTH: 0, YEAR: 0 }, REGULAR: { MONTH: 499, YEAR: 4900 }, PREMIUM: { MONTH: 899, YEAR: 8900 } },
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
    const { agent, user, email } = await signUp('Buyer');
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
      customer_email: email,
      success_url: 'http://localhost:5173/account?billing=success',
      cancel_url: 'http://localhost:5173/account?billing=cancelled',
    });

    // Extra maps only, on Economy's price
    await agent.post('/api/billing/checkout').send({ plan: 'FREE', interval: 'MONTH', extraMaps: 1 });
    expect(callsTo('checkout.sessions.create')[1].args[0].line_items).toEqual([{ price: 'price_it_extra_month', quantity: 1 }]);
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
    // Three new maps fit now
    for (let i = 0; i < 3; i++) {
      expect((await s.agent.post('/api/maps').send({ name: `Extra ${i}`, groupType: 'SOLO', travellers: [{ name: 'Me' }] })).status).toBe(201);
    }

    const fewer = await s.agent.post('/api/billing/extra-maps').send({ quantity: 1 });
    expect(data(fewer).billing).toMatchObject({ extraMapsPaid: 1, ownedMaps: 4 });
    // Fewer paid than in use: two are locked, none deleted
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
    const res = await request(app).get('/api/media-services/cron/cleanup-orphans').set('Authorization', 'Bearer it-cron-secret');
    expect(res.status).toBe(200);
    expect(data(res).oldStripeEvents).toBeGreaterThanOrEqual(1);
    expect(await prisma.stripeEvent.findUnique({ where: { id: old } })).toBeNull();
    expect(await prisma.stripeEvent.findUnique({ where: { id: recent } })).not.toBeNull();
  });
});
