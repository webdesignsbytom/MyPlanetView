import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import * as api from '@/api/challengesApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

const CASES = [
  ['getMyChallenges', () => api.getMyChallenges(), 'get', ['/api/challenges']],
  ['createChallenge', () => api.createChallenge({ title: 'Most' }), 'post', ['/api/challenges', { title: 'Most' }]],
  ['getChallenge', () => api.getChallenge('c 1'), 'get', ['/api/challenges/c%201']],
  ['updateChallenge', () => api.updateChallenge('c1', { title: 'New' }), 'patch', ['/api/challenges/c1', { title: 'New' }]],
  ['deleteChallenge', () => api.deleteChallenge('c1'), 'delete', ['/api/challenges/c1']],
  ['resetChallengeLink', () => api.resetChallengeLink('c1'), 'post', ['/api/challenges/c1/reset-link']],
  ['setMyChallengeMap', () => api.setMyChallengeMap('c1', 'm1'), 'patch', ['/api/challenges/c1/me', { mapId: 'm1' }]],
  ['leaveChallenge', () => api.leaveChallenge('c1'), 'delete', ['/api/challenges/c1/me']],
  ['previewChallenge', () => api.previewChallenge('CHA2-YR5R'), 'get', ['/api/challenges/join/CHA2-YR5R']],
  ['joinChallenge', () => api.joinChallenge('CHA2-YR5R', 'm1'), 'post', ['/api/challenges/join/CHA2-YR5R', { mapId: 'm1' }]],
];

describe('challengesApi', () => {
  it.each(CASES)('%s calls the right method and path', async (_name, call, method, args) => {
    client.answerWith({ challenge: { id: 'c1' } });
    await expect(call()).resolves.toEqual({ challenge: { id: 'c1' } });
    expect(client[method]).toHaveBeenCalledTimes(1);
    expect(client[method]).toHaveBeenCalledWith(...args);
  });

  it('covers every export', () => {
    expect(Object.keys(api).sort()).toEqual(CASES.map(([name]) => name).sort());
  });

  it('answers an empty object when the reply has no payload', async () => {
    client.get.mockResolvedValueOnce({ data: null });
    await expect(api.getMyChallenges()).resolves.toEqual({});
  });
});
