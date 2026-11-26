// Slideshows of chosen photos (api/photoShowsApi.js; docs/API.md "Photo slideshows")
import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import {
  createPhotoShow,
  deletePhotoShow,
  getMapPhotoShows,
  getPhotoShowPage,
  openPhotoShow,
  resetPhotoShowLink,
  updatePhotoShow,
} from '@/api/photoShowsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('photoShowsApi', () => {
  it('lists, makes, changes, re-links and deletes a map’s shows', async () => {
    client.answerWith({ shows: [] });
    await expect(getMapPhotoShows('m 1')).resolves.toEqual({ shows: [] });
    expect(client.get).toHaveBeenCalledWith('/api/maps/m%201/photo-shows');
    await createPhotoShow('m1', { title: 'T', photoIds: ['a'], seconds: 3 });
    expect(client.post).toHaveBeenCalledWith('/api/maps/m1/photo-shows', { title: 'T', photoIds: ['a'], seconds: 3 });
    await updatePhotoShow('s1', { title: 'U' });
    expect(client.patch).toHaveBeenCalledWith('/api/photo-shows/s1', { title: 'U' });
    await resetPhotoShowLink('s1');
    expect(client.post).toHaveBeenCalledWith('/api/photo-shows/s1/reset-link');
    await deletePhotoShow('s1');
    expect(client.delete).toHaveBeenCalledWith('/api/photo-shows/s1');
  });

  it('opens one by its code and pages its photos, in its order or shuffled', async () => {
    await openPhotoShow('SPN2-SHW8-TRP5');
    expect(client.get).toHaveBeenCalledWith('/api/show/SPN2-SHW8-TRP5');
    await getPhotoShowPage('SPN2-SHW8-TRP5');
    expect(client.get).toHaveBeenLastCalledWith('/api/show/SPN2-SHW8-TRP5/photos?order=show');
    await getPhotoShowPage('SPN2-SHW8-TRP5', { order: 'show', seed: 9, cursor: 'p1', limit: 30 });
    expect(client.get).toHaveBeenLastCalledWith('/api/show/SPN2-SHW8-TRP5/photos?order=show&cursor=p1&limit=30');
    await getPhotoShowPage('SPN2-SHW8-TRP5', { order: 'shuffle', seed: 9 });
    expect(client.get).toHaveBeenLastCalledWith('/api/show/SPN2-SHW8-TRP5/photos?order=shuffle&seed=9');
  });
});
