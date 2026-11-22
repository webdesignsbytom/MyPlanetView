// Give a month, get a month (docs/API.md "Give a month, get a month"): a member's own invite
// code, the friend's free month (every code's offer), and the member's month once the friend
// pays (their subscription first active, from the webhook): a credit off a paying member's
// next invoice, else a month of a plan, at most twelve a year, once per friend.
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// A fake Stripe: subscriptions kept in memory, credits recorded. Webhook signing stays the SDK's.
const fake = vi.hoisted(() => ({ calls: [], subscriptions: new Map() }));

vi.mock('stripe', async (importOriginal) => {
  const actual = await importOriginal();
  const record = (name, fn) => async (...args) => {
    fake.calls.push({ name, args });
    return fn(...args);
  };
  class FakeStripe {
    constructor(key) {
      this.key = key;
      this.customers = {
        createBalanceTransaction: record('customers.createBalanceTransaction', (customer, params) => ({ id: `cbtxn_${fake.calls.length}`, customer, ...params })),
      };
      this.subscriptions = { retrieve: record('subscriptions.retrieve', (id) => fake.subscriptions.get(id)) };
    }
  }
  FakeStripe.webhooks = actual.default.webhooks;
  return { default: FakeStripe };
});

const WEBHOOK_SECRET = 'whsec_it_referrals';
Object.assign(process.env, {
  STRIPE_SECRET_KEY: 'sk_test_it_referrals',
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  STRIPE_PRICE_REGULAR_MONTH: 'price_it_regular_month',
  STRIPE_PRICE_REGULAR_YEAR: 'price_it_regular_year',
  STRIPE_PRICE_PREMIUM_MONTH: 'price_it_premium_month',
  STRIPE_PRICE_PREMIUM_YEAR: 'price_it_premium_year',
  STRIPE_PRICE_EXTRA_MAP_MONTH: 'price_it_extra_month',
  STRIPE_PRICE_EXTRA_MAP_YEAR: 'price_it_extra_year',
  STRIPE_PRICE_PREMIUM_EXTRA_MAP_MONTH: 'price_it_premium_extra_month',
  STRIPE_PRICE_PREMIUM_EXTRA_MAP_YEAR: 'price_it_premium_extra_year',
});

const { default: Stripe } = await import('stripe');
const { default: app } = await import('../../src/server.js');
const { PASSWORD, ORIGIN, anon, cleanUp, data, givePlan, prisma, signUp, testEmail, trackUser } = await import('./helpers.js');

const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const eventIds = [];
let n = 0;

afterAll(async () => {
  await prisma.stripeEvent.deleteMany({ where: { id: { in: eventIds } } });
  await cleanUp();
});

/** A friend signing up with the member's code (verified), as the sign-up page sends it. */
async function friendWith(code, label) {
  const email = testEmail(label);
  const agent = request.agent(app).set('Origin', ORIGIN);
  const res = await agent.post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name: label, promoCode: code });
  expect(res.status).toBe(200);
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  trackUser(user.id);
  return { agent, user };
}

