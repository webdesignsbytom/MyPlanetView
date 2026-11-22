import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { getGift, getMyGifts, redeemGift, startGiftCheckout } from '@/api/giftsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('giftsApi', () => {
  it('lists the gifts you bought and the offers', async () => {
    client.answerWith({ gifts: [], offers: [] });
    await expect(getMyGifts()).resolves.toEqual({ gifts: [], offers: [] });
    expect(client.get).toHaveBeenCalledWith('/api/gifts');
  });

  it('starts a gift’s Checkout on the billing routes', async () => {
    client.answerWith({ url: 'https://checkout.example.com' });
    const body = { plan: 'PREMIUM', toName: 'Jo', message: 'Enjoy' };
    await expect(startGiftCheckout(body)).resolves.toEqual({ url: 'https://checkout.example.com' });
    expect(client.post).toHaveBeenCalledWith('/api/billing/gift-checkout', body);
  });

  it('opens a gift by its code, encoded', async () => {
    await getGift('ABCD EFGH/IJKL');
    expect(client.get).toHaveBeenCalledWith('/api/gifts/ABCD%20EFGH%2FIJKL');
  });

  it('redeems a code', async () => {
    client.answerWith({ grant: { plan: 'REGULAR' } });
    await expect(redeemGift('ABCD-EFGH-IJKL')).resolves.toEqual({ grant: { plan: 'REGULAR' } });
    expect(client.post).toHaveBeenCalledWith('/api/gifts/redeem', { code: 'ABCD-EFGH-IJKL' });
  });
});
