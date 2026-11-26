import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import * as api from '@/api/vsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

const CASES = [
  ['getMyVsGroups', () => api.getMyVsGroups(), 'get', ['/api/vs']],
  ['createVsGroup', () => api.createVsGroup({ title: 'Gang', mapId: 'm1' }), 'post', ['/api/vs', { title: 'Gang', mapId: 'm1' }]],
  ['getVsGroup', () => api.getVsGroup('g 1'), 'get', ['/api/vs/g%201']],
  ['renameVsGroup', () => api.renameVsGroup('g1', 'New'), 'patch', ['/api/vs/g1', { title: 'New' }]],
  ['deleteVsGroup', () => api.deleteVsGroup('g1'), 'delete', ['/api/vs/g1']],
  ['resetVsLink', () => api.resetVsLink('g1'), 'post', ['/api/vs/g1/reset-link']],
  ['setMyVsMap', () => api.setMyVsMap('g1', 'm1'), 'patch', ['/api/vs/g1/me', { mapId: 'm1' }]],
  ['leaveVsGroup', () => api.leaveVsGroup('g1'), 'delete', ['/api/vs/g1/me']],
  ['previewVsGroup', () => api.previewVsGroup('VS22-FRND'), 'get', ['/api/vs/join/VS22-FRND']],
  ['joinVsGroup', () => api.joinVsGroup('VS22-FRND', 'm1'), 'post', ['/api/vs/join/VS22-FRND', { mapId: 'm1' }]],
];

describe('vsApi', () => {
  it.each(CASES)('%s calls the right method and path', async (_name, call, method, args) => {
    client.answerWith({ group: { id: 'g1' } });
    await expect(call()).resolves.toEqual({ group: { id: 'g1' } });
    expect(client[method]).toHaveBeenCalledTimes(1);
    expect(client[method]).toHaveBeenCalledWith(...args);
  });

  it('covers every export', () => {
    expect(Object.keys(api).sort()).toEqual(CASES.map(([name]) => name).sort());
  });

  it('answers an empty object when the reply has no payload', async () => {
    client.get.mockResolvedValueOnce({ data: null });
    await expect(api.getMyVsGroups()).resolves.toEqual({});
  });
});