/** The friend's subscription reaching the webhook with `status`, as Stripe sends it. */
async function friendSubscription(friend, status) {
  const id = `sub_it_ref_${RUN}_${friend.user.id.slice(0, 8)}`;
  const sub = {
    id,
    object: 'subscription',
    customer: `cus_it_ref_${friend.user.id}`,
    status,
    cancel_at_period_end: false,
    cancel_at: null,
    metadata: { userId: friend.user.id },
    items: { data: [{ id: `si_${id}`, price: { id: 'price_it_regular_month' }, quantity: 1, current_period_end: 1893456000 }] },
  };
  fake.subscriptions.set(id, sub);
  const eventId = `evt_it_ref_${RUN}_${++n}`;
  eventIds.push(eventId);
  const payload = JSON.stringify({ id: eventId, object: 'event', type: 'customer.subscription.updated', data: { object: sub } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  const res = await request(app).post('/api/billing/webhook').set('Stripe-Signature', signature).set('Content-Type', 'application/json').send(payload);
  expect(res.status).toBe(200);
}

const referralOf = async (member) => data(await member.agent.get('/api/users/referral')).referral;

describe('give a month, get a month', () => {
  let member;
  let code;

  beforeAll(async () => {
    member = await signUp('Robin Referrer');
  });

  it('makes a member’s own code when they ask, once', async () => {
    expect(await referralOf(member)).toMatchObject({ code: null, friendsJoined: 0, friendsPaid: 0, monthsEarned: 0, monthsLeftThisYear: 12, perYear: 12, friendDays: 30 });
    const made = await member.agent.post('/api/users/referral');
    expect(made.status).toBe(201);
    code = data(made).referral.code;
    expect(code).toMatch(/^ROBIN[2-9A-Z]{4}$/);
    const again = await member.agent.post('/api/users/referral');
    expect(again.status).toBe(200);
    expect(data(again).referral.code).toBe(code);
    // Not for an unverified address
    const unverified = await signUp('Unverified Referrer', { verified: false });
    expect((await unverified.agent.post('/api/users/referral')).status).toBe(403);
  });

  it('tells the friend who it’s from, and gives them the first month free; admins never list it', async () => {
    expect(data(await anon().get(`/api/promo-codes/${code}`)).promoCode).toEqual({ code, freePlan: null, trialDays: 30, fromFriend: 'Robin' });
    const admin = await signUp('Referral Admin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
    const listed = data(await admin.agent.get('/api/users/admin/promo-codes')).promoCodes.map((p) => p.code);
    expect(listed).not.toContain(code);
    const own = await prisma.promoCode.findUnique({ where: { code } });
    expect((await admin.agent.patch(`/api/users/admin/promo-codes/${own.id}`).send({ active: false })).status).toBe(404);
  });

  it('gives the member a month of Business when a friend pays, once per friend', async () => {
    const friend = await friendWith(code, 'Fern Friend');
    expect(await prisma.profile.findUnique({ where: { userId: friend.user.id } })).toMatchObject({ promoCodeId: expect.any(String) });
    expect(await referralOf(member)).toMatchObject({ friendsJoined: 1, friendsPaid: 0 });

    // The friend's free month: nothing yet
    await friendSubscription(friend, 'trialing');
    expect(await prisma.referralReward.count({ where: { referrerId: member.user.id } })).toBe(0);

    // Their first payment: a month of Business for the member, a complimentary membership
    await friendSubscription(friend, 'active');
    const billing = data(await member.agent.get('/api/billing'));
    expect(billing).toMatchObject({ plan: 'REGULAR', source: 'COMPLIMENTARY' });
    const [grant] = await prisma.planGrant.findMany({ where: { userId: member.user.id } });
    expect(grant).toMatchObject({ plan: 'REGULAR', reason: 'A friend joined' });
    expect((grant.endsAt - grant.startsAt) / 86400000).toBeGreaterThanOrEqual(28);
    expect(await referralOf(member)).toMatchObject({ friendsJoined: 1, friendsPaid: 1, monthsEarned: 1, monthsLeftThisYear: 11 });

    // The same again (another event, a renewal): nothing more
    await friendSubscription(friend, 'active');
    expect(await prisma.referralReward.count({ where: { referrerId: member.user.id } })).toBe(1);

    // A second friend: the month runs on after the first
    const second = await friendWith(code, 'Sage Friend');
    await friendSubscription(second, 'active');
    const grants = await prisma.planGrant.findMany({ where: { userId: member.user.id }, orderBy: { startsAt: 'asc' } });
    expect(grants).toHaveLength(2);
    expect(grants[1].startsAt.getTime()).toBe(grants[0].endsAt.getTime());
  });

  it('takes a month of their plan off a paying member’s next invoice', async () => {
    const payer = await signUp('Paula Payer');
    await givePlan(payer.user.id, { plan: 'PREMIUM' });
    const payersCode = data(await payer.agent.post('/api/users/referral')).referral.code;
    const friend = await friendWith(payersCode, 'Finn Friend');
    fake.calls.length = 0;
    await friendSubscription(friend, 'active');
    const credits = fake.calls.filter((c) => c.name === 'customers.createBalanceTransaction');
    expect(credits).toHaveLength(1);
    const [customer, params, options] = credits[0].args;
    expect(customer).toBe(`cus_it_${payer.user.id}`);
    expect(params).toMatchObject({ amount: -999, currency: 'gbp' });
    expect(options.idempotencyKey).toMatch(/^referral-reward-/);
    expect(await prisma.referralReward.findFirst({ where: { referrerId: payer.user.id } })).toMatchObject({ kind: 'CREDIT', amountPence: 999, appliedAt: expect.any(Date) });
  });

  it('gives no more than twelve months a year', async () => {
    const busy = await signUp('Busy Referrer');
    const busyCode = data(await busy.agent.post('/api/users/referral')).referral.code;
    await prisma.referralReward.createMany({
      data: Array.from({ length: 12 }, () => ({ referrerId: busy.user.id, kind: 'GRANT', appliedAt: new Date() })),
    });
    const friend = await friendWith(busyCode, 'Late Friend');
    await friendSubscription(friend, 'active');
    expect(await prisma.referralReward.findUnique({ where: { friendId: friend.user.id } })).toMatchObject({ kind: 'CAPPED' });
    expect(await prisma.planGrant.count({ where: { userId: busy.user.id } })).toBe(0);
    expect(await referralOf(busy)).toMatchObject({ monthsEarned: 12, monthsLeftThisYear: 0, friendsPaid: 13 });
  });

  it('goes in "Your data"', async () => {
    const exported = data(await member.agent.get('/api/users/export')).account;
    expect(exported.inviteCode).toBe(code);
    expect(exported.friendRewards).toHaveLength(2);
  });
});
