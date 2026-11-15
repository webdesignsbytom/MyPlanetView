// Maps, onboarding, travellers, visits, stats and map settings, end to end.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('sign-up', () => {
  it('creates a default solo map with one traveller named after the user', async () => {
    const { agent, user } = await signUp('Ada');
    const maps = await prisma.travelMap.findMany({ where: { ownerId: user.id }, include: { travellers: true } });
    expect(maps).toHaveLength(1);
    expect(maps[0]).toMatchObject({ isDefault: true, groupType: 'SOLO', name: 'My map' });
    expect(maps[0].travellers).toEqual([expect.objectContaining({ name: 'Ada', userId: user.id })]);
    expect(maps[0].shareCode).toMatch(/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{12}$/);

    const res = await agent.get('/api/maps');
    expect(res.status).toBe(200);
    expect(data(res).maps).toEqual([expect.objectContaining({ id: maps[0].id, role: 'OWNER', isDefault: true })]);
  });

  it('needs a session for the map routes', async () => {
    const res = await anon().get('/api/maps');
    expect(res.status).toBe(401);
  });
});

describe('onboarding and travellers', () => {
  let agent;
  let map;

  beforeAll(async () => {
    ({ agent } = await signUp('Sam'));
    map = await defaultMapOf(agent);
  });

  it('turns the default map into a couple map', async () => {
    const res = await agent.patch(`/api/maps/${map.id}`).send({ name: 'Sam & Alex', groupType: 'COUPLE' });
    expect(res.status).toBe(200);
    expect(data(res).map).toMatchObject({ name: 'Sam & Alex', groupType: 'COUPLE', role: 'OWNER' });
  });

  it('refuses an unknown group type', async () => {
    const res = await agent.patch(`/api/maps/${map.id}`).send({ groupType: 'TEAM' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it('adds, edits and removes travellers, but never the last one', async () => {
    const added = await agent
      .post(`/api/maps/${map.id}/travellers`)
      .send({ name: 'Alex', birthCountryCode: 'IE', favouriteCountryCode: 'JP' });
    expect(added.status).toBe(201);
    const alex = data(added).traveller;
    expect(alex).toMatchObject({ name: 'Alex', birthCountryCode: 'IE', favouriteCountryCode: 'JP' });

    const badCountry = await agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Zed', birthCountryCode: 'ZZ' });
    expect(badCountry.status).toBe(400);

    const edited = await agent.patch(`/api/maps/${map.id}/travellers/${alex.id}`).send({ favouriteCountryCode: null });
    expect(edited.status).toBe(200);
    expect(data(edited).traveller.favouriteCountryCode).toBeNull();

    const detail = data(await agent.get(`/api/maps/${map.id}`)).map;
    expect(detail.travellers.map((t) => t.name)).toEqual(['Sam', 'Alex']);

    const removed = await agent.delete(`/api/maps/${map.id}/travellers/${alex.id}`);
    expect(removed.status).toBe(200);

    const sam = detail.travellers.find((t) => t.name === 'Sam');
    const last = await agent.delete(`/api/maps/${map.id}/travellers/${sam.id}`);
    expect(last.status).toBe(409);
  });

  it("can't touch a traveller on someone else's map", async () => {
    const other = await signUp('Other');
    const otherMap = await defaultMapOf(other.agent);
    const otherTraveller = data(await other.agent.get(`/api/maps/${otherMap.id}`)).map.travellers[0];
    // Their map: no role, so it doesn't exist as far as we're concerned
    const res = await agent.patch(`/api/maps/${otherMap.id}/travellers/${otherTraveller.id}`).send({ name: 'Hacked' });
    expect(res.status).toBe(404);
    // Our map, their traveller id
    const crossed = await agent.patch(`/api/maps/${map.id}/travellers/${otherTraveller.id}`).send({ name: 'Hacked' });
    expect(crossed.status).toBe(404);
  });
});

describe('maps', () => {
  it('creates a second map and refuses to delete the default one', async () => {
    const { agent } = await signUp('Fam');
    const created = await agent.post('/api/maps').send({
      name: 'Family holidays',
      groupType: 'FAMILY',
      travellers: [{ name: 'Mum' }, { name: 'Dad' }, { name: 'Kid', birthCountryCode: 'GB' }],
    });
    expect(created.status).toBe(201);
    const familyMap = data(created).map;
    expect(familyMap.travellers).toHaveLength(3);
    expect(familyMap.isDefault).toBe(false);

    const list = data(await agent.get('/api/maps')).maps;
    expect(list.map((m) => m.name).sort()).toEqual(['Family holidays', 'My map']);

    const defaultMap = list.find((m) => m.isDefault);
    expect((await agent.delete(`/api/maps/${defaultMap.id}`)).status).toBe(409);
    expect((await agent.delete(`/api/maps/${familyMap.id}`)).status).toBe(200);
    expect((await agent.get(`/api/maps/${familyMap.id}`)).status).toBe(404);
  });

  it('needs at least one traveller to create a map', async () => {
    const { agent } = await signUp('Empty');
    const res = await agent.post('/api/maps').send({ name: 'Nobody', groupType: 'SOLO', travellers: [] });
    expect(res.status).toBe(400);
  });
});

describe('countries visited and stats', () => {
  it('saves, changes and removes visits, and counts them', async () => {
    const { agent } = await signUp('Vis');
    const map = await defaultMapOf(agent);

    for (const [code, status] of [['FR', 'VISITED'], ['JP', 'LIVED'], ['BR', 'WANT_TO_GO'], ['IT', 'VISITED']]) {
      const res = await agent.put(`/api/maps/${map.id}/visits/${code}`).send({ status, firstVisitedOn: '2020-05-01' });
      expect(res.status).toBe(200);
      expect(data(res).visit).toMatchObject({ countryCode: code, status, source: 'MANUAL', firstVisitedOn: '2020-05-01' });
    }

    expect((await agent.put(`/api/maps/${map.id}/visits/ZZ`).send({ status: 'VISITED' })).status).toBe(404);
    expect((await agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'MAYBE' })).status).toBe(400);
    expect((await agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED', firstVisitedOn: '2020-13-40' })).status).toBe(400);

    let stats = data(await agent.get(`/api/maps/${map.id}/stats`)).stats;
    // WANT_TO_GO doesn't count; France + Italy are Europe, Japan Asia
    expect(stats).toMatchObject({ countries: 3, continents: 2, photos: 0, landmarks: 0, trips: 0 });

    expect((await agent.delete(`/api/maps/${map.id}/visits/IT`)).status).toBe(200);
    expect((await agent.delete(`/api/maps/${map.id}/visits/IT`)).status).toBe(404);
    stats = data(await agent.get(`/api/maps/${map.id}/stats`)).stats;
    expect(stats.countries).toBe(2);

    const detail = data(await agent.get(`/api/maps/${map.id}`)).map;
    expect(detail.visits.map((v) => v.countryCode).sort()).toEqual(['BR', 'FR', 'JP']);
    expect(detail.stats.countries).toBe(2);
  });

  it('counts Antarctica and the poles as special places, and the South Pole brings Antarctica', async () => {
    const { agent } = await signUp('Polar');
    const map = await defaultMapOf(agent);
    await agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED' });

    // The South Pole is in Antarctica: marking it adds Antarctica, and says so
    let res = await agent.put(`/api/maps/${map.id}/visits/XS`).send({ status: 'VISITED' });
    expect(res.status).toBe(200);
    expect(data(res).implied).toEqual([expect.objectContaining({ countryCode: 'AQ', status: 'VISITED', source: 'MANUAL' })]);
    // Already there: nothing more to add
    res = await agent.put(`/api/maps/${map.id}/visits/XS`).send({ status: 'LIVED' });
    expect(data(res).implied).toEqual([]);
    // Wanting to go to a pole changes nothing else
    res = await agent.put(`/api/maps/${map.id}/visits/QN`).send({ status: 'WANT_TO_GO' });
    expect(data(res).implied).toEqual([]);

    const stats = data(await agent.get(`/api/maps/${map.id}/stats`)).stats;
    expect(stats).toMatchObject({ countries: 1, specialPlaces: 2, continents: 2 });
    const listed = data(await agent.get('/api/maps')).maps.find((m) => m.id === map.id);
    expect(listed.counts.countries).toBe(1);

    // Removing the South Pole leaves Antarctica
    await agent.delete(`/api/maps/${map.id}/visits/XS`);
    const codes = data(await agent.get(`/api/maps/${map.id}`)).map.visits.map((v) => v.countryCode).sort();
    expect(codes).toEqual(['AQ', 'FR', 'QN']);
  });

  it('places a photo taken at the South Pole there, and in Antarctica', async () => {
    const { agent } = await signUp('PolePhoto');
    const map = await defaultMapOf(agent);
    const photo = data(await uploadPhoto(agent, map.id, { latitude: -89.997, longitude: 139.27 })).photo;
    expect(photo.countryCode).toBe('XS');
    const visits = await prisma.countryVisit.findMany({ where: { mapId: map.id }, orderBy: { countryCode: 'asc' } });
    expect(visits.map((v) => [v.countryCode, v.source])).toEqual([['AQ', 'PHOTO'], ['XS', 'PHOTO']]);

    // McMurdo, on the coast: Antarctica from its shape
    expect(data(await uploadPhoto(agent, map.id, { latitude: -77.846, longitude: 166.676 })).photo.countryCode).toBe('AQ');
  });

  it("lets a traveller be born in Antarctica, but not at a pole", async () => {
    const { agent } = await signUp('Born');
    const map = await defaultMapOf(agent);
    const ok = await agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Emilio', birthCountryCode: 'AQ' });
    expect(ok.status).toBe(201);
    const pole = await agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Santa', birthCountryCode: 'XN' });
    expect(pole.status).toBe(400);
    expect(pole.body.message).toBe('Choose a country or Antarctica, not a pole.');
  });
});

describe('reference data', () => {
  it('serves countries and landmarks to anyone', async () => {
    const countries = data(await anon().get('/api/countries')).countries;
    expect(countries.length).toBeGreaterThanOrEqual(224);
    expect(countries.find((c) => c.code === 'FR')).toMatchObject({ name: 'France', continent: 'EUROPE', kind: 'COUNTRY' });
    expect(countries.filter((c) => c.kind === 'SPECIAL').map((c) => c.code).sort()).toEqual(['AQ', 'QN', 'QS', 'XN', 'XS']);
    expect(countries.find((c) => c.code === 'XN')).toMatchObject({ name: 'North Pole', continent: null });

    const landmarks = data(await anon().get('/api/landmarks?country=FR')).landmarks;
    expect(landmarks.some((l) => l.name === 'Eiffel Tower')).toBe(true);
    expect(landmarks.every((l) => l.countryCode === 'FR')).toBe(true);
  });
});

describe('map settings', () => {
  it('saves known settings, drops unknown keys and refuses bad values', async () => {
    const { agent } = await signUp('Set');
    const empty = await agent.get('/api/users/map-settings');
    expect(empty.status).toBe(200);
    expect(data(empty).mapSettings).toBeNull();

    const saved = await agent
      .put('/api/users/map-settings')
      .send({ mapSettings: { style: 'galaxy', showGrid: false, showAntarctica: false, sneaky: 'x' } });
    expect(saved.status).toBe(200);
    expect(data(saved).mapSettings).toMatchObject({ style: 'galaxy', showGrid: false, showAntarctica: false });
    expect(data(saved).mapSettings).not.toHaveProperty('sneaky');

    const bad = await agent.put('/api/users/map-settings').send({ mapSettings: { style: 'neon' } });
    expect(bad.status).toBe(400);

    const again = data(await agent.get('/api/users/map-settings')).mapSettings;
    expect(again).toMatchObject({ style: 'galaxy', showGrid: false });

    expect((await anon().get('/api/users/map-settings')).status).toBe(401);
  });
});
