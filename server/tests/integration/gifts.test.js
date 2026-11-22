// Gifts (docs/API.md "Gifts"): a year of a plan bought with a one-off Checkout (a fake Stripe
// client; the webhook's signatures are the real SDK's), made usable by the webhook, shown on
// its page to anyone with the code, redeemed once for a membership, stopped by a refund.
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ sessions: [], next: 1 }));

vi.mock('stripe', async (importOriginal) => {
  const actual = await importOriginal();
  class FakeStripe {
    constructor() {
      this.customers = { create: async (params) => ({ id: `cus_gift_${fake.next++}`, ...params }) };
      this.checkout = {
        sessions: {
          create: async (params) => {
            const session = { id: `cs_gift_${fake.next++}`, url: 'https://checkout.stripe.test/c/pay/cs_gift', params };
            fake.sessions.push(session);
            return session;
          },
        },
      };
    }
  }
  FakeStripe.webhooks = actual.default.webhooks;
  return { default: FakeStripe };
});

const WEBHOOK_SECRET = 'whsec_it_gifts';
Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_test_it_gifts', STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });

const { default: Stripe } = await import('stripe');
const { default: app } = await import('../../src/server.js');
const { anon, cleanUp, data, givePlan, prisma, sentEmails, signUp } = await import('./helpers.js');
const { deleteUnpaidGiftsInDB } = await import('../../src/domain/gifts.js');

const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const eventIds = [];
let counter = 0;
const giftIds = [];

afterAll(async () => {
  await prisma.giftCode.deleteMany({ where: { id: { in: giftIds } } });
  await prisma.stripeEvent.deleteMany({ where: { id: { in: eventIds } } });
  await cleanUp();
});

