import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { receiveMockUpload } from '@/dev/mock/uploads';
import { session } from '@/dev/mock/store';
import { setMockPlan } from '@/dev/mock/plans';
import {
  ALEX,
  HOME_MAP,
  JO_MAP,
  MORGANS_MAP,
  SAM,
  SAM_MAP,
  TOM_MAP,
  USER,
  db,
  del,
  freshStore,
  get,
  patch,
  post,
  put,
  registerAllRoutes,
  setVerified,
  signOut,
  stubObjectUrls,
} from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => {
  freshStore();
  stubObjectUrls();
});

const map = (id) => db().maps.find((m) => m.id === id);
const visit = (mapId, code) => db().visits.find((v) => v.mapId === mapId && v.countryCode === code);
const makeMember = (mapId, role, userId = USER) => {
  db().mapMembers = db().mapMembers.filter((m) => !(m.mapId === mapId && m.userId === userId));
  db().mapMembers.push({ mapId, userId, role, createdAt: new Date().toISOString() });
};
const files = (best = 'ORIGINAL') => [
  { size: 'THUMB', contentType: 'image/webp', bytes: 3 },
  { size: 'DISPLAY', contentType: 'image/webp', bytes: 4 },
  { size: best, contentType: 'image/jpeg', bytes: 5 },
];

/** Presign, send each file to the mock bucket, then save: the photo upload, end to end. */
async function uploadPhoto(mapId, { best = 'ORIGINAL', save = {}, presign = {} } = {}) {
  const signed = await post(`/api/maps/${mapId}/photos/presign`, { files: files(best), ...presign });
  if (signed.status !== 200) return signed;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const u of signed.data.uploads) await receiveMockUpload(u.url, new Blob(['x'.repeat(u.bytes)]), u.headers['Content-Type']);
  return post(`/api/maps/${mapId}/photos`, { photoId: signed.data.photoId, variants: signed.data.uploads.map((u) => ({ size: u.size })), ...save });
}

describe('GET /api/maps', () => {
  it('lists the maps the test user owns, then those shared with them', async () => {
    const { status, data } = await get('/api/maps');
    expect(status).toBe(200);
    expect(data.maps[0]).toMatchObject({ id: HOME_MAP, role: 'OWNER', locked: false, tier: 'PLAN' });
    expect(data.maps.map((m) => m.id)).toEqual(expect.arrayContaining([SAM_MAP, MORGANS_MAP, 'map-fran']));
    expect(data.maps.some((m) => m.id === TOM_MAP)).toBe(false);
  });

  it('remakes a missing default map, and answers 401 signed out', async () => {
    map(HOME_MAP).isDefault = false;
    const { data } = await get('/api/maps');
    expect(data.maps.filter((m) => m.role === 'OWNER' && m.isDefault)).toHaveLength(1);
    signOut();
    expect((await get('/api/maps')).status).toBe(401);
  });
});

