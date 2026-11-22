import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

// This month's theme is kept for the session (a module variable): a fresh module each test
let api;
beforeEach(async () => {
  client.reset();
  vi.resetModules();
  api = await import('@/api/themesApi');
});

describe('getThemes', () => {
  it('asks once a session, without the session cookie', async () => {
    client.answerWith({ current: { id: 't1' }, recent: [] });
    await expect(api.getThemes()).resolves.toEqual({ current: { id: 't1' }, recent: [] });
    await api.getThemes();
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith('/api/themes', false);
  });

  it('forgets a failed request', async () => {
    client.get.mockRejectedValueOnce(new Error('offline'));
    await expect(api.getThemes()).rejects.toThrow('offline');
    await api.getThemes();
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it('asks again after forgetThemes (an admin’s change)', async () => {
    await api.getThemes();
    api.forgetThemes();
    await api.getThemes();
    expect(client.get).toHaveBeenCalledTimes(2);
  });
});

describe('a map’s themes and albums', () => {
  it('reads them on the map, or through its share link', async () => {
    await api.getMapThemes({ mapId: 'm 1' });
    await api.getMapThemes({ shareCode: 'ABC' });
    expect(client.get.mock.calls).toEqual([['/api/maps/m%201/themes'], ['/api/shared/ABC/themes']]);
  });

  it('pages an album with its cursor and limit in the path', async () => {
    await api.getThemeAlbumPage({ mapId: 'm1' }, 'th1');
    await api.getThemeAlbumPage({ shareCode: 'ABC' }, 'th1', { cursor: 'c 1', limit: 30 });
    expect(client.get.mock.calls).toEqual([['/api/maps/m1/themes/th1/photos'], ['/api/shared/ABC/themes/th1/photos?cursor=c+1&limit=30']]);
  });

  it('enters a photo in a theme and takes it out', async () => {
    client.answerWith({ themes: [{ id: 'th1' }] });
    await expect(api.enterPhotoInTheme('p1', 'th1')).resolves.toEqual({ themes: [{ id: 'th1' }] });
    await api.takePhotoOutOfTheme('p1', 'th1');
    expect(client.put).toHaveBeenCalledWith('/api/photos/p1/themes/th1');
    expect(client.delete).toHaveBeenCalledWith('/api/photos/p1/themes/th1');
  });
});

describe('the admin’s themes', () => {
  it('lists, makes, changes and deletes them', async () => {
    await api.getAdminThemes();
    await api.createTheme({ month: '2026-12', title: 'Snow' });
    await api.updateTheme('th 1', { title: 'Ice' });
    await api.deleteTheme('th 1');
    expect(client.get).toHaveBeenCalledWith('/api/users/admin/themes');
    expect(client.post).toHaveBeenCalledWith('/api/users/admin/themes', { month: '2026-12', title: 'Snow' });
    expect(client.patch).toHaveBeenCalledWith('/api/users/admin/themes/th%201', { title: 'Ice' });
    expect(client.delete).toHaveBeenCalledWith('/api/users/admin/themes/th%201');
  });
});
