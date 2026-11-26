import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { getAdminGifts, getAdminOverview, getAdminReferrals } from '@/api/adminApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

// The admin's overview, gifts and referral rewards (docs/API.md "Admin")
describe('adminApi', () => {
  it('reads the overview', async () => {
    client.answerWith({ overview: { maps: 3 } });
    await expect(getAdminOverview()).resolves.toEqual({ overview: { maps: 3 } });
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/overview');
  });

  it('looks a gift up by its code, or lists the latest', async () => {
    await getAdminGifts({ code: ' gft2-ad3m-n4qr ' });
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/gifts?code=gft2-ad3m-n4qr');
    await getAdminGifts({ code: 'a b&c' });
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/gifts?code=a%20b%26c');
    await getAdminGifts();
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/gifts');
    await getAdminGifts({ code: '   ' });
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/gifts');
  });

  it('reads the referral rewards', async () => {
    client.answerWith({ rewards: [] });
    await expect(getAdminReferrals()).resolves.toEqual({ rewards: [] });
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/referrals');
  });
});