describe('POST /api/maps', () => {
  it('makes a map with its travellers, marking where they were born, split by the UK’s nations', async () => {
    const { status, data } = await post('/api/maps', { name: ' Our trips ', groupType: 'COUPLE', travellers: [{ name: 'Me', birthCountryCode: 'DE' }, { name: 'You' }] });
    expect(status).toBe(201);
    expect(data.map).toMatchObject({ name: 'Our trips', groupType: 'COUPLE', role: 'OWNER', splitUk: true, isDefault: false });
    expect(data.map.travellers.map((t) => [t.name, t.userId])).toEqual([
      ['Me', USER],
      ['You', null],
    ]);
    expect(visit(data.map.id, 'DE')).toMatchObject({ status: 'VISITED', source: 'MANUAL' });
  });

  // handlers/maps.js:211 marks the body's own code, not the traveller's cleaned one: 'de' is
  // stored on the traveller as DE, but its visit is made as 'de', which is no place
  it('marks a lower-case birthplace as the country it is', async () => {
    const { data } = await post('/api/maps', { name: 'x', groupType: 'SOLO', travellers: [{ name: 'Me', birthCountryCode: 'de' }] });
    expect(data.map.travellers[0].birthCountryCode).toBe('DE');
    expect(visit(data.map.id, 'DE')).toBeDefined();
    expect(visit(data.map.id, 'de')).toBeUndefined();
  });

  it('refuses a map without a name or kind, too many travellers for its kind, a pole or no such place', async () => {
    expect((await post('/api/maps', { groupType: 'SOLO' })).status).toBe(400);
    expect((await post('/api/maps', { name: 'x', groupType: 'GANG' })).status).toBe(400);
    expect((await post('/api/maps', { name: 'x', groupType: 'SOLO', travellers: [{ name: 'a' }, { name: 'b' }] })).message).toBe('"Just me" is for one traveller: remove the others first.');
    expect((await post('/api/maps', { name: 'x', groupType: 'FAMILY', travellers: Array.from({ length: 21 }, () => ({ name: 'k' })) })).message).toBe('A map can have up to 20 travellers.');
    expect((await post('/api/maps', { name: 'x', groupType: 'SOLO', travellers: [{ name: 'a', birthCountryCode: 'XN' }] })).message).toBe('Choose a country or Antarctica, not a pole.');
    expect((await post('/api/maps', { name: 'x', groupType: 'SOLO', travellers: [{ name: 'a', favouriteCountryCode: 'ZZ' }] })).status).toBe(400);
  });

  it('answers 402 once every free and paid map is in use', async () => {
    for (const name of ['a', 'b', 'c']) expect((await post('/api/maps', { name, groupType: 'SOLO' })).status).toBe(201);
    const full = await post('/api/maps', { name: 'd', groupType: 'SOLO' });
    expect(full.status).toBe(402);
    expect(full.message).toMatch(/^You have your 3 free maps/);
  });

  it('makes at most 20 maps a day, then 429', async () => {
    db().mapCreations = Array.from({ length: 20 }, () => ({ userId: USER, at: Date.now() }));
    expect((await post('/api/maps', { name: 'x', groupType: 'SOLO' })).status).toBe(429);
    db().mapCreations = Array.from({ length: 20 }, () => ({ userId: USER, at: Date.now() - 86400001 }));
    expect((await post('/api/maps', { name: 'x', groupType: 'SOLO' })).status).toBe(201);
  });
});

describe('GET /api/maps/:mapId', () => {
  it('answers 404 with no role, and gives a viewer no plan fields', async () => {
    expect((await get(`/api/maps/${TOM_MAP}`)).status).toBe(404);
    const sams = await get(`/api/maps/${SAM_MAP}`);
    expect(sams.data.map).toMatchObject({ role: 'VIEWER', ads: { every: null } });
    expect('uploadRules' in sams.data.map).toBe(false);
    const home = await get(`/api/maps/${HOME_MAP}`);
    expect(home.data.map.uploadRules).toMatchObject({ keepsOriginals: true });
  });
});

describe('the owner’s own routes', () => {
  it('lets only the owner pick the main map, upgrade one or take it back', async () => {
    expect((await post(`/api/maps/${SAM_MAP}/main`)).status).toBe(403);
    expect((await post(`/api/maps/${TOM_MAP}/main`)).status).toBe(404);
    const made = await post('/api/maps', { name: 'Second', groupType: 'SOLO' });
    const id = made.data.map.id;
    expect((await post(`/api/maps/${id}/main`)).data.map.isDefault).toBe(true);
    expect(map(HOME_MAP).isDefault).toBe(false);
    expect((await post(`/api/maps/${HOME_MAP}/upgrade`)).data.map.upgraded).toBe(true);
    expect((await del(`/api/maps/${HOME_MAP}/upgrade`)).data.map.upgraded).toBe(false);
    expect((await post(`/api/maps/${SAM_MAP}/upgrade`)).status).toBe(403);
  });

  it('transfers a map only to someone on it with an active, verified account', async () => {
    const transfer = (body) => post(`/api/maps/${HOME_MAP}/transfer`, body);
    expect((await transfer({})).status).toBe(400);
    expect((await transfer({ userId: USER })).message).toBe('You already own this map.');
    expect((await transfer({ userId: 'mock-tom' })).message).toMatch(/^Only someone already on this map/);
    expect((await transfer({ userId: SAM, stayAsEditor: 'yes' })).status).toBe(400);
    db().users.find((u) => u.id === SAM).emailVerified = false;
    expect((await transfer({ userId: SAM })).message).toBe('The new owner needs an active account with a verified email address.');
    db().users.find((u) => u.id === SAM).emailVerified = true;
    const done = await transfer({ userId: ALEX });
    expect(done.status).toBe(200);
    expect(done.data.map.role).toBe('EDITOR');
    expect(map(HOME_MAP)).toMatchObject({ ownerId: ALEX, isDefault: false });
    expect(db().maps.find((m) => m.ownerId === USER && m.isDefault)).toMatchObject({ name: 'My map', groupType: 'SOLO' });
    expect((await post(`/api/maps/${SAM_MAP}/transfer`, { userId: SAM })).status).toBe(403);
  });

  it('can leave the map altogether on a transfer', async () => {
    const { data } = await post(`/api/maps/${HOME_MAP}/transfer`, { userId: ALEX, stayAsEditor: false });
    expect(data.map).toEqual({ id: HOME_MAP, name: "Charlie & Alex's travels", role: null });
    expect(db().travellers.find((t) => t.id === 'trav-test').userId).toBeNull();
  });
});

