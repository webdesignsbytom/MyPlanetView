// The mock's strings routes (src/dev/mock/handlers/mapStrings.js), as the server's
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, TOM_MAP, db, del, freshStore, get, post, registerAllRoutes, setVerified, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const path = (mapId = HOME_MAP, suffix = '') => `/api/maps/${mapId}/strings${suffix}`;
const stringsOn = async (mapId = HOME_MAP) => (await get(`/api/maps/${mapId}`)).data.map.strings;

// 24 Nov 2026, the user's wish: the demo map's places are tied in the order first visited
describe('the seed’s strings', () => {
  it('tie each place on the test user’s map to the one first visited before it', async () => {
    const strings = await stringsOn();
    expect(strings).toHaveLength(19);
    expect(strings[0]).toEqual({ id: expect.any(String), kind: 'VISITED', from: 'GB', to: 'IE' });
    expect(strings.at(-1)).toMatchObject({ from: 'AT', to: 'IT' });
  });
});

describe('strings between places, in mock mode', () => {
  // The rest start from a map with none tied
  beforeEach(() => {
    db().mapStrings = db().mapStrings.filter((string) => string.mapId !== HOME_MAP);
  });

  it('start with none, and the map reply carries them', async () => {
    expect(await stringsOn()).toEqual([]);
    const res = await post(path(), { from: 'jp', to: 'FR' });
    expect(res.status).toBe(201);
    expect(res.data.string).toEqual({ id: expect.any(String), kind: 'VISITED', from: 'FR', to: 'JP' });
    expect(await stringsOn()).toEqual([res.data.string]);
  });

  it('give back the string already tied instead of a second', async () => {
    const first = (await post(path(), { from: 'FR', to: 'JP' })).data.string;
    const again = await post(path(), { from: 'JP', to: 'FR' });
    expect(again.status).toBe(200);
    expect(again.data.string).toEqual(first);
    expect(db().mapStrings).toHaveLength(1);
  });

  it('refuse a place and itself, and anything that isn’t two places, in the server’s words', async () => {
    expect(await post(path(), { from: 'FR', to: 'FR' })).toMatchObject({ status: 400, message: 'A string needs two different places.' });
    expect(await post(path(), { from: 'FR', to: 'ZZ' })).toMatchObject({ status: 400, message: 'Choose two places on the map to tie a string between.' });
    expect((await post(path(), { from: 'FR' })).status).toBe(400);
  });

  it('place a UK nation as the map does', async () => {
    db().maps.find((m) => m.id === HOME_MAP).splitUk = false;
    expect((await post(path(), { from: 'XC', to: 'IE' })).data.string).toMatchObject({ from: 'GB', to: 'IE' });
    db().maps.find((m) => m.id === HOME_MAP).splitUk = true;
    expect((await post(path(), { from: 'XC', to: 'IE' })).data.string).toMatchObject({ from: 'IE', to: 'XC' });
  });

  it('are for editors with a verified email: 404 with no role, 403 for a viewer or unverified', async () => {
    expect((await post(path(TOM_MAP), { from: 'FR', to: 'JP' })).status).toBe(404);
    // The test user only views Sam's map
    expect((await post(path(SAM_MAP), { from: 'FR', to: 'JP' })).status).toBe(403);
    setVerified(false);
    expect((await post(path(), { from: 'FR', to: 'JP' })).status).toBe(403);
    expect((await post(path(HOME_MAP, '/auto'))).status).toBe(403);
    setVerified(true);
    signOut();
    // Signed out there's no role on the map: the mock's map routes answer 404 (the server's 401 is its sign-in check)
    expect((await post(path(), { from: 'FR', to: 'JP' })).status).toBe(404);
  });

  it('untie one, and a string that isn’t the map’s is a 404', async () => {
    const { string } = (await post(path(), { from: 'FR', to: 'JP' })).data;
    expect((await del(path(HOME_MAP, `/${string.id}`))).data).toEqual({ removed: string.id });
    expect(await stringsOn()).toEqual([]);
    expect(await del(path(HOME_MAP, `/${string.id}`))).toMatchObject({ status: 404, message: 'That string isn’t on this map.' });
  });

  it('add the automatic ones from the trips and first visits, once', async () => {
    const res = await post(path(HOME_MAP, '/auto'));
    expect(res.status).toBe(200);
    expect(res.data.added).toBeGreaterThan(0);
    expect(res.data.full).toBe(false);
    expect(res.data.strings).toHaveLength(res.data.added);
    expect(await stringsOn()).toEqual(res.data.strings);
    expect((await post(path(HOME_MAP, '/auto'))).data.added).toBe(0);
  });

  it('hold 500 a map', async () => {
    const codes = 'AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF'.split(' ');
    for (let i = 0; i < codes.length && db().mapStrings.length < 500; i += 1) {
      for (let j = i + 1; j < codes.length && db().mapStrings.length < 500; j += 1) {
        db().mapStrings.push({ id: `x${i}-${j}`, mapId: HOME_MAP, from: codes[i], to: codes[j], createdAt: new Date().toISOString() });
      }
    }
    expect(await post(path(), { from: 'FR', to: 'JP' })).toMatchObject({ status: 409 });
    expect((await post(path(HOME_MAP, '/auto'))).data).toMatchObject({ added: 0, full: true });
  });

  it('untie every string at once', async () => {
    await post(path(), { from: 'FR', to: 'JP' });
    await post(path(), { from: 'BR', to: 'PE' });
    expect((await del(path())).data).toEqual({ removed: 2 });
    expect(await stringsOn()).toEqual([]);
  });

  it('go into "Download my data" with the map', async () => {
    await post(path(), { from: 'FR', to: 'JP' });
    const exported = (await get(`/api/users/export/maps/${HOME_MAP}`)).data.map;
    expect(exported.strings).toEqual([{ kind: 'VISITED', from: 'FR', to: 'JP', since: expect.any(String) }]);
  });

  // Planned strings (25 Nov 2026, the user's wish): their own kind and set, as the server's
  it('tie planned strings apart from the visited ones, add the plans’ own, and take them off by kind', async () => {
    await post(path(), { from: 'FR', to: 'JP' });
    const res = await post(path(), { from: 'JP', to: 'FR', kind: 'planned' });
    expect(res.status).toBe(201);
    expect(res.data.string).toMatchObject({ kind: 'PLANNED', from: 'FR', to: 'JP' });
    expect((await post(path(), { from: 'FR', to: 'DE', kind: 'WANTED' })).status).toBe(400);

    // The seed's wishes: Japan, Peru and Iceland, and its planned trips
    const auto = await post(path(HOME_MAP, '/auto'), { kind: 'PLANNED' });
    expect(auto.data.added).toBeGreaterThan(0);
    const planned = auto.data.strings.filter((s) => s.kind === 'PLANNED');
    expect(planned.length).toBe(auto.data.added + 1);
    expect(auto.data.strings.filter((s) => s.kind === 'VISITED')).toHaveLength(1);

    expect((await del(`${path()}?kind=PLANNED`)).data).toEqual({ removed: planned.length });
    expect((await stringsOn()).map((s) => s.kind)).toEqual(['VISITED']);
  });
});
