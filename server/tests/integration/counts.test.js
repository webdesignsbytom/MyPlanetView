// The counts in map and trip lists (audit B2 and E): counted per caller, so
// hidden photos count only for the owner and editors.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('counts in map and trip lists', () => {
  let owner;
  let viewer;
  let editor;
  let tripViewer;
  let map;
  let trip;

  const listedMap = async (who) => data(await who.agent.get('/api/maps')).maps.find((m) => m.id === map.id);
  const listedTrip = async (who) => data(await who.agent.get(`/api/maps/${map.id}/trips`)).trips.find((t) => t.id === trip.id);

  beforeAll(async () => {
    // Only verified accounts are added directly (otherwise they get an invite)
    owner = await signUp('Counter', { verified: true });
    viewer = await signUp('CountViewer', { verified: true });
    editor = await signUp('CountEditor', { verified: true });
    tripViewer = await signUp('CountTripViewer', { verified: true });
    map = await defaultMapOf(owner.agent);
    for (const [who, role] of [[viewer, 'VIEWER'], [editor, 'EDITOR']]) {
      expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: who.email, role })).status).toBe(201);
    }

    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Counted trip' })).trip;
    expect((await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'IT' })).status).toBe(201);
    expect((await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: tripViewer.email, role: 'VIEWER' })).status).toBe(201);

    // On the trip: one visible photo and one hidden; off it: one more visible
    expect((await uploadPhoto(owner.agent, map.id, { tripId: trip.id, countryCode: 'IT' })).status).toBe(201);
    const hidden = data(await uploadPhoto(owner.agent, map.id, { tripId: trip.id, countryCode: 'IT' })).photo;
    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'FR' })).status).toBe(201);
    expect((await owner.agent.patch(`/api/photos/${hidden.id}`).send({ hidden: true })).status).toBe(200);
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/JP`).send({ status: 'VISITED' })).status).toBe(200);
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/BR`).send({ status: 'WANT_TO_GO' })).status).toBe(200);
  });

  it('counts hidden photos on GET /maps for the owner and editors only', async () => {
    expect((await listedMap(owner)).counts).toMatchObject({ photos: 3, trips: 1 });
    expect((await listedMap(editor)).counts).toMatchObject({ photos: 3, trips: 1 });
    expect((await listedMap(viewer)).counts).toMatchObject({ photos: 2, trips: 1 });

    // The list agrees with each caller's own map stats (visited and lived-in countries, visible photos)
    for (const who of [owner, editor, viewer]) {
      const { counts } = await listedMap(who);
      const { stats } = data(await who.agent.get(`/api/maps/${map.id}/stats`));
      expect(counts).toEqual({ countries: stats.countries, photos: stats.photos, trips: stats.trips });
    }
  });

  it('counts a trip\'s hidden photos for the owner and editors only', async () => {
    expect(await listedTrip(owner)).toMatchObject({ stopCount: 1, photoCount: 2 });
    expect(await listedTrip(editor)).toMatchObject({ stopCount: 1, photoCount: 2 });
    expect(await listedTrip(viewer)).toMatchObject({ stopCount: 1, photoCount: 1 });

    const shared = data(await tripViewer.agent.get('/api/trips/shared-with-me')).trips;
    expect(shared.find((t) => t.id === trip.id)).toMatchObject({ role: 'VIEWER', stopCount: 1, photoCount: 1 });
  });

  it('leaves hidden photos out of the counts behind a share link', async () => {
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const code = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;

    const visitor = data(await anon().get(`/api/shared/${code}`));
    expect(visitor.role).toBe('VIEWER');
    expect(visitor.trips.find((t) => t.id === trip.id)).toMatchObject({ stopCount: 1, photoCount: 1 });

    // An editor opening the same link keeps their role, and their count
    const asEditor = data(await editor.agent.get(`/api/shared/${code}`));
    expect(asEditor.role).toBe('EDITOR');
    expect(asEditor.trips.find((t) => t.id === trip.id)).toMatchObject({ photoCount: 2 });
  });
});
