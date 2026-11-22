import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { createOffer, deleteOffer, getAdminOffers, importOffers, updateOffer } from '@/api/offerAdminApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('offerAdminApi', () => {
  it('lists the offers with their clicks', async () => {
    client.answerWith({ offers: [], clicksSince: '2026-10-23' });
    await expect(getAdminOffers()).resolves.toEqual({ offers: [], clicksSince: '2026-10-23' });
    expect(client.get).toHaveBeenCalledWith('/api/users/admin/offers');
  });

  it('makes, changes and deletes an offer', async () => {
    await createOffer({ key: 'k' });
    await updateOffer('o 1', { title: 'T' });
    await deleteOffer('o 1');
    expect(client.post).toHaveBeenCalledWith('/api/users/admin/offers', { key: 'k' });
    expect(client.patch).toHaveBeenCalledWith('/api/users/admin/offers/o%201', { title: 'T' });
    expect(client.delete).toHaveBeenCalledWith('/api/users/admin/offers/o%201');
  });

  it('imports a file’s offers', async () => {
    client.answerWith({ created: 1, updated: 2, keys: ['a', 'b', 'c'] });
    const payload = { offers: [{ key: 'a' }] };
    await expect(importOffers(payload)).resolves.toEqual({ created: 1, updated: 2, keys: ['a', 'b', 'c'] });
    expect(client.post).toHaveBeenCalledWith('/api/users/admin/offers/import', payload);
  });

  it('puts a refused import’s list of problems on the error', async () => {
    const problems = [{ index: 2, key: 'k3', field: 'url' }];
    const err = Object.assign(new Error('x'), { friendlyMessage: 'Nothing was imported.', response: { status: 400, data: { data: { problems } } } });
    client.post.mockRejectedValueOnce(err);
    const thrown = await importOffers({ offers: [] }).catch((e) => e);
    expect(thrown).toBe(err);
    expect(thrown.problems).toEqual(problems);
    expect(thrown.friendlyMessage).toBe('Nothing was imported.');
  });

  it('leaves any other failure as it was', async () => {
    const err = Object.assign(new Error('x'), { response: { status: 500, data: { message: 'Oops' } } });
    client.post.mockRejectedValueOnce(err);
    const thrown = await importOffers({ offers: [] }).catch((e) => e);
    expect(thrown).toBe(err);
    expect('problems' in thrown).toBe(false);
  });
});
