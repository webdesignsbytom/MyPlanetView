// Country maps (docs/API.md "Country maps"): states visited and pins with their visits, end to end.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const visitsOf = async (agent, mapId) => data(await agent.get(`/api/maps/${mapId}`)).map.visits;

describe('states on a country map', () => {
  let owner;
  let map;
  beforeAll(async () => {
    owner = await signUp('States');
    map = await defaultMapOf(owner.agent);
  });

  it('marks a state, and brings its country', async () => {
    const res = await owner.agent.put(`/api/maps/${map.id}/subdivisions/US-CA`).send({ status: 'VISITED' });
    expect(res.status).toBe(200);
    expect(data(res).subdivision).toEqual({ code: 'US-CA', status: 'VISITED' });
    expect(data(res).implied).toEqual([expect.objectContaining({ countryCode: 'US', status: 'VISITED', source: 'MANUAL' })]);
    // Wanting to go somewhere brings nothing
    expect(data(await owner.agent.put(`/api/maps/${map.id}/subdivisions/US-TX`).send({ status: 'WANT_TO_GO' })).implied).toEqual([]);

    const list = data(await owner.agent.get(`/api/maps/${map.id}/subdivisions?country=US`)).subdivisions;
    expect(list).toEqual(expect.arrayContaining([{ code: 'US-CA', status: 'VISITED' }, { code: 'US-TX', status: 'WANT_TO_GO' }]));
    expect(data(await owner.agent.get(`/api/maps/${map.id}/subdivisions?country=CA`)).subdivisions).toEqual([]);
    // States are never countries: still one country
    expect(data(await owner.agent.get(`/api/maps/${map.id}/stats`)).stats.countries).toBe(1);
  });

  it("keeps Hawaii's state and the Hawaii region one visit", async () => {
    await owner.agent.put(`/api/maps/${map.id}/subdivisions/US-HI`).send({ status: 'LIVED' });
    expect((await visitsOf(owner.agent, map.id)).find((v) => v.countryCode === 'XH')).toMatchObject({ status: 'LIVED' });
    await owner.agent.put(`/api/maps/${map.id}/visits/XH`).send({ status: 'VISITED' });
    const list = data(await owner.agent.get(`/api/maps/${map.id}/subdivisions?country=US`)).subdivisions;
    expect(list).toContainEqual({ code: 'US-HI', status: 'VISITED' });
    expect((await owner.agent.delete(`/api/maps/${map.id}/subdivisions/US-HI`)).status).toBe(200);
    expect((await visitsOf(owner.agent, map.id)).some((v) => v.countryCode === 'XH')).toBe(false);
  });

  it('refuses a state that does not exist, a bad status, and a viewer', async () => {
    expect((await owner.agent.put(`/api/maps/${map.id}/subdivisions/ZZ-NOPE`).send({ status: 'VISITED' })).status).toBe(404);
    expect((await owner.agent.put(`/api/maps/${map.id}/subdivisions/US-NY`).send({ status: 'SOMETIMES' })).status).toBe(400);
    expect((await owner.agent.get(`/api/maps/${map.id}/subdivisions?country=AQ`)).status).toBe(400);
    const stranger = await signUp('StatesStranger');
    expect((await stranger.agent.put(`/api/maps/${map.id}/subdivisions/US-NY`).send({ status: 'VISITED' })).status).toBe(404);
  });
});

