import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import * as api from '@/api/dataExportApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

const CASES = [
  ['getExportAccount', () => api.getExportAccount(), ['/api/users/export']],
  ['getExportMap', () => api.getExportMap('m 1'), ['/api/users/export/maps/m%201']],
  ['getExportMapPhotos', () => api.getExportMapPhotos('m1'), ['/api/users/export/maps/m1/photos']],
  ['getExportMapPhotos', () => api.getExportMapPhotos('m1', 'a b'), ['/api/users/export/maps/m1/photos?cursor=a%20b']],
  ['getExportUploads', () => api.getExportUploads(), ['/api/users/export/uploads']],
  ['getExportUploads', () => api.getExportUploads('c1'), ['/api/users/export/uploads?cursor=c1']],
];

describe('dataExportApi', () => {
  it.each(CASES)('%s asks for the right path', async (_name, call, args) => {
    client.answerWith({ photos: [], nextCursor: null });
    await expect(call()).resolves.toEqual({ photos: [], nextCursor: null });
    expect(client.get).toHaveBeenCalledWith(...args);
  });

  it('covers every export', () => {
    expect(Object.keys(api).sort()).toEqual([...new Set(CASES.map(([name]) => name))].sort());
  });
});
