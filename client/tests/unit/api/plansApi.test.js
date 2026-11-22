import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import * as api from '@/api/plansApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

const CASES = [
  ['getBilling', () => api.getBilling(), 'get', ['/api/billing']],
  ['startCheckout', () => api.startCheckout({ plan: 'REGULAR', interval: 'month' }), 'post', ['/api/billing/checkout', { plan: 'REGULAR', interval: 'month', extraMaps: 0 }]],
  ['startCheckout', () => api.startCheckout({ plan: 'FREE', interval: 'year', extraMaps: 2 }), 'post', ['/api/billing/checkout', { plan: 'FREE', interval: 'year', extraMaps: 2 }]],
  ['changePlan', () => api.changePlan({ plan: 'PREMIUM', interval: 'year', extra: 'dropped' }), 'post', ['/api/billing/change-plan', { plan: 'PREMIUM', interval: 'year' }]],
  ['setExtraMaps', () => api.setExtraMaps({ quantity: 3 }), 'post', ['/api/billing/extra-maps', { quantity: 3 }]],
  ['setExtraMaps', () => api.setExtraMaps({ quantity: 1, interval: 'month' }), 'post', ['/api/billing/extra-maps', { quantity: 1, interval: 'month' }]],
  ['openBillingPortal', () => api.openBillingPortal(), 'post', ['/api/billing/portal', {}]],
  ['getLeavingOptions', () => api.getLeavingOptions(), 'get', ['/api/users/leaving-options']],
  ['putLeavingPlan', () => api.putLeavingPlan({ maps: [], leavePhotos: true }), 'put', ['/api/users/leaving-plan', { maps: [], leavePhotos: true }]],
  ['getPlanGrants', () => api.getPlanGrants('u 1'), 'get', ['/api/users/admin/plan-grants/u%201']],
  ['createPlanGrant', () => api.createPlanGrant('u1', { plan: 'REGULAR', months: 24, reason: 'Creator' }), 'post', ['/api/users/admin/plan-grants/u1', { plan: 'REGULAR', months: 24, reason: 'Creator' }]],
  // An empty reason isn't sent
  ['createPlanGrant', () => api.createPlanGrant('u1', { plan: 'REGULAR', months: 1, reason: '' }), 'post', ['/api/users/admin/plan-grants/u1', { plan: 'REGULAR', months: 1, reason: undefined }]],
  ['endPlanGrant', () => api.endPlanGrant('g1'), 'patch', ['/api/users/admin/end-plan-grant/g1', {}]],
  [
    'adminTransferMap',
    () => api.adminTransferMap({ mapId: 'm1', toEmail: 'jo@example.com', keepOldOwnerAsEditor: true }),
    'post',
    ['/api/users/admin/transfer-map', { mapId: 'm1', toEmail: 'jo@example.com', keepOldOwnerAsEditor: true }],
  ],
];

describe('plansApi', () => {
  it.each(CASES)('%s calls the right method and path', async (_name, call, method, args) => {
    client.answerWith({ url: '/x' });
    await expect(call()).resolves.toEqual({ url: '/x' });
    expect(client[method]).toHaveBeenCalledTimes(1);
    expect(client[method]).toHaveBeenCalledWith(...args);
  });

  it('covers every export', () => {
    expect(Object.keys(api).sort()).toEqual([...new Set(CASES.map(([name]) => name))].sort());
  });
});
