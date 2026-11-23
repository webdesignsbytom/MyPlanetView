// "Your year in travel" (docs/API.md "Year in travel"): one year of a map, counting what the
// caller may see: the owner hidden photos and moments too, a viewer never; strangers get a 404.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const EIFFEL = { latitude: 48.8584, longitude: 2.2945 };

describe('year in travel', () => {
  let owner;
  let viewer;
  let stranger;
  let map;
  const recapOf = (who, year) => who.agent.get(`/api/maps/${map.id}/recap/${year}`);

  beforeAll(async () => {
    [owner, viewer, stranger] = await Promise.all(['RecapOwner', 'RecapViewer', 'RecapStranger'].map((n) => signUp(n)));
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);

    // 2025: Paris (a stamp at the Eiffel Tower), Japan twice, one hidden photo of Peru
    const paris = data(await uploadPhoto(owner.agent, map.id, { ...EIFFEL, takenAt: '2025-05-02T10:00:00.000Z' })).photo;
    const eiffel = paris.landmarks.find((l) => l.name.includes('Eiffel'));
    expect((await owner.agent.patch(`/api/photos/${paris.id}/landmarks/${eiffel.id}`).send({ confirmed: true })).status).toBe(200);
    await uploadPhoto(owner.agent, map.id, { countryCode: 'JP', takenAt: '2025-10-01T09:00:00.000Z' });
    await uploadPhoto(owner.agent, map.id, { countryCode: 'JP', takenAt: '2025-10-03T09:00:00.000Z' });
    const peru = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'PE', takenAt: '2025-12-30T09:00:00.000Z' })).photo;
    expect((await owner.agent.patch(`/api/photos/${peru.id}`).send({ hidden: true })).status).toBe(200);
    // 2024: one photo in Spain
    await uploadPhoto(owner.agent, map.id, { countryCode: 'ES', takenAt: '2024-08-01T09:00:00.000Z' });

    // A completed trip to Italy in 2025, a planned one to Iceland (never counted)
    const italy = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Rome', startDate: '2025-03-01', endDate: '2025-03-05' })).trip;
    expect((await owner.agent.post(`/api/trips/${italy.id}/stops`).send({ countryCode: 'IT', arriveOn: '2025-03-01' })).status).toBe(201);
    expect((await owner.agent.patch(`/api/trips/${italy.id}`).send({ status: 'COMPLETED' })).status).toBe(200);
    const iceland = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Iceland', startDate: '2025-09-01', endDate: '2025-09-08' })).trip;
    expect((await owner.agent.post(`/api/trips/${iceland.id}/stops`).send({ countryCode: 'IS' })).status).toBe(201);

    // Japan first visited in 2025; a moment in Portugal; a hidden one in Greece
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/JP`).send({ status: 'VISITED', firstVisitedOn: '2025-10-01' })).status).toBe(200);
    expect((await owner.agent.post(`/api/maps/${map.id}/moments`).send({ kind: 'SAW_OR_DID', title: 'Tram 28', countryCode: 'PT', happenedOn: '2025-06-01' })).status).toBe(201);
    const greece = data(await owner.agent.post(`/api/maps/${map.id}/moments`).send({ kind: 'SAW_OR_DID', title: 'Secret', countryCode: 'GR', happenedOn: '2025-07-01' })).moment;
    expect((await owner.agent.patch(`/api/moments/${greece.id}`).send({ hidden: true })).status).toBe(200);
  });

  it('counts the owner’s year, hidden things included', async () => {
    const res = await recapOf(owner, 2025);
    expect(res.status).toBe(200);
    const { recap } = data(res);
    expect(recap.year).toBe(2025);
    expect(recap.years).toEqual(expect.arrayContaining([2025, 2024]));
    expect(recap.places).toEqual(['FR', 'GR', 'IT', 'JP', 'PE', 'PT']);
    expect(recap.countries).toBe(6);
    expect(recap.newCountries).toEqual(['JP']);
    expect(recap.photos).toBe(4);
    expect(recap.topCountries[0]).toEqual({ countryCode: 'JP', photos: 2 });
    expect(recap.trips.map((t) => t.title)).toEqual(['Rome']);
    expect(recap.moments).toBe(2);
    expect(recap.stamps.count).toBe(1);
    expect(recap.stamps.landmarks[0].name).toContain('Eiffel');
    // A photo from each country with photos, with its display copy
    expect(recap.highlights.map((p) => p.countryCode).sort()).toEqual(['FR', 'JP', 'PE']);
    expect(recap.highlights.every((p) => p.displayUrl)).toBe(true);
  });

  it('a viewer never sees the hidden photo or moment', async () => {
    const { recap } = data(await recapOf(viewer, 2025));
    expect(recap.places).toEqual(['FR', 'IT', 'JP', 'PT']);
    expect(recap.photos).toBe(3);
    expect(recap.moments).toBe(1);
    expect(recap.highlights.map((p) => p.countryCode)).not.toContain('PE');
  });

  it('another year has its own; an empty one is empty', async () => {
    expect(data(await recapOf(owner, 2024)).recap).toMatchObject({ places: ['ES'], photos: 1, trips: [] });
    expect(data(await recapOf(owner, 2001)).recap).toMatchObject({ places: [], photos: 0, countries: 0 });
  });

  it('refuses a bad year, and a stranger gets a 404', async () => {
    expect((await recapOf(owner, 'abcd')).status).toBe(400);
    expect((await recapOf(owner, 3000)).status).toBe(400);
    expect((await recapOf(stranger, 2025)).status).toBe(404);
  });
});