async function sendEvent(type, object) {
  const id = `evt_gift_${RUN}_${++counter}`;
  eventIds.push(id);
  const payload = JSON.stringify({ id, object: 'event', type, data: { object } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return request(app).post('/api/billing/webhook').set('Stripe-Signature', signature).set('Content-Type', 'application/json').send(payload);
}

/** Buy a gift and have Stripe say it's paid. -> the gift's row */
async function buyGift(buyer, { plan = 'PREMIUM', toName = 'Jo', message = 'Happy Christmas!' } = {}) {
  const res = await buyer.agent.post('/api/billing/gift-checkout').send({ plan, toName, message });
  expect(res.status).toBe(200);
  const session = fake.sessions.at(-1);
  const gift = await prisma.giftCode.findUnique({ where: { id: session.params.metadata.giftId } });
  giftIds.push(gift.id);
  const paid = await sendEvent('checkout.session.completed', {
    id: session.id,
    object: 'checkout.session',
    mode: 'payment',
    payment_status: 'paid',
    payment_intent: `pi_gift_${RUN}_${gift.id}`,
    client_reference_id: buyer.user.id,
    metadata: { userId: buyer.user.id, giftId: gift.id },
  });
  expect(paid.status).toBe(200);
  return prisma.giftCode.findUnique({ where: { id: gift.id } });
}

const show = (code) => `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;

describe('gifts', () => {
  let buyer;
  let jo;
  let unverified;

  beforeAll(async () => {
    [buyer, jo] = await Promise.all([signUp('GiftBuyer'), signUp('GiftJo')]);
    unverified = await signUp('GiftUnverified', { verified: false });
  });

  it('offers a year of Business or First Class at the yearly price', async () => {
    const res = await buyer.agent.get('/api/gifts');
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({
      offers: [
        { plan: 'REGULAR', name: 'Business', months: 12, pence: 4900 },
        { plan: 'PREMIUM', name: 'First Class', months: 12, pence: 9900 },
      ],
      gifts: [],
      paymentsEnabled: true,
    });
  });

  it('starts a one-off Checkout, and refuses a bad order', async () => {
    expect((await buyer.agent.post('/api/billing/gift-checkout').send({ plan: 'FREE' })).status).toBe(400);
    expect((await buyer.agent.post('/api/billing/gift-checkout').send({ plan: 'REGULAR', message: 'x'.repeat(301) })).status).toBe(400);
    expect((await unverified.agent.post('/api/billing/gift-checkout').send({ plan: 'REGULAR' })).status).toBe(403);

    const res = await buyer.agent.post('/api/billing/gift-checkout').send({ plan: 'REGULAR', toName: '<b>Sam</b>' });
    expect(data(res)).toEqual({ url: 'https://checkout.stripe.test/c/pay/cs_gift' });
    const { params } = fake.sessions.at(-1);
    expect(params).toMatchObject({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: { currency: 'gbp', unit_amount: 4900, product_data: { name: 'A year of Business, a gift' } } }],
      client_reference_id: buyer.user.id,
    });
    // Only ids go to Stripe
    expect(Object.keys(params.metadata).sort()).toEqual(['giftId', 'userId']);
    const gift = await prisma.giftCode.findUnique({ where: { id: params.metadata.giftId } });
    giftIds.push(gift.id);
    expect(gift).toMatchObject({ plan: 'REGULAR', months: 12, amountPence: 4900, toName: 'Sam', paidAt: null });
    // Unpaid: not listed, and its page doesn't exist
    expect(data(await buyer.agent.get('/api/gifts')).gifts).toEqual([]);
    expect((await anon().get(`/api/gifts/${gift.code}`)).status).toBe(404);
    // The daily clean-up removes it once it's old
    await prisma.giftCode.update({ where: { id: gift.id }, data: { createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) } });
    await deleteUnpaidGiftsInDB(new Date(Date.now() - 2 * 24 * 3600 * 1000));
    expect(await prisma.giftCode.findUnique({ where: { id: gift.id } })).toBeNull();
  });

  it('is usable once paid, emails the buyer its code, and shows on its page', async () => {
    const gift = await buyGift(buyer);
    expect(gift.paidAt).not.toBeNull();
    await vi.waitFor(() => expect(sentEmails().some((e) => e.template === 'giftEmail' && e.context.code === show(gift.code))).toBe(true));
    const email = sentEmails().find((e) => e.template === 'giftEmail' && e.context.code === show(gift.code));
    expect(email).toMatchObject({ to: buyer.email, subject: 'Your gift of First Class is ready', context: { toName: 'Jo', message: 'Happy Christmas!' } });
    expect(email.context.giftUrl).toMatch(new RegExp(`/gift/${show(gift.code)}$`));

    const mine = data(await buyer.agent.get('/api/gifts')).gifts;
    expect(mine[0]).toMatchObject({ code: show(gift.code), plan: 'PREMIUM', planName: 'First Class', status: 'READY', toName: 'Jo' });

    // Anyone with the code, signed in or not, in any case or spacing: never the buyer's address
    const page = await anon().get(`/api/gifts/${show(gift.code).toLowerCase()}`);
    expect(page.status).toBe(200);
    expect(data(page).gift).toEqual({
      code: show(gift.code),
      plan: 'PREMIUM',
      planName: 'First Class',
      months: 12,
      toName: 'Jo',
      message: 'Happy Christmas!',
      fromName: buyer.user.name,
      status: 'READY',
    });
    expect(JSON.stringify(data(page))).not.toContain(buyer.email);
  });

  it('is redeemed once, for a year of its plan', async () => {
    const gift = await buyGift(buyer);
    expect((await unverified.agent.post('/api/gifts/redeem').send({ code: gift.code })).status).toBe(403);
    expect((await jo.agent.post('/api/gifts/redeem').send({ code: 'ZZZZ-ZZZZ-ZZZZ' })).status).toBe(404);

    const res = await jo.agent.post('/api/gifts/redeem').send({ code: show(gift.code) });
    expect(res.status).toBe(200);
    const { grant } = data(res);
    expect(grant).toMatchObject({ plan: 'PREMIUM', planName: 'First Class' });
    const months = (new Date(grant.endsAt).getUTCFullYear() - new Date(grant.startsAt).getUTCFullYear()) * 12 + new Date(grant.endsAt).getUTCMonth() - new Date(grant.startsAt).getUTCMonth();
    expect(months).toBe(12);
    expect(data(await jo.agent.get('/api/billing'))).toMatchObject({ plan: 'PREMIUM', source: 'COMPLIMENTARY' });

    expect((await jo.agent.post('/api/gifts/redeem').send({ code: gift.code })).status).toBe(409);
    expect((await buyer.agent.post('/api/gifts/redeem').send({ code: gift.code })).status).toBe(409);
    expect(data(await anon().get(`/api/gifts/${gift.code}`)).gift.status).toBe('REDEEMED');
    expect(data(await buyer.agent.get('/api/gifts')).gifts.find((g) => g.id === gift.id).status).toBe('REDEEMED');
  });

  it('a second gift of the same plan starts when the first ends', async () => {
    const sam = await signUp('GiftSam');
    const [first, second] = [await buyGift(buyer, { plan: 'REGULAR' }), await buyGift(buyer, { plan: 'REGULAR' })];
    const a = data(await sam.agent.post('/api/gifts/redeem').send({ code: first.code })).grant;
    const b = data(await sam.agent.post('/api/gifts/redeem').send({ code: second.code })).grant;
    expect(b.startsAt).toBe(a.endsAt);
  });

  it('is refused by someone who already pays for that plan or better', async () => {
    const payer = await signUp('GiftPayer');
    await givePlan(payer.user.id, { plan: 'PREMIUM' });
    const business = await buyGift(buyer, { plan: 'REGULAR' });
    expect((await payer.agent.post('/api/gifts/redeem').send({ code: business.code })).status).toBe(409);
    // Still there for someone else
    expect(data(await anon().get(`/api/gifts/${business.code}`)).gift.status).toBe('READY');

    // On Business, a gift of First Class is fine
    const smaller = await signUp('GiftSmaller');
    await givePlan(smaller.user.id, { plan: 'REGULAR' });
    const first = await buyGift(buyer, { plan: 'PREMIUM' });
    expect((await smaller.agent.post('/api/gifts/redeem').send({ code: first.code })).status).toBe(200);
  });

  it('stops working when its payment is refunded before it’s redeemed', async () => {
    const gift = await buyGift(buyer);
    expect((await sendEvent('charge.refunded', { object: 'charge', refunded: true, payment_intent: gift.stripePaymentIntentId })).status).toBe(200);
    expect(data(await anon().get(`/api/gifts/${gift.code}`)).gift.status).toBe('REFUNDED');
    expect((await jo.agent.post('/api/gifts/redeem').send({ code: gift.code })).status).toBe(409);
  });
});