describe('PATCH /api/maps/:mapId', () => {
  it('changes the settings for the owner or a co-owner, never a viewer', async () => {
    expect((await patch(`/api/maps/${SAM_MAP}`, { name: 'Mine now' })).status).toBe(403);
    expect((await patch(`/api/maps/${TOM_MAP}`, { name: 'x' })).status).toBe(404);
    const { data } = await patch(`/api/maps/${HOME_MAP}`, { name: 'Renamed', homeCountryCode: 'xc', style: 'starry', groupType: 'FAMILY' });
    expect(data.map).toMatchObject({ name: 'Renamed', homeCountryCode: 'GB', style: 'starry', groupType: 'FAMILY' });
    makeMember(MORGANS_MAP, 'CO_OWNER');
    expect((await patch(`/api/maps/${MORGANS_MAP}`, { name: 'The Morgans and me' })).data.map.role).toBe('CO_OWNER');
  });

  it('checks everything before changing anything', async () => {
    const cases = [
      [{ name: ' ' }, 400],
      [{ groupType: 'GANG' }, 400],
      [{ groupType: 'SOLO' }, 409],
      [{ homeCountryCode: 'ZZ' }, 400],
      [{ homeCountryCode: 'XS' }, 400],
      [{ style: 'jupiter' }, 400],
      [{ splitUk: 'yes' }, 400],
    ];
    for (const [body, status] of cases) expect((await patch(`/api/maps/${HOME_MAP}`, { ...body })).status).toBe(status);
    expect((await patch(`/api/maps/${HOME_MAP}`, { name: 'Kept?', style: 'jupiter' })).status).toBe(400);
    expect(map(HOME_MAP).name).toBe("Charlie & Alex's travels");
  });

  it('splits the UK into its nations and back', async () => {
    expect((await patch(`/api/maps/${HOME_MAP}`, { splitUk: true })).data.map.splitUk).toBe(true);
    expect(visit(HOME_MAP, 'XE')).toBeDefined();
    expect((await patch(`/api/maps/${HOME_MAP}`, { splitUk: false })).data.map.splitUk).toBe(false);
  });
});

describe('DELETE /api/maps/:mapId', () => {
  it('keeps the default map, and deletes another with everything on it', async () => {
    expect((await del(`/api/maps/${HOME_MAP}`)).status).toBe(409);
    expect((await del(`/api/maps/${SAM_MAP}`)).status).toBe(403);
    const { data } = await post('/api/maps', { name: 'Spare', groupType: 'SOLO', travellers: [{ name: 'Me', birthCountryCode: 'FR' }] });
    const id = data.map.id;
    db().challengeEntries[1].mapId = id;
    db().vsMembers[0].mapId = id;
    expect((await del(`/api/maps/${id}`)).status).toBe(200);
    expect(db().maps.some((m) => m.id === id)).toBe(false);
    expect(db().visits.some((v) => v.mapId === id)).toBe(false);
    expect(db().travellers.some((t) => t.mapId === id)).toBe(false);
    expect(db().challengeEntries[1].mapId).toBeNull();
    expect(db().vsMembers[0].mapId).toBeNull();
  });
});

