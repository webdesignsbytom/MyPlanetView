import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PROMO_MESSAGES } from '@/dev/mock/promoCodes';
import { db, freshStore, get, patch, post, registerAllRoutes, signOut, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

describe('checking a code', () => {
  it('says what a usable code gives, to anyone', async () => {
    signOut();
    expect((await get('/api/promo-codes/samtravels')).data.promoCode).toEqual({ code: 'SAMTRAVELS', freePlan: null, trialDays: 30, fromFriend: null });
    expect((await get('/api/promo-codes/NOPE')).message).toBe(PROMO_MESSAGES.invalid);
  });

  it('names the friend behind a member’s own code, and gives no free month for a code for life', async () => {
    db().promoCodes.push({ id: 'p-friend', code: 'ALEXFRND', active: true, maxUses: null, endsAt: null, ownerId: 'mock-alex' });
    expect((await get('/api/promo-codes/ALEXFRND')).data.promoCode.fromFriend).toBe('Alex');
    db().promoCodes[0].freePlan = 'PREMIUM';
    expect((await get('/api/promo-codes/SAMTRAVELS')).data.promoCode).toMatchObject({ freePlan: 'PREMIUM', trialDays: 0 });
  });
});

describe('the admin’s codes', () => {
  const asAdmin = () => (testUser().role = 'ADMIN');

  it('are for admins only', async () => {
    expect((await get('/api/users/admin/promo-codes')).status).toBe(403);
    expect((await post('/api/users/admin/promo-codes', { code: 'NEW', label: 'x' })).status).toBe(403);
    signOut();
    expect((await get('/api/users/admin/promo-codes')).status).toBe(401);
  });

  it('lists the codes newest first with their counts, never a member’s own', async () => {
    asAdmin();
    db().promoCodes.push({ id: 'p-friend', code: 'ALEXFRND', ownerId: 'mock-alex', createdAt: new Date().toISOString() });
    const { data } = await get('/api/users/admin/promo-codes');
    expect(data.promoCodes.map((p) => p.code)).toEqual(['SAMTRAVELS', 'TRAVELTALK']);
    expect(data.promoCodes[1]).toMatchObject({ signUps: 2, verified: 2 });
  });

  it('makes a code, refusing one taken or malformed', async () => {
    asAdmin();
    const { status, data } = await post('/api/users/admin/promo-codes', { code: 'spring27', label: 'Spring', maxUses: 10 });
    expect(status).toBe(201);
    expect(data.promoCode).toMatchObject({ code: 'SPRING27', label: 'Spring', maxUses: 10, active: true, signUps: 0 });
    expect((await post('/api/users/admin/promo-codes', { code: 'SPRING27', label: 'Again' })).message).toBe(PROMO_MESSAGES.taken);
    expect((await post('/api/users/admin/promo-codes', { code: 'x', label: 'Short' })).message).toBe(PROMO_MESSAGES.format);
  });

  it('changes a code but never the code itself, nor a member’s own', async () => {
    asAdmin();
    const { data } = await patch('/api/users/admin/promo-codes/promo-samtravels', { active: false, label: 'Paused' });
    expect(data.promoCode).toMatchObject({ code: 'SAMTRAVELS', active: false, label: 'Paused' });
    expect('signUps' in data.promoCode).toBe(false);
    expect((await patch('/api/users/admin/promo-codes/promo-samtravels', { code: 'OTHER' })).status).toBe(400);
    db().promoCodes.push({ id: 'p-friend', code: 'ALEXFRND', ownerId: 'mock-alex' });
    expect((await patch('/api/users/admin/promo-codes/p-friend', { active: false })).status).toBe(404);
  });
});
