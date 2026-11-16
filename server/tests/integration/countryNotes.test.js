// A country's one note (CountryVisit.notes, "I want to visit here"): cleaned and capped
// on PUT /maps/:mapId/visits/:countryCode, and returned with the map's visits to everyone
// who can see the map, share links included (docs/API.md "Countries visited").
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('country notes', () => {
  let owner;
  let editor;
  let viewer;
  let map;

  const visitOf = async (agent, code) => data(await agent.get(`/api/maps/${map.id}`)).map.visits.find((v) => v.countryCode === code);

  beforeAll(async () => {
    owner = await signUp('NoteOwner');
    editor = await signUp('NoteEditor');
    viewer = await signUp('NoteViewer');
    map = await defaultMapOf(owner.agent);
    for (const [who, role] of [[editor, 'EDITOR'], [viewer, 'VIEWER']]) {
      expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: who.email, role })).status).toBe(201);
    }
  });

  it('keeps where a visit came from when only its note changes, and makes it MANUAL when the status does', async () => {
    // A photo placed in Peru adds a PHOTO visit
    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'PE' })).status).toBe(201);
    expect((await visitOf(owner.agent, 'PE')).source).toBe('PHOTO');
    // Writing a note with the same status keeps PHOTO
    await owner.agent.put(`/api/maps/${map.id}/visits/PE`).send({ status: 'VISITED', notes: 'Machu Picchu at dawn' });
    expect(await visitOf(owner.agent, 'PE')).toMatchObject({ source: 'PHOTO', notes: 'Machu Picchu at dawn' });
    // Changing the status is the person's own choice
    await owner.agent.put(`/api/maps/${map.id}/visits/PE`).send({ status: 'LIVED' });
    expect(await visitOf(owner.agent, 'PE')).toMatchObject({ source: 'MANUAL', status: 'LIVED', notes: 'Machu Picchu at dawn' });
  });

  it('keeps a note for any status, cleaned of tags and control characters', async () => {
    const res = await owner.agent
      .put(`/api/maps/${map.id}/visits/JP`)
      .send({ status: 'WANT_TO_GO', notes: '  <b>Cherry blossom</b> is in early April\u0007  ' });
    expect(res.status).toBe(200);
    expect(data(res).visit).toMatchObject({ countryCode: 'JP', status: 'WANT_TO_GO', notes: 'Cherry blossom is in early April' });
  });

  it('cuts a long note to 1,000 characters', async () => {
    const res = await owner.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED', notes: 'x'.repeat(1500) });
    expect(res.status).toBe(200);
    expect(data(res).visit.notes).toHaveLength(1000);
  });

  it('keeps the note when a PUT leaves it out, and clears it with null or an empty string', async () => {
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'LIVED' })).status).toBe(200);
    expect((await visitOf(owner.agent, 'FR')).notes).toHaveLength(1000);

    expect(data(await owner.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'LIVED', notes: null })).visit.notes).toBeNull();
    await owner.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'LIVED', notes: 'Back soon' });
    expect(data(await owner.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'LIVED', notes: '' })).visit.notes).toBeNull();
    // Only tags: nothing left, so no note
    expect(data(await owner.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'LIVED', notes: '<br>' })).visit.notes).toBeNull();
  });

  it('refuses a note that is not text', async () => {
    for (const notes of [42, { text: 'x' }, ['x'], true]) {
      const res = await owner.agent.put(`/api/maps/${map.id}/visits/IT`).send({ status: 'VISITED', notes });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("A country's notes must be text.");
    }
    expect(await visitOf(owner.agent, 'IT')).toBeUndefined();
  });

  it('lets editors write it and viewers read it, but not write it', async () => {
    expect((await editor.agent.put(`/api/maps/${map.id}/visits/PT`).send({ status: 'WANT_TO_GO', notes: 'Lisbon trams' })).status).toBe(200);
    expect(await visitOf(viewer.agent, 'PT')).toMatchObject({ notes: 'Lisbon trams' });
    expect(await visitOf(viewer.agent, 'JP')).toMatchObject({ notes: 'Cherry blossom is in early April' });
    expect((await viewer.agent.put(`/api/maps/${map.id}/visits/PT`).send({ status: 'VISITED', notes: 'Mine' })).status).toBe(403);
    expect((await visitOf(owner.agent, 'PT')).notes).toBe('Lisbon trams');
  });

  it('survives a completed trip turning "want to go" into visited', async () => {
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Tokyo' })).trip;
    await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'JP' });
    expect((await owner.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' })).status).toBe(200);
    expect(await visitOf(owner.agent, 'JP')).toMatchObject({ status: 'VISITED', source: 'TRIP', notes: 'Cherry blossom is in early April' });
  });

  it('shows the notes through a share link', async () => {
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const code = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;
    const shared = data(await anon().get(`/api/shared/${code}`));
    expect(shared.map.visits.find((v) => v.countryCode === 'PT')).toMatchObject({ notes: 'Lisbon trams' });
  });
});
