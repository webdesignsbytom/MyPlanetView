// Maps, onboarding, travellers, visits, stats and map settings, end to end.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadPhoto } from './helpers.js';

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

  it('keeps each kind of map to its number of travellers: one just for you, two for a couple', async () => {
    const { agent: owner } = await signUp('Capped');
    const capped = await defaultMapOf(owner);
    const add = (name) => owner.post(`/api/maps/${capped.id}/travellers`).send({ name });
    const kind = (groupType, extra = {}) => owner.patch(`/api/maps/${capped.id}`).send({ groupType, ...extra });

    // Just me: one
    const second = await add('Two');
    expect(second.status).toBe(409);
    expect(second.body.message).toBe(`A map that's just for you has one traveller. Choose "A couple" or "A family" to add more.`);
    // A couple: two, then no more
    expect((await kind('COUPLE')).status).toBe(200);
    expect((await add('Two')).status).toBe(201);
    const third = await add('Three');
    expect(third.status).toBe(409);
    expect(third.body.message).toBe(`A couple's map has two travellers. Choose "A family" to add more.`);
    // Never back to a kind with room for fewer than it has
    const solo = await kind('SOLO');
    expect(solo.status).toBe(409);
    expect(solo.body.message).toBe('"Just me" is for one traveller: remove the others first.');
    // A family: more, and then a couple only once it's two again
    expect((await kind('FAMILY')).status).toBe(200);
    expect((await add('Three')).status).toBe(201);
    expect((await kind('COUPLE')).status).toBe(409);
    // Saving the map with the kind it already has (a rename) is fine
    expect((await kind('FAMILY', { name: 'All of us' })).status).toBe(200);
    // A new map: no more travellers than its kind has
    const tooMany = await owner.post('/api/maps').send({ name: 'Us', groupType: 'COUPLE', travellers: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] });
    expect(tooMany.status).toBe(400);
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

  it("marks a traveller's birth country visited, once, as born there is been there", async () => {
    const born = await signUp('Born');
    const bornMap = await defaultMapOf(born.agent);
    const visitsNow = async () => data(await born.agent.get(`/api/maps/${bornMap.id}`)).map.visits;
    const visitOf = (visits, code) => visits.find((v) => v.countryCode === code);
    const me = data(await born.agent.get(`/api/maps/${bornMap.id}`)).map.travellers[0];
    // Three people: a family's map ("just me" has one traveller)
    expect((await born.agent.patch(`/api/maps/${bornMap.id}`).send({ groupType: 'FAMILY' })).status).toBe(200);
    await born.agent.put(`/api/maps/${bornMap.id}/visits/PT`).send({ status: 'WANT_TO_GO' });
    await born.agent.put(`/api/maps/${bornMap.id}/visits/JP`).send({ status: 'LIVED' });

    // The welcome page's edit of the sign-up traveller, and two more people
    expect((await born.agent.patch(`/api/maps/${bornMap.id}/travellers/${me.id}`).send({ birthCountryCode: 'GB' })).status).toBe(200);
    expect((await born.agent.post(`/api/maps/${bornMap.id}/travellers`).send({ name: 'Ana', birthCountryCode: 'PT' })).status).toBe(201);
    expect((await born.agent.post(`/api/maps/${bornMap.id}/travellers`).send({ name: 'Ken', birthCountryCode: 'JP' })).status).toBe(201);
    let visits = await visitsNow();
    expect(visitOf(visits, 'GB')).toMatchObject({ status: 'VISITED', source: 'MANUAL' });
    // "Want to go" becomes visited; lived stays lived
    expect(visitOf(visits, 'PT')).toMatchObject({ status: 'VISITED' });
    expect(visitOf(visits, 'JP')).toMatchObject({ status: 'LIVED' });

    // Only a new or changed birthplace counts: a visit taken off stays off when the
    // traveller is saved again with the same one
    expect((await born.agent.delete(`/api/maps/${bornMap.id}/visits/GB`)).status).toBe(200);
    await born.agent.patch(`/api/maps/${bornMap.id}/travellers/${me.id}`).send({ name: 'Born again', birthCountryCode: 'GB' });
    expect(visitOf(await visitsNow(), 'GB')).toBeUndefined();

    // A changed one marks the new country; the old one is never taken back
    await born.agent.patch(`/api/maps/${bornMap.id}/travellers/${me.id}`).send({ birthCountryCode: 'FR' });
    visits = await visitsNow();
    expect(visitOf(visits, 'FR')).toMatchObject({ status: 'VISITED' });
    expect(visits.map((v) => v.countryCode).sort()).toEqual(['FR', 'JP', 'PT']);
  });
});

