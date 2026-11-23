import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { USER, db, freshStore, get, post, registerAllRoutes, setVerified, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

describe('give a month, get a month', () => {
  it('has no code until the member asks for one', async () => {
    expect((await get('/api/users/referral')).data.referral).toEqual({
      code: null,
      friendDays: 30,
      perYear: 12,
      friendsJoined: 0,
      friendsPaid: 0,
      monthsEarned: 0,
      monthsLeftThisYear: 12,
    });
  });

  it('makes the member’s own code from their first name, once', async () => {
    const made = await post('/api/users/referral');
    expect(made.status).toBe(201);
    expect(made.data.referral.code).toMatch(/^CHARLIE[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$/);
    const again = await post('/api/users/referral');
    expect(again.status).toBe(200);
    expect(again.data.referral.code).toBe(made.data.referral.code);
    expect(db().promoCodes.filter((p) => p.ownerId === USER)).toHaveLength(1);
  });

  it('uses FRIEND for a name with too few letters', async () => {
    testUser().name = 'J';
    expect((await post('/api/users/referral')).data.referral.code).toMatch(/^FRIEND.{4}$/);
  });

  it('counts the friends who joined and paid, and the months left this year', async () => {
    const { data } = await post('/api/users/referral');
    const code = db().promoCodes.find((p) => p.code === data.referral.code);
    db().users.push({ id: 'f1', promoCodeId: code.id, emailVerified: true }, { id: 'f2', promoCodeId: code.id, emailVerified: false });
    const now = new Date().toISOString();
    db().referralRewards = [
      { referrerId: USER, kind: 'GRANT', createdAt: now },
      { referrerId: USER, kind: 'CAPPED', createdAt: now },
      { referrerId: USER, kind: 'CREDIT', createdAt: new Date(Date.now() - 400 * 86400000).toISOString() },
    ];
    expect((await get('/api/users/referral')).data.referral).toMatchObject({ friendsJoined: 1, friendsPaid: 3, monthsEarned: 2, monthsLeftThisYear: 11 });
  });

  it('needs a verified email to make the code', async () => {
    setVerified(false);
    expect((await post('/api/users/referral')).status).toBe(403);
    expect((await get('/api/users/referral')).status).toBe(200);
  });
});
