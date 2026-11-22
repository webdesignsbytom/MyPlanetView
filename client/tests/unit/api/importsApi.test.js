import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { getImports, importTrips } from '@/api/importsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('importsApi', () => {
  it('asks what a map has imported already', async () => {
    client.answerWith({ trips: [], photos: ['k1'], moments: [] });
    await expect(getImports('m 1')).resolves.toEqual({ trips: [], photos: ['k1'], moments: [] });
    expect(client.get).toHaveBeenCalledWith('/api/maps/m%201/imports/polarsteps');
  });

  it('sends the trips inside a `trips` field', async () => {
    const trips = [{ key: 'polarsteps:trip:1', title: 'Japan' }];
    client.answerWith({ trips: [{ key: 'polarsteps:trip:1', tripId: 't1', created: true }] });
    await expect(importTrips('m1', trips)).resolves.toEqual({ trips: [{ key: 'polarsteps:trip:1', tripId: 't1', created: true }] });
    expect(client.post).toHaveBeenCalledWith('/api/maps/m1/imports/polarsteps', { trips });
  });

  it('keeps axios’s response on a failure', async () => {
    const err = Object.assign(new Error('x'), { response: { status: 429, headers: { 'retry-after': '3' } } });
    client.post.mockRejectedValueOnce(err);
    await expect(importTrips('m1', [])).rejects.toBe(err);
  });
});
