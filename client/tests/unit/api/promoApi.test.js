import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { checkPromoCode, createPromoCode, getPromoCodes, updatePromoCode } from '@/api/promoApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('promoApi', () => {
  it('checks a code before signing up, without the session cookie', async () => {
    client.answerWith({ promoCode: { code: 'SAMTRAVELS', freePlan: null, trialDays: 30 } });
    await expect(checkPromoCode('SAM TRAVELS')).resolves.toEqual({ promoCode: { code: 'SAMTRAVELS', freePlan: null, trialDays: 30 } });
    expect(client.get).toHaveBeenCalledWith('/api/promo-codes/SAM%20TRAVELS', false);
  });

  it('lists, makes and changes the admin’s codes', async () => {
    await getPromoCodes();
    await createPromoCode({ code: 'NEW' });
    await updatePromoCode('p 1', { active: false });
    expect(client.get).toHaveBeenCalledWith('/api/users/admin/promo-codes');
    expect(client.post).toHaveBeenCalledWith('/api/users/admin/promo-codes', { code: 'NEW' });
    expect(client.patch).toHaveBeenCalledWith('/api/users/admin/promo-codes/p%201', { active: false });
  });
});
