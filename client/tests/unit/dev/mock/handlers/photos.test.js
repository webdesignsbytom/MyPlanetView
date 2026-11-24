import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, MORGANS_MAP, USER, db, del, freshStore, get, patch, post, registerAllRoutes } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const photo = (id) => db().photos.find((p) => p.id === id);
const matches = (id) => db().photoLandmarks.filter((pl) => pl.photoId === id);
const asEditorOnMorgans = () => (db().mapMembers.find((m) => m.mapId === MORGANS_MAP && m.userId === USER).role = 'EDITOR');

describe('GET /api/photos/:photoId', () => {
  it('gives a viewer no GPS or original, and a hidden photo not at all', async () => {
    const shown = (await get('/api/photos/photo-morgans-sagrada')).data.photo;
    expect(shown.displayUrl).toBeTruthy();
    for (const field of ['latitude', 'longitude', 'originalUrl', 'hidden']) expect(field in shown).toBe(false);
    expect((await get('/api/photos/photo-morgans-hidden')).status).toBe(404);
    expect((await get('/api/photos/photo-hidden')).data.photo).toMatchObject({ hidden: true, latitude: 38.6916 });
    expect((await get('/api/photos/nope')).status).toBe(404);
  });
});

describe('PATCH /api/photos/:photoId', () => {
  it('changes the caption, date, hidden and country, marking the new country', async () => {
    const { data } = await patch('/api/photos/photo-dam', { caption: '  Bikes  ', takenAt: '2016-03-13T09:00:00Z', hidden: true, countryCode: 'be' });
    expect(data.photo).toMatchObject({ caption: 'Bikes', takenAt: '2016-03-13T09:00:00Z', hidden: true, countryCode: 'BE' });
    expect(photo('photo-dam').shotAt).toBe('2016-03-13T09:00:00Z');
    expect(db().visits.find((v) => v.mapId === HOME_MAP && v.countryCode === 'BE')).toMatchObject({ source: 'PHOTO' });
  });

  it('takes a photo’s country away, and refuses one that doesn’t exist or is full', async () => {
    expect((await patch('/api/photos/photo-dam', { countryCode: null })).data.photo.countryCode).toBeNull();
    expect((await patch('/api/photos/photo-dam', { countryCode: 'ZZ' })).status).toBe(400);
    db().photos.push(...Array.from({ length: 200 }, (_, i) => ({ id: `x${i}`, mapId: HOME_MAP, countryCode: 'DE' })));
    expect((await patch('/api/photos/photo-eiffel', { countryCode: 'DE' })).status).toBe(409);
  });

  it('moves a photo to another of the map’s trips, for the map’s editors only', async () => {
    expect((await patch('/api/photos/photo-dam', { tripId: 'trip-italy' })).data.photo.tripId).toBe('trip-italy');
    expect((await patch('/api/photos/photo-dam', { tripId: 'trip-sam-asia' })).status).toBe(400);
    expect((await patch('/api/photos/photo-lisbon', { tripId: null })).status).toBe(403);
    expect((await patch('/api/photos/photo-lisbon', { caption: 'Belém at noon' })).data.photo.caption).toBe('Belém at noon');
  });

  it('needs an editor', async () => {
    expect((await patch('/api/photos/photo-morgans-sagrada', { caption: 'x' })).status).toBe(403);
    expect((await patch('/api/photos/photo-morgans-hidden', { caption: 'x' })).status).toBe(404);
  });
});

