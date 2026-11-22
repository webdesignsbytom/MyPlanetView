import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import * as api from '@/api/travelCopiesApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

const choice = { toMapId: 'm2', travellerId: 't1', tripIds: [], momentIds: [], countryCodes: ['ES'], photoIds: [] };

const CASES = [
  ['getCopyChoices', () => api.getCopyChoices('m1'), 'get', ['/api/maps/m1/travel-copy-choices']],
  ['getCopyChoices', () => api.getCopyChoices('m1', 't 1'), 'get', ['/api/maps/m1/travel-copy-choices?traveller=t%201']],
  ['previewTravelCopy', () => api.previewTravelCopy('m1', choice), 'post', ['/api/maps/m1/travel-copies/preview', choice]],
  ['requestTravelCopy', () => api.requestTravelCopy('m1', choice), 'post', ['/api/maps/m1/travel-copies', choice]],
  ['getMapTravelCopies', () => api.getMapTravelCopies('m1'), 'get', ['/api/maps/m1/travel-copies']],
  ['getTravelCopy', () => api.getTravelCopy('r1'), 'get', ['/api/travel-copies/r1']],
  ['approveTravelCopy', () => api.approveTravelCopy('r1'), 'post', ['/api/travel-copies/r1/approve']],
  ['declineTravelCopy', () => api.declineTravelCopy('r1'), 'post', ['/api/travel-copies/r1/decline']],
  ['continueTravelCopy', () => api.continueTravelCopy('r1'), 'post', ['/api/travel-copies/r1/continue']],
];

describe('travelCopiesApi', () => {
  it.each(CASES)('%s calls the right method and path', async (_name, call, method, args) => {
    client.answerWith({ request: { id: 'r1' } });
    await expect(call()).resolves.toEqual({ request: { id: 'r1' } });
    expect(client[method]).toHaveBeenCalledTimes(1);
    expect(client[method]).toHaveBeenCalledWith(...args);
  });

  it('withdraws a request, answering the whole reply body', async () => {
    client.delete.mockResolvedValueOnce({ data: { status: 'success', message: 'Withdrawn.' } });
    await expect(api.withdrawTravelCopy('r 1')).resolves.toEqual({ status: 'success', message: 'Withdrawn.' });
    expect(client.delete).toHaveBeenCalledWith('/api/travel-copies/r%201');
  });

  it('covers every export', () => {
    const tested = new Set([...CASES.map(([name]) => name), 'withdrawTravelCopy']);
    expect(Object.keys(api).filter((name) => !tested.has(name))).toEqual([]);
  });
});