describe('pins with visits', () => {
  let owner;
  let map;
  let photoId;
  beforeAll(async () => {
    owner = await signUp('Pins');
    map = await defaultMapOf(owner.agent);
    photoId = data(await uploadPhoto(owner.agent, map.id, { latitude: 35.36, longitude: 24.48 })).photo.id;
  });

  it('puts a pin in a country, with a first visit and its photos', async () => {
    const res = await owner.agent.post(`/api/maps/${map.id}/pins`).send({
      name: 'Our spot in Crete',
      notes: 'The taverna by the harbour',
      countryCode: 'GR',
      latitude: 35.37,
      longitude: 24.47,
      visit: { visitedOn: '2023-08', photoIds: [photoId] },
    });
    expect(res.status).toBe(201);
    const pin = data(res).pin;
    // An exact spot: the map's editors' own until shared (19 Nov 2026, the user's decision)
    expect(pin).toMatchObject({ name: 'Our spot in Crete', countryCode: 'GR', hidden: true });
    expect(pin.visits).toEqual([expect.objectContaining({ visitedOn: '2023-08-01', datePrecision: 'MONTH', photos: [expect.objectContaining({ id: photoId })] })]);

    // Going back every year: each visit its own, newest first
    const again = data(await owner.agent.post(`/api/pins/${pin.id}/visits`).send({ visitedOn: '2024-07-14', notes: 'Hotter' })).pin;
    expect(again.visits.map((v) => v.visitedOn)).toEqual(['2024-07-14', '2023-08-01']);

    const list = data(await owner.agent.get(`/api/maps/${map.id}/pins?country=GR`)).pins;
    expect(list).toEqual([expect.objectContaining({ id: pin.id, visitCount: 2, latestVisit: { visitedOn: '2024-07-14', datePrecision: 'DAY' } })]);
  });

  it('refuses a pin outside its country, with no name, or with another map’s photo', async () => {
    const base = { name: 'Spot', countryCode: 'GR', latitude: 35.37, longitude: 24.47 };
    expect((await owner.agent.post(`/api/maps/${map.id}/pins`).send({ ...base, latitude: 48.85, longitude: 2.35 })).status).toBe(400);
    expect((await owner.agent.post(`/api/maps/${map.id}/pins`).send({ ...base, name: '' })).status).toBe(400);
    const other = await signUp('PinsOther');
    const otherMap = await defaultMapOf(other.agent);
    const theirs = data(await uploadPhoto(other.agent, otherMap.id, {})).photo.id;
    const res = await owner.agent.post(`/api/maps/${map.id}/pins`).send({ ...base, visit: { photoIds: [theirs] } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Choose up to 50 photos, each from this map.');
  });

  it('changes and removes a visit, hides a pin from viewers, and shows the rest through a share link', async () => {
    const pin = data(await owner.agent.get(`/api/maps/${map.id}/pins?country=GR`)).pins[0];
    const detail = data(await owner.agent.get(`/api/pins/${pin.id}`)).pin;
    const [latest, first] = detail.visits;
    const changed = data(await owner.agent.patch(`/api/pins/${pin.id}/visits/${first.id}`).send({ notes: 'First time', photoIds: [] })).pin;
    expect(changed.visits.find((v) => v.id === first.id)).toMatchObject({ notes: 'First time', photos: [] });
    expect(data(await owner.agent.delete(`/api/pins/${pin.id}/visits/${latest.id}`)).pin.visits).toHaveLength(1);

    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const code = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;
    // Not shared yet: the link shows none; shared, it shows it
    expect(data(await anon().get(`/api/shared/${code}/pins?country=GR`)).pins).toEqual([]);
    await owner.agent.patch(`/api/pins/${pin.id}`).send({ hidden: false });
    const shared = data(await anon().get(`/api/shared/${code}/pins?country=GR`)).pins;
    expect(shared).toEqual([expect.not.objectContaining({ hidden: expect.anything() })]);
    expect(data(await anon().get(`/api/shared/${code}/pins/${pin.id}`)).pin).toMatchObject({ name: 'Our spot in Crete' });

    await owner.agent.patch(`/api/pins/${pin.id}`).send({ hidden: true });
    expect(data(await anon().get(`/api/shared/${code}/pins?country=GR`)).pins).toEqual([]);
    expect((await anon().get(`/api/shared/${code}/pins/${pin.id}`)).status).toBe(404);

    expect((await owner.agent.delete(`/api/pins/${pin.id}`)).status).toBe(200);
    expect((await owner.agent.get(`/api/pins/${pin.id}`)).status).toBe(404);
  });

  it("finds a UK pin on its nation's map", async () => {
    const res = await owner.agent.post(`/api/maps/${map.id}/pins`).send({ name: 'Cardiff Bay', countryCode: 'XW', latitude: 51.46, longitude: -3.165 });
    expect(res.status).toBe(201);
    expect(data(res).pin.countryCode).toBe('GB');
    // New maps split the UK: Wales's map has it, England's doesn't
    expect(data(await owner.agent.get(`/api/maps/${map.id}/pins?country=XW`)).pins.map((p) => p.name)).toEqual(['Cardiff Bay']);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/pins?country=XE`)).pins).toEqual([]);
  });
});