describe('stats and the year in travel', () => {
  it('answers anyone on the map, 404 for no role, 400 for a year that isn’t one', async () => {
    expect((await get(`/api/maps/${SAM_MAP}/stats`)).data.stats.countries).toBe(4);
    expect((await get(`/api/maps/${TOM_MAP}/stats`)).status).toBe(404);
    expect((await get(`/api/maps/${HOME_MAP}/recap/2025`)).data.recap.places).toEqual(['FR', 'IT']);
    expect((await get(`/api/maps/${HOME_MAP}/recap/1066`)).status).toBe(400);
    expect((await get(`/api/maps/${TOM_MAP}/recap/2025`)).status).toBe(404);
  });
});

describe('travellers', () => {
  it('holds a couple’s two, then 409', async () => {
    const full = await post(`/api/maps/${HOME_MAP}/travellers`, { name: 'Baby' });
    expect(full.status).toBe(409);
    expect(full.message).toBe('A couple\'s map has two travellers. Choose "A family" to add more.');
  });

  it('adds one to a family map, marking where they were born, up to 20', async () => {
    map(HOME_MAP).groupType = 'FAMILY';
    const { status, data } = await post(`/api/maps/${HOME_MAP}/travellers`, { name: 'Baby', birthCountryCode: 'XC' });
    expect(status).toBe(201);
    expect(data.traveller).toMatchObject({ name: 'Baby', birthCountryCode: 'GB', position: 2, userId: null });
    for (let i = 0; i < 17; i++) await post(`/api/maps/${HOME_MAP}/travellers`, { name: `K${i}` });
    expect((await post(`/api/maps/${HOME_MAP}/travellers`, { name: 'One too many' })).message).toBe('A map can have up to 20 travellers.');
  });

  it('refuses a traveller with no name or born at a pole, and needs an editor', async () => {
    map(HOME_MAP).groupType = 'FAMILY';
    expect((await post(`/api/maps/${HOME_MAP}/travellers`, {})).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/travellers`, { name: 'x', birthCountryCode: 'XS' })).status).toBe(400);
    expect((await post(`/api/maps/${SAM_MAP}/travellers`, { name: 'x' })).status).toBe(403);
    expect((await post(`/api/maps/${JO_MAP}/travellers`, { name: 'x' })).status).toBe(404);
  });

  // 23 Nov 2026: the optional date of birth, as the server keeps it
  it('keeps a date of birth from 1900 to today, for the map’s editors to see, with the share of a life away', async () => {
    const saved = await patch(`/api/maps/${HOME_MAP}/travellers/trav-test`, { birthDate: '2025-01-01' });
    expect(saved.data.traveller.birthDate).toBe('2025-01-01');
    for (const bad of ['1899-12-31', '2999-01-01', '2025-02-30', 'soon']) {
      const res = await patch(`/api/maps/${HOME_MAP}/travellers/trav-test`, { birthDate: bad });
      expect(res.status).toBe(400);
      expect(res.message).toBe('Give a date of birth from 1 January 1900 up to today, or leave it empty.');
    }
    const forOwner = (await get(`/api/maps/${HOME_MAP}`)).data.map;
    expect(forOwner.travellers.find((t) => t.id === 'trav-test').birthDate).toBe('2025-01-01');
    // Charlie's 15 days in Italy over a life since 1 January 2025
    expect(forOwner.stats.byTraveller.find((t) => t.travellerId === 'trav-test').lifeAwayShare).toBeGreaterThan(0);
    // Cleared with null
    expect((await patch(`/api/maps/${HOME_MAP}/travellers/trav-test`, { birthDate: null })).data.traveller.birthDate).toBeNull();
  });

  it('never shows a date of birth or a share of a life to a viewer', async () => {
    db().travellers.find((t) => t.id === 'trav-sam').birthDate = '1990-01-01';
    const forViewer = (await get(`/api/maps/${SAM_MAP}`)).data.map;
    expect(forViewer.travellers.every((t) => !('birthDate' in t))).toBe(true);
    expect(forViewer.stats.byTraveller.every((t) => !('lifeAwayShare' in t))).toBe(true);
  });

  it('changes a traveller, marking a new birthplace', async () => {
    const { data } = await patch(`/api/maps/${HOME_MAP}/travellers/trav-alex`, { name: 'Alexandra', birthCountryCode: 'NZ' });
    expect(data.traveller).toMatchObject({ name: 'Alexandra', birthCountryCode: 'NZ' });
    expect(visit(HOME_MAP, 'NZ')).toBeDefined();
    expect((await patch(`/api/maps/${HOME_MAP}/travellers/trav-sam`, { name: 'x' })).status).toBe(404);
    expect((await patch(`/api/maps/${HOME_MAP}/travellers/trav-alex`, { name: '' })).status).toBe(400);
  });

  it('removes a traveller, never the last one or a co-owner’s', async () => {
    makeMember(HOME_MAP, 'CO_OWNER', ALEX);
    expect((await del(`/api/maps/${HOME_MAP}/travellers/trav-alex`)).status).toBe(409);
    makeMember(HOME_MAP, 'EDITOR', ALEX);
    expect((await del(`/api/maps/${HOME_MAP}/travellers/trav-alex`)).status).toBe(200);
    expect(db().trips.find((t) => t.id === 'trip-italy').travellerIds).toEqual(['trav-test']);
    expect((await del(`/api/maps/${HOME_MAP}/travellers/trav-test`)).message).toBe('A map needs at least one traveller.');
    expect((await del(`/api/maps/${HOME_MAP}/travellers/nope`)).status).toBe(404);
  });
});

describe('POST /api/maps/:mapId/visits/quick-fill', () => {
  it('marks several countries visited for the owner, with no verified email needed', async () => {
    setVerified(false);
    const { status, data } = await post(`/api/maps/${HOME_MAP}/visits/quick-fill`, { countryCodes: ['DE', 'DE', 'FR', 'JP', 'XS'] });
    expect(status).toBe(200);
    // Germany, Japan (from "want to go"), the South Pole and Antarctica with it; France already
    expect(data.added).toBe(4);
    expect(visit(HOME_MAP, 'JP').status).toBe('VISITED');
    expect(visit(HOME_MAP, 'AQ')).toBeDefined();
  });

  it('takes a co-owner too, but not an editor or viewer', async () => {
    makeMember(MORGANS_MAP, 'CO_OWNER');
    expect((await post(`/api/maps/${MORGANS_MAP}/visits/quick-fill`, { countryCodes: ['PT'] })).data.added).toBe(1);
    makeMember(MORGANS_MAP, 'EDITOR');
    expect((await post(`/api/maps/${MORGANS_MAP}/visits/quick-fill`, { countryCodes: ['PT'] })).status).toBe(403);
    expect((await post(`/api/maps/${SAM_MAP}/visits/quick-fill`, { countryCodes: ['PT'] })).status).toBe(403);
    expect((await post(`/api/maps/${TOM_MAP}/visits/quick-fill`, { countryCodes: ['PT'] })).status).toBe(404);
  });

  it('takes 1 to 300 known places', async () => {
    const message = 'Choose between 1 and 300 countries, each one on the map.';
    for (const countryCodes of [[], ['ZZ'], 'FR', [5], Array.from({ length: 301 }, () => 'FR')]) {
      expect((await post(`/api/maps/${HOME_MAP}/visits/quick-fill`, { countryCodes })).message).toBe(message);
    }
  });
});

describe('PUT and DELETE /api/maps/:mapId/visits/:countryCode', () => {
  it('sets a status by hand, cleaning its note, and says what came with it', async () => {
    const { data } = await put(`/api/maps/${HOME_MAP}/visits/xs`, { status: 'VISITED', notes: ' <b>Cold</b> ', firstVisitedOn: '2020-01-01' });
    expect(data.visit).toEqual({ countryCode: 'XS', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2020-01-01', notes: 'Cold', markedAt: expect.any(String) });
    expect(data.implied.map((v) => v.countryCode)).toEqual(['AQ']);
  });

  it('keeps a visit’s source when only its note changes', async () => {
    const { data } = await put(`/api/maps/${HOME_MAP}/visits/FR`, { status: 'VISITED', notes: 'Paris' });
    expect(data.visit).toMatchObject({ source: 'PHOTO', notes: 'Paris' });
  });

  // 24 Nov 2026: when each was marked, for the order visited (the passport, the strings)
  it('says when a visit was marked: a new one now, and a wish turned visit now too', async () => {
    const before = Date.now();
    const de = (await put(`/api/maps/${HOME_MAP}/visits/DE`, { status: 'VISITED' })).data.visit;
    expect(Date.parse(de.markedAt)).toBeGreaterThanOrEqual(before);
    // Japan was a wish (the seed's, with no time): visited, it's marked now
    const jp = (await put(`/api/maps/${HOME_MAP}/visits/JP`, { status: 'VISITED' })).data.visit;
    expect(Date.parse(jp.markedAt)).toBeGreaterThanOrEqual(before);
    // A note alone changes nothing; the map's reply carries them
    const again = (await put(`/api/maps/${HOME_MAP}/visits/JP`, { status: 'VISITED', notes: 'Tokyo' })).data.visit;
    expect(again.markedAt).toBe(jp.markedAt);
    const visits = (await get(`/api/maps/${HOME_MAP}`)).data.map.visits;
    expect(visits.find((v) => v.countryCode === 'JP').markedAt).toBe(jp.markedAt);
    expect(visits.find((v) => v.countryCode === 'GB')).toHaveProperty('markedAt', null);
  });

  it('refuses no such place, a nation on an unsplit map, a bad status or note, and a viewer', async () => {
    expect((await put(`/api/maps/${HOME_MAP}/visits/ZZ`, { status: 'VISITED' })).status).toBe(404);
    expect((await put(`/api/maps/${HOME_MAP}/visits/XC`, { status: 'VISITED' })).status).toBe(404);
    expect((await put(`/api/maps/${HOME_MAP}/visits/DE`, { status: 'MAYBE' })).status).toBe(400);
    expect((await put(`/api/maps/${HOME_MAP}/visits/DE`, { status: 'VISITED', notes: 5 })).message).toBe("A country's notes must be text.");
    expect((await put(`/api/maps/${SAM_MAP}/visits/DE`, { status: 'VISITED' })).status).toBe(403);
  });

  it('clears a visit, 404 for one that isn’t there', async () => {
    expect((await del(`/api/maps/${HOME_MAP}/visits/fr`)).status).toBe(200);
    expect(visit(HOME_MAP, 'FR')).toBeUndefined();
    expect((await del(`/api/maps/${HOME_MAP}/visits/FR`)).status).toBe(404);
    expect((await del(`/api/maps/${SAM_MAP}/visits/TH`)).status).toBe(403);
  });
});

describe('the map’s trips', () => {
  it('lists them for anyone on the map', async () => {
    const ids = (await get(`/api/maps/${HOME_MAP}/trips`)).data.trips.map((t) => t.id);
    expect(ids).toHaveLength(15);
    expect(ids.slice(0, 4)).toEqual(['trip-patagonia', 'trip-tom-stag', 'trip-japan', 'trip-norway']);
    expect(ids.at(-1)).toBe('trip-usa');
    expect((await get(`/api/maps/${TOM_MAP}/trips`)).status).toBe(404);
  });

  it('makes one for an editor, with only the map’s travellers', async () => {
    const days = { startDate: '2027-08-01', endDate: '2027-08-10' };
    const { status, data } = await post(`/api/maps/${HOME_MAP}/trips`, { title: ' Iceland ', ...days, travellerIds: ['trav-test', 'trav-sam'] });
    expect(status).toBe(201);
    expect(data.trip).toMatchObject({ title: 'Iceland', status: 'PLANNED', ...days, travellerIds: ['trav-test'], role: 'OWNER' });
    expect((await post(`/api/maps/${HOME_MAP}/trips`, {})).status).toBe(400);
    // Every new trip has its days, real ones, in order (as the server: 23 Nov 2026)
    const noDays = await post(`/api/maps/${HOME_MAP}/trips`, { title: 'Someday' });
    expect(noDays.status).toBe(400);
    expect(noDays.message).toBe('Give the trip the day it starts and the day it ends.');
    expect((await post(`/api/maps/${HOME_MAP}/trips`, { title: 'Half', startDate: '2027-08-01' })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/trips`, { title: 'Odd', startDate: '2027-02-31', endDate: '2027-03-02' })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/trips`, { title: 'Back', startDate: '2027-08-10', endDate: '2027-08-01' })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/trips`, { title: 'x', status: 'DREAMT' })).status).toBe(400);
    expect((await post(`/api/maps/${SAM_MAP}/trips`, { title: 'x' })).status).toBe(403);
  });
});

