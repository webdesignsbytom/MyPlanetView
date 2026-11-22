import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { createReferral, getReferral } from '@/api/referralsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('referralsApi', () => {
  it('reads the member’s invite code', async () => {
    client.answerWith({ referral: { code: 'JO1234' } });
    await expect(getReferral()).resolves.toEqual({ referral: { code: 'JO1234' } });
    expect(client.get).toHaveBeenCalledWith('/api/users/referral');
  });

  it('makes one', async () => {
    await createReferral();
    expect(client.post).toHaveBeenCalledWith('/api/users/referral');
  });
});
