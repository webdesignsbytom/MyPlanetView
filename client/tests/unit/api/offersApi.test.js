import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: 'https://api.example.com' };
});

// The list is kept for the session (a module variable), so each test takes a fresh module
let offersApi;
beforeEach(async () => {
  client.reset();
  vi.resetModules();
  offersApi = await import('@/api/offersApi');
});

describe('getOffers', () => {
  it('asks once, without the session cookie, and shares the answer', async () => {
    client.answerWith({ offers: [{ id: 'o1' }] });
    const [a, b] = await Promise.all([offersApi.getOffers(), offersApi.getOffers()]);
    expect(a).toEqual([{ id: 'o1' }]);
    expect(b).toBe(a);
    await offersApi.getOffers();
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith('/api/offers', false);
  });

  it('answers an empty list when the reply has none', async () => {
    client.answerWith({});
    await expect(offersApi.getOffers()).resolves.toEqual([]);
  });

  it('forgets a failed request, so the next use asks again', async () => {
    client.get.mockRejectedValueOnce(new Error('offline'));
    await expect(offersApi.getOffers()).rejects.toThrow('offline');
    client.answerWith({ offers: [{ id: 'o2' }] });
    await expect(offersApi.getOffers()).resolves.toEqual([{ id: 'o2' }]);
    expect(client.get).toHaveBeenCalledTimes(2);
  });
});

describe('offerClickUrl', () => {
  it('builds the /go/ link on the API’s host with everything it was given', () => {
    const url = offersApi.offerClickUrl(
      { id: 'o 1' },
      { placement: 'GALLERY', destination: 'Mount Fuji', country: 'JP', from: '2026-03-01', to: '2026-03-10' },
    );
    expect(url).toBe('https://api.example.com/go/o%201?p=GALLERY&dest=Mount+Fuji&country=JP&from=2026-03-01&to=2026-03-10');
  });

  it('leaves out whatever is empty', () => {
    expect(offersApi.offerClickUrl({ id: 'o1' }, { placement: 'TRAVEL_DESK', destination: '', country: null })).toBe(
      'https://api.example.com/go/o1?p=TRAVEL_DESK',
    );
  });

  it('has no query string at all when there is nothing to send', () => {
    expect(offersApi.offerClickUrl({ id: 'o1' })).toBe('https://api.example.com/go/o1');
  });
});