describe('maps', () => {
  it('creates a second map and refuses to delete the default one', async () => {
    const { agent, user } = await signUp('Fam');
    // A second map is an extra map (mapLimits.test.js has the 402)
    await givePlan(user.id, { extraMaps: 1 });
    const created = await agent.post('/api/maps').send({
      name: 'Family holidays',
      groupType: 'FAMILY',
      travellers: [{ name: 'Mum' }, { name: 'Dad' }, { name: 'Kid', birthCountryCode: 'GB' }],
    });
    expect(created.status).toBe(201);
    const familyMap = data(created).map;
    expect(familyMap.travellers).toHaveLength(3);
    expect(familyMap.isDefault).toBe(false);
    // The kid's birthplace is on the new map
    expect(familyMap.visits).toEqual([expect.objectContaining({ countryCode: 'GB', status: 'VISITED' })]);

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

  it('keeps a region apart: its own visit brings its country, and only the country counts', async () => {
    const { agent } = await signUp('Island');
    const map = await defaultMapOf(agent);

    // Bali is in Indonesia: marking it adds Indonesia, and says so
    let res = await agent.put(`/api/maps/${map.id}/visits/XB`).send({ status: 'VISITED', notes: 'Rice terraces' });
    expect(res.status).toBe(200);
    expect(data(res).visit).toMatchObject({ countryCode: 'XB', status: 'VISITED', notes: 'Rice terraces' });
    expect(data(res).implied).toEqual([expect.objectContaining({ countryCode: 'ID', status: 'VISITED', source: 'MANUAL' })]);
    // Wanting to go to Tasmania adds nothing
    res = await agent.put(`/api/maps/${map.id}/visits/XT`).send({ status: 'WANT_TO_GO' });
    expect(data(res).implied).toEqual([]);

    const stats = data(await agent.get(`/api/maps/${map.id}/stats`)).stats;
    expect(stats).toMatchObject({ countries: 1, specialPlaces: 0, regions: 1, continents: 1 });
    const listed = data(await agent.get('/api/maps')).maps.find((m) => m.id === map.id);
    expect(listed.counts.countries).toBe(1);

    // A photo or a trip's stop never goes to a region: New Caledonia's go to France
    const photo = data(await uploadPhoto(agent, map.id, { countryCode: 'NC' })).photo;
    expect(photo.countryCode).toBe('FR');
    const noumea = data(await uploadPhoto(agent, map.id, { latitude: -22.27, longitude: 166.45 })).photo;
    expect(noumea.countryCode).toBe('FR');
  });

  it("lets a traveller be born in Antarctica, but not at a pole", async () => {
    const { agent } = await signUp('Born');
    const map = await defaultMapOf(agent);
    await agent.patch(`/api/maps/${map.id}`).send({ groupType: 'FAMILY' });
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
    expect(countries.length).toBeGreaterThanOrEqual(227);
    expect(countries.find((c) => c.code === 'FR')).toMatchObject({ name: 'France', continent: 'EUROPE', kind: 'COUNTRY' });
    expect(countries.filter((c) => c.kind === 'SPECIAL').map((c) => c.code).sort()).toEqual(['AQ', 'QN', 'QS', 'XN', 'XS']);
    expect(countries.find((c) => c.code === 'XN')).toMatchObject({ name: 'North Pole', continent: null });

    const landmarks = data(await anon().get('/api/landmarks?country=FR')).landmarks;
    expect(landmarks.some((l) => l.name === 'Eiffel Tower')).toBe(true);
    expect(landmarks.every((l) => l.countryCode === 'FR')).toBe(true);
    // Each with its Wikidata item: the client finds the landmark's 3D model by it (the
    // celebration screen, 24 Nov 2026)
    expect(landmarks.every((l) => /^Q\d+$/.test(l.wikidataId))).toBe(true);
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
      .send({ mapSettings: { style: 'old-map', showGrid: false, showAntarctica: false, sneaky: 'x' } });
    expect(saved.status).toBe(200);
    expect(data(saved).mapSettings).toMatchObject({ style: 'old-map', showGrid: false, showAntarctica: false });
    expect(data(saved).mapSettings).not.toHaveProperty('sneaky');

    const bad = await agent.put('/api/users/map-settings').send({ mapSettings: { style: 'neon' } });
    expect(bad.status).toBe(400);

    const again = data(await agent.get('/api/users/map-settings')).mapSettings;
    expect(again).toMatchObject({ style: 'old-map', showGrid: false });

    expect((await anon().get('/api/users/map-settings')).status).toBe(401);
  });
});