describe('rearranging a gallery', () => {
  it('moves a photo after another in its country, and refuses a neighbour that’s gone', async () => {
    const france = () => (async () => (await get(`/api/maps/${HOME_MAP}/photos`, { country: 'FR' })).data.photos.map((p) => p.id))();
    const [first, second] = await france();
    expect((await post(`/api/photos/${first}/move`, { gallery: 'country', afterId: second })).data).toEqual({ message: 'Photo moved.' });
    expect((await france()).slice(0, 2)).toEqual([second, first]);
    expect((await post(`/api/photos/${first}/move`, { gallery: 'country', afterId: 'gone' })).status).toBe(409);
  });

  it('refuses an unknown gallery, a trip gallery for a photo on none, and a viewer', async () => {
    // Tower Bridge is on no trip (London is home)
    expect((await post('/api/photos/photo-tower-bridge/move', { gallery: 'wall' })).status).toBe(400);
    expect((await post('/api/photos/photo-tower-bridge/move', { gallery: 'trip' })).status).toBe(400);
    expect((await post('/api/photos/photo-tower-bridge/move', { gallery: 'country', afterId: 'photo-tower-bridge' })).status).toBe(400);
    expect((await post('/api/photos/photo-morgans-sagrada/move', { gallery: 'country', afterId: null })).status).toBe(403);
  });

  it('lets a trip-only editor rearrange the trip, not the country', async () => {
    expect((await post('/api/photos/photo-lisbon/move', { gallery: 'trip', afterId: null })).status).toBe(200);
    expect((await post('/api/photos/photo-lisbon/move', { gallery: 'country', afterId: null })).status).toBe(403);
  });
});

describe('deleting a photo', () => {
  it('takes its matches, cover, themes and moment links with it', async () => {
    db().landmarkCovers.push({ mapId: HOME_MAP, landmarkId: 'lm-eiffel-tower', photoId: 'photo-eiffel' });
    expect((await del('/api/photos/photo-eiffel')).status).toBe(200);
    expect(photo('photo-eiffel')).toBeUndefined();
    expect(matches('photo-eiffel')).toEqual([]);
    expect(db().landmarkCovers).toEqual([]);
    expect(db().themeEntries.some((e) => e.photoId === 'photo-eiffel')).toBe(false);
    expect(db().moments.find((m) => m.id === 'moment-engaged').photoIds).toEqual([]);
    expect((await del('/api/photos/photo-colosseum')).status).toBe(200);
    expect(db().trips.find((t) => t.id === 'trip-italy').coverPhotoId).toBeNull();
    expect((await del('/api/photos/photo-morgans-sagrada')).status).toBe(403);
  });
});

describe('landmark matches', () => {
  it('confirms a GPS suggestion, stamping the passport', async () => {
    const { data } = await patch('/api/photos/photo-alhambra/landmarks/lm-alhambra', { confirmed: true });
    expect(data.photo.landmarks.find((l) => l.id === 'lm-alhambra').confirmed).toBe(true);
    expect(matches('photo-alhambra')[0].confirmedAt).not.toBeNull();
    expect((await patch('/api/photos/photo-alhambra/landmarks/lm-alhambra', { confirmed: false })).status).toBe(400);
    expect((await patch('/api/photos/photo-alhambra/landmarks/lm-colosseum', { confirmed: true })).status).toBe(404);
  });

  it('matches a landmark by hand, never on a video', async () => {
    const { status } = await post('/api/photos/photo-dam/landmarks', { landmarkId: 'lm-eiffel-tower' });
    expect(status).toBe(201);
    expect(matches('photo-dam').find((pl) => pl.landmarkId === 'lm-eiffel-tower')).toMatchObject({ source: 'MANUAL', confirmed: true, mapId: HOME_MAP });
    expect((await post('/api/photos/photo-dam/landmarks', { landmarkId: 'lm-nope' })).status).toBe(400);
    photo('photo-dam').kind = 'VIDEO';
    expect((await post('/api/photos/photo-dam/landmarks', { landmarkId: 'lm-colosseum' })).message).toBe('Landmark stamps come from photos, not videos.');
  });

  it('removes a match, and the stamp photo picked from it', async () => {
    db().landmarkCovers.push({ mapId: HOME_MAP, landmarkId: 'lm-paris-banks-of-the-seine', photoId: 'photo-louvre' });
    expect((await del('/api/photos/photo-louvre/landmarks/lm-paris-banks-of-the-seine')).status).toBe(200);
    expect(db().landmarkCovers).toEqual([]);
    expect((await del('/api/photos/photo-louvre/landmarks/lm-paris-banks-of-the-seine')).status).toBe(404);
  });

  it('needs an editor of the photo', async () => {
    expect((await post('/api/photos/photo-morgans-sagrada/landmarks', { landmarkId: 'lm-alhambra' })).status).toBe(403);
    asEditorOnMorgans();
    expect((await post('/api/photos/photo-morgans-sagrada/landmarks', { landmarkId: 'lm-works-of-gaudi-sagrada-familia' })).status).toBe(201);
  });
});
