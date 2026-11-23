import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { addFlights, deleteFlight, getMapFlights } from '@/api/flightsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('flightsApi', () => {
  it('reads, adds and deletes a map’s flights', async () => {
    client.answerWith({ flights: [], totals: {} });
    await expect(getMapFlights('m 1')).resolves.toEqual({ flights: [], totals: {} });
    expect(client.get).toHaveBeenCalledWith('/api/maps/m%201/flights');
    await addFlights('m1', { flights: [{ from: 'LHR', to: 'JFK', flownOn: '2026-06-01' }] });
    expect(client.post).toHaveBeenCalledWith('/api/maps/m1/flights', { flights: [{ from: 'LHR', to: 'JFK', flownOn: '2026-06-01' }] });
    await deleteFlight('f1');
    expect(client.delete).toHaveBeenCalledWith('/api/flights/f1');
  });
});
