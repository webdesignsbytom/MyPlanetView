import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, TOM_MAP, db, del, freshStore, get, put, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const stamps = (passport) => passport.pages.flatMap((p) => p.stamps);

describe('the passport', () => {
  it('gives the owner the test user’s 25 stamps in 20 countries', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/passport`);
    expect(data.passport.totals).toMatchObject({ countries: 20, landmarks: 25 });
    expect(stamps(data.passport)).toHaveLength(25);
  });

  it('gives Sam’s map its one stamp, through the map or its share link, signed in or not', async () => {
    expect(stamps((await get(`/api/maps/${SAM_MAP}/passport`)).data.passport).map((s) => s.landmarkId)).toEqual(['lm-historic-city-of-ayutthaya']);
    signOut();
    expect(stamps((await get('/api/shared/samg-4pye-ar22/passport')).data.passport)).toHaveLength(1);
    expect((await get('/api/shared/K7QXM2PA9RTW/passport')).status).toBe(404);
    expect((await get('/api/shared/nope/passport')).status).toBe(404);
  });

  it('answers 404 with no role or for a traveller not on the map', async () => {
    expect((await get(`/api/maps/${TOM_MAP}/passport`)).status).toBe(404);
    expect((await get(`/api/maps/${HOME_MAP}/passport`, { traveller: 'trav-alex' })).data.passport.map.traveller.name).toBe('Alex');
    expect((await get(`/api/maps/${HOME_MAP}/passport`, { traveller: 'trav-sam' })).status).toBe(404);
  });
});

describe('a stamp’s photo', () => {
  it('lets an editor pick one of the landmark’s confirmed photos on the map, and go back to the first', async () => {
    const url = `/api/maps/${HOME_MAP}/passport/stamps/lm-paris-banks-of-the-seine/photo`;
    expect((await put(url, { photoId: 'photo-louvre' })).data).toEqual({ cover: { landmarkId: 'lm-paris-banks-of-the-seine', photoId: 'photo-louvre' } });
    await put(url, { photoId: 'photo-eiffel' });
    expect(db().landmarkCovers).toEqual([{ mapId: HOME_MAP, landmarkId: 'lm-paris-banks-of-the-seine', photoId: 'photo-eiffel' }]);
    expect((await del(url)).status).toBe(200);
    expect(db().landmarkCovers).toEqual([]);
  });

  it('refuses a photo not confirmed as the landmark, a viewer and an unknown landmark', async () => {
    expect((await put(`/api/maps/${HOME_MAP}/passport/stamps/lm-alhambra/photo`, { photoId: 'photo-alhambra' })).status).toBe(400);
    expect((await put(`/api/maps/${HOME_MAP}/passport/stamps/lm-eiffel-tower/photo`, { photoId: 'photo-louvre' })).status).toBe(400);
    expect((await put(`/api/maps/${SAM_MAP}/passport/stamps/lm-historic-city-of-ayutthaya/photo`, { photoId: 'photo-bangkok' })).status).toBe(403);
    expect((await del(`/api/maps/${HOME_MAP}/passport/stamps/lm-nope/photo`)).status).toBe(404);
  });
});
