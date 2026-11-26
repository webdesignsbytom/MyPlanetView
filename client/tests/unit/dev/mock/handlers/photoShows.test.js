// Mock mode's slideshows of chosen photos (dev/mock/handlers/photoShows.js): the server's rules over the store.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, db, del, freshStore, get, patch, post, registerAllRoutes, setVerified, signOut } from '../mockApi';
import { EVENT_MESSAGES } from '../../../../../../server/src/utils/responses/responses.js';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const CODE = 'SPN2-SHW8-TRP5';
const CODE_SHAPE = /^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/;
const curly = (text) => text.replace(/'/g, '’');

describe('a map’s shows', () => {
  it('lists the seeded one for its editors', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/photo-shows`);
    expect(data.shows).toEqual([
      expect.objectContaining({ code: CODE, title: 'Our favourite photos', seconds: 5, photoCount: 3, photoIds: ['photo-colosseum', 'photo-eiffel', 'photo-dam'] }),
    ]);
    expect([403, 404]).toContain((await get(`/api/maps/${SAM_MAP}/photo-shows`)).status);
  });

  it('makes one of the map’s photos, none hidden, for a verified editor', async () => {
    const make = (body) => post(`/api/maps/${HOME_MAP}/photo-shows`, body);
    expect((await make({ photoIds: [] })).status).toBe(400);
    expect((await make({ photoIds: ['photo-dam', 'photo-dam'] })).status).toBe(400);
    const hidden = await make({ photoIds: ['photo-hidden'] });
    expect(hidden.status).toBe(400);
    expect(hidden.body.message).toBe(curly(EVENT_MESSAGES.showPhotosInvalid));
    expect((await make({ photoIds: ['photo-dam'], seconds: 4 })).status).toBe(400);
    const made = await make({ title: '  ', photoIds: ['photo-dam', 'photo-eiffel'] });
    expect(made.status).toBe(201);
    expect(made.data.show).toMatchObject({ title: 'A slideshow', seconds: 5, photoCount: 2, photoIds: ['photo-dam', 'photo-eiffel'] });
    expect(made.data.show.code).toMatch(CODE_SHAPE);
    setVerified(false);
    expect((await make({ photoIds: ['photo-dam'] })).status).toBe(403);
  });

  it('is renamed, changed, given a new link and deleted by its editors', async () => {
    expect((await patch('/api/photo-shows/show-home', { title: '' })).status).toBe(400);
    expect((await patch('/api/photo-shows/show-home', {})).status).toBe(400);
    const changed = await patch('/api/photo-shows/show-home', { title: 'Best bits', seconds: 8, photoIds: ['photo-dam'] });
    expect(changed.data.show).toMatchObject({ title: 'Best bits', seconds: 8, photoIds: ['photo-dam'], code: CODE });
    const relinked = await post('/api/photo-shows/show-home/reset-link');
    expect(relinked.data.show.code).toMatch(CODE_SHAPE);
    expect(relinked.data.show.code).not.toBe(CODE);
    expect((await get(`/api/show/${CODE}`)).status).toBe(404);
    expect((await del('/api/photo-shows/show-home')).status).toBe(200);
    expect(db().photoShows).toHaveLength(0);
    expect((await del('/api/photo-shows/show-home')).status).toBe(404);
  });
});

describe('watching one by its link', () => {
  it('opens for anyone: its title, how many and a picture', async () => {
    signOut();
    const { data } = await get(`/api/show/${CODE.replace(/-/g, '').toLowerCase()}`);
    expect(data.show).toMatchObject({ code: CODE, title: 'Our favourite photos', seconds: 5, photoCount: 3 });
    expect(data.show.coverUrl).toBeTruthy();
    expect(JSON.stringify(data)).not.toContain('Charlie');
    expect((await get('/api/show/ZZZZ-ZZZZ-ZZZZ')).status).toBe(404);
  });

  it('plays its photos in its order with their display copies, or shuffled the same way for a seed', async () => {
    signOut();
    const { data } = await get(`/api/show/${CODE}/photos`);
    expect(data.photos.map((p) => p.id)).toEqual(['photo-colosseum', 'photo-eiffel', 'photo-dam']);
    expect(data.photos.every((p) => p.displayUrl && !('hidden' in p) && !('latitude' in p))).toBe(true);
    expect(data.nextCursor).toBeNull();
    const paged = await get(`/api/show/${CODE}/photos`, { limit: 2 });
    expect(paged.data.nextCursor).toBe('photo-eiffel');
    const once = (await get(`/api/show/${CODE}/photos`, { order: 'shuffle', seed: 7 })).data.photos.map((p) => p.id);
    expect((await get(`/api/show/${CODE}/photos`, { order: 'shuffle', seed: 7 })).data.photos.map((p) => p.id)).toEqual(once);
    expect((await get(`/api/show/${CODE}/photos`, { order: 'shuffle' })).status).toBe(400);
    expect((await get(`/api/show/${CODE}/photos`, { cursor: 'photo-hidden' })).status).toBe(400);
  });

  it('leaves out a photo hidden since', async () => {
    db().photos.find((p) => p.id === 'photo-eiffel').hidden = true;
    signOut();
    expect((await get(`/api/show/${CODE}/photos`)).data.photos.map((p) => p.id)).toEqual(['photo-colosseum', 'photo-dam']);
    expect((await get(`/api/show/${CODE}`)).data.show.photoCount).toBe(2);
  });
});