describe('the map’s photo lists', () => {
  it('never shows a viewer hidden photos or their best copies', async () => {
    expect((await get(`/api/maps/${HOME_MAP}/photos`, { limit: 60 })).data.photos).toHaveLength(16);
    makeMember(SAM_MAP, 'VIEWER');
    db().photos.find((p) => p.id === 'photo-bangkok').hidden = true;
    expect((await get(`/api/maps/${SAM_MAP}/photos`)).data.photos).toEqual([]);
    expect((await get(`/api/maps/${SAM_MAP}/photos`, { best: 1 })).status).toBe(403);
    expect((await get(`/api/maps/${HOME_MAP}/photos`, { order: 'random' })).status).toBe(400);
    expect((await get(`/api/maps/${TOM_MAP}/photos`)).status).toBe(404);
  });

  it('answers every country ticket’s lists in one go', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/country-lists`, { photos: 'FR', moments: 'FR' });
    expect(data.moments.FR.moments.map((m) => m.id)).toEqual(['moment-engaged']);
    expect((await get(`/api/maps/${HOME_MAP}/country-lists`, { photos: 'fr' })).status).toBe(400);
  });
});

describe('uploading a photo', () => {
  it('saves a photo end to end: GPS finds its country, marks it, suggests landmarks', { timeout: 20000 }, async () => {
    db().visits = db().visits.filter((v) => !(v.mapId === HOME_MAP && v.countryCode === 'FR'));
    const { status, data } = await uploadPhoto(HOME_MAP, { save: { latitude: 48.8583, longitude: 2.2944, countryCode: 'IT', caption: 'Tower', takenAt: '2026-05-01T10:00:00Z' } });
    expect(status).toBe(201);
    expect(data.photo).toMatchObject({ countryCode: 'FR', caption: 'Tower', latitude: 48.8583, bestCopy: 'ORIGINAL' });
    expect(data.photo.landmarks.map((l) => l.id)).toContain('lm-eiffel-tower');
    expect(data.photo.landmarks.every((l) => l.confirmed === false && l.source === 'GPS')).toBe(true);
    expect(visit(HOME_MAP, 'FR')).toMatchObject({ status: 'VISITED', source: 'PHOTO' });
    const saved = db().photos.find((p) => p.id === data.photo.id);
    expect(saved.shotAt).toBe('2026-05-01T10:00:00Z');
    expect((await post(`/api/maps/${HOME_MAP}/photos`, { photoId: data.photo.id, variants: [] })).status).toBe(400);
  });

  it('uses the chosen country with no GPS, and keeps an Economy map’s print copy', { timeout: 20000 }, async () => {
    setMockPlan(USER, 'FREE', 0);
    expect((await post(`/api/maps/${HOME_MAP}/photos/presign`, { files: files('ORIGINAL') })).message).toBe('Economy keeps a print-quality copy, not the original.');
    const { status, data } = await uploadPhoto(HOME_MAP, { best: 'PRINT', save: { countryCode: 'PT' } });
    expect(status).toBe(201);
    expect(data.photo).toMatchObject({ countryCode: 'PT', bestCopy: 'PRINT', latitude: null });
  });

  it('refuses a print copy on a map that keeps originals', async () => {
    expect((await post(`/api/maps/${HOME_MAP}/photos/presign`, { files: files('PRINT') })).message).toBe('This map keeps the original, so it needs no print copy.');
  });

  it('checks the files asked for: sizes, types and bytes', async () => {
    const presign = (list, extra = {}) => post(`/api/maps/${HOME_MAP}/photos/presign`, { files: list, ...extra });
    expect((await presign([])).status).toBe(400);
    expect((await presign([files()[0], files()[0]])).status).toBe(400);
    expect((await presign([files()[1], files()[2]])).message).toBe('A photo needs its thumbnail and display copies.');
    expect((await presign([{ ...files()[0], contentType: 'image/heic' }, files()[1]])).status).toBe(400);
    expect((await presign([{ ...files()[0], bytes: 0 }, files()[1]])).status).toBe(400);
    expect((await presign([{ ...files()[0], bytes: 2 * 1024 * 1024 }, files()[1]])).status).toBe(413);
    expect((await presign(files(), { kind: 'VIDEO' })).message).toBe('Videos upload through POST /maps/:mapId/videos/upload.');
    expect((await presign(files(), { countryCode: 'ZZ' })).message).toBe('Unknown country.');
  });

  it('answers 409 before uploading to a country that’s full', async () => {
    db().photos.push(...Array.from({ length: 200 }, (_, i) => ({ id: `x${i}`, mapId: HOME_MAP, countryCode: 'FR' })));
    const full = await post(`/api/maps/${HOME_MAP}/photos/presign`, { files: files(), countryCode: 'FR' });
    expect(full.status).toBe(409);
    expect(full.message).toBe('200 of 200 photos of France on this map. Upgrade to add more.');
  });

  it('holds at most 60 files presigned and never saved', async () => {
    for (let i = 0; i < 20; i++) expect((await post(`/api/maps/${HOME_MAP}/photos/presign`, { files: files() })).status).toBe(200);
    expect((await post(`/api/maps/${HOME_MAP}/photos/presign`, { files: files() })).status).toBe(429);
  });

  it('takes nothing on a locked map', async () => {
    setMockPlan(USER, 'FREE', 0);
    for (const name of ['a', 'b', 'c']) db().maps.push({ id: name, name, ownerId: USER, isDefault: false, createdAt: new Date(Date.now() - 1000).toISOString() });
    const locked = await post('/api/maps/c/photos/presign', { files: files('PRINT') });
    expect(locked.status).toBe(403);
    expect(locked.message).toMatch(/^This map isn't paid for/);
  });

  it('lets a trip-only editor add to the trip, and no one else', async () => {
    const lisbon = await post(`/api/maps/${JO_MAP}/photos/presign`, { files: files('PRINT'), tripId: 'trip-jo-lisbon' });
    expect(lisbon.status).toBe(200);
    expect(lisbon.data.uploads.map((u) => u.size)).toEqual(['THUMB', 'DISPLAY', 'PRINT']);
    expect(lisbon.data.uploads[0].key).toMatch(new RegExp(`^myplanetview/photos/${JO_MAP}/${lisbon.data.photoId}/thumb-[\\w-]+\\.webp$`));
    expect((await post(`/api/maps/${JO_MAP}/photos/presign`, { files: files('PRINT') })).status).toBe(404);
    expect((await post(`/api/maps/${SAM_MAP}/photos/presign`, { files: files('PRINT') })).status).toBe(403);
  });

  it('won’t save an upload whose files never arrived, or a repeated import', { timeout: 20000 }, async () => {
    const signed = await post(`/api/maps/${HOME_MAP}/photos/presign`, { files: files() });
    expect((await post(`/api/maps/${HOME_MAP}/photos`, { photoId: signed.data.photoId, variants: [{ size: 'THUMB' }, { size: 'DISPLAY' }, { size: 'ORIGINAL' }] })).message).toBe(
      'The upload did not finish. Please try again.',
    );
    const key = 'polarsteps:photo:trip1/step2/a.jpg';
    expect((await uploadPhoto(HOME_MAP, { save: { countryCode: 'FR', importedFrom: key } })).status).toBe(201);
    expect((await uploadPhoto(HOME_MAP, { save: { countryCode: 'FR', importedFrom: key } })).status).toBe(409);
    expect((await uploadPhoto(HOME_MAP, { save: { countryCode: 'FR', importedFrom: 'elsewhere:1' } })).status).toBe(400);
    expect(session.presigned.size).toBeGreaterThan(0);
  });
});
