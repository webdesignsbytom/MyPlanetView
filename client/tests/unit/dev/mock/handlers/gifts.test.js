import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { effectivePlan } from '@/dev/mock/plans';
import { USER, db, freshStore, get, post, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const buy = (body) => post('/api/billing/gift-checkout', body);
const noSubscription = () => {
  db().subscriptions = db().subscriptions.filter((s) => s.userId !== USER);
};
/** A gift someone else bought, ready to redeem. */
function boughtBySam(plan = 'PREMIUM', code = 'GFTCDDE7XQ2K') {
  db().gifts = [...(db().gifts || []), { id: `gift-${code}`, code, plan, months: 12, amountPence: 1, buyerId: 'mock-sam', toName: 'Charlie', message: 'Enjoy', paidAt: new Date().toISOString(), refundedAt: null, redeemedAt: null, createdAt: new Date().toISOString() }];
  return code;
}

describe('buying a gift', () => {
  it('lists the offers, and the gifts bought, newest first', async () => {
    const { data } = await get('/api/gifts');
    expect(data.offers.map((o) => [o.plan, o.months])).toEqual([
      ['REGULAR', 12],
      ['PREMIUM', 12],
    ]);
    expect(data.gifts).toEqual([]);
    expect(data.paymentsEnabled).toBe(true);
  });

  it('pays at once in mock mode, and the gift is ready', async () => {
    const { data } = await buy({ plan: 'PREMIUM', toName: ' <b>Sam</b> ', message: 'Happy birthday' });
    expect(data).toEqual({ url: '/gifts?bought=1' });
    const [gift] = (await get('/api/gifts')).data.gifts;
    expect(gift).toMatchObject({ plan: 'PREMIUM', planName: 'First Class', months: 12, toName: 'Sam', message: 'Happy birthday', status: 'READY' });
    expect(gift.code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
  });

  it('refuses a free plan or text that’s too long, and 401 signed out', async () => {
    expect((await buy({ plan: 'FREE' })).status).toBe(400);
    expect((await buy({ plan: 'REGULAR', toName: 'x'.repeat(61) })).status).toBe(400);
    expect((await buy({ plan: 'REGULAR', message: 5 })).status).toBe(400);
    signOut();
    expect((await buy({ plan: 'REGULAR' })).status).toBe(401);
    expect((await get('/api/gifts')).status).toBe(401);
  });
});

describe('a gift’s page', () => {
  it('shows a gift by its code to anyone, never the buyer’s address', async () => {
    const code = boughtBySam();
    signOut();
    const { data } = await get(`/api/gifts/${code.toLowerCase()}`);
    expect(data.gift).toEqual({ code: 'GFTC-DDE7-XQ2K', plan: 'PREMIUM', planName: 'First Class', months: 12, toName: 'Charlie', message: 'Enjoy', fromName: 'Sam Rivers', status: 'READY' });
    expect((await get('/api/gifts/NOPE')).status).toBe(404);
  });
});

describe('redeeming a gift', () => {
  it('gives a year of the plan, once', async () => {
    const code = boughtBySam();
    noSubscription();
    const { data } = await post('/api/gifts/redeem', { code });
    expect(data.grant).toMatchObject({ plan: 'PREMIUM', planName: 'First Class' });
    expect(effectivePlan(USER).plan).toBe('PREMIUM');
    expect((await get(`/api/gifts/${code}`)).data.gift.status).toBe('REDEEMED');
    expect((await post('/api/gifts/redeem', { code })).status).toBe(409);
  });

  it('starts a second year of the same plan when the first ends', async () => {
    noSubscription();
    const first = boughtBySam('REGULAR', 'AAAABBBBCCCC');
    const second = boughtBySam('REGULAR', 'DDDDEEEEFFFF');
    const a = (await post('/api/gifts/redeem', { code: first })).data.grant;
    const b = (await post('/api/gifts/redeem', { code: second })).data.grant;
    expect(b.startsAt).toBe(a.endsAt);
  });

  it('refuses a gift to someone who already pays for that plan or better', async () => {
    const code = boughtBySam('REGULAR');
    const covered = await post('/api/gifts/redeem', { code });
    expect(covered.status).toBe(409);
    expect(covered.message).toMatch(/^You already have that plan or a better one/);
    expect((await post('/api/gifts/redeem', { code: 'NOPE' })).status).toBe(404);
    signOut();
    expect((await post('/api/gifts/redeem', { code })).status).toBe(401);
  });
});
