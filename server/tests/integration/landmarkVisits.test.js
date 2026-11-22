// Collecting (docs/API.md "Collecting"): an editor ticks a landmark "been here" (no photo
// needed), which marks its country visited; everyone on the map sees the ticks.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('landmarks ticked "been here"', () => {
  let owner;
  let viewer;
  let unverified;
  let map;
  let colosseum;
  const been = (who, landmarkId) => `/api/maps/${map.id}/landmarks/${landmarkId}/been`;
  const ticksOf = async (who) => data(await who.agent.get(`/api/maps/${map.id}`)).map.tickedLandmarkIds;

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('TickOwner'), signUp('TickViewer')]);
    unverified = await signUp('TickUnverified', { verified: false });
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    colosseum = data(await owner.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum');
  });

  it('ticks one, marking its country visited, and everyone on the map sees it', async () => {
    expect(await ticksOf(owner)).toEqual([]);
    const res = await owner.agent.put(been(owner, colosseum.id));
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({ landmarkId: colosseum.id, been: true, countryCode: 'IT' });
    // Again is fine
    expect((await owner.agent.put(been(owner, colosseum.id))).status).toBe(200);
    expect(await ticksOf(owner)).toEqual([colosseum.id]);
    expect(await ticksOf(viewer)).toEqual([colosseum.id]);
    const visit = await prisma.countryVisit.findFirst({ where: { mapId: map.id, countryCode: 'IT' } });
    expect(visit).toMatchObject({ status: 'VISITED', source: 'MANUAL' });
  });

  it('unticks it; the country stays visited', async () => {
    expect(data(await owner.agent.delete(been(owner, colosseum.id)))).toEqual({ landmarkId: colosseum.id, been: false });
    expect(await ticksOf(owner)).toEqual([]);
    expect(await prisma.countryVisit.count({ where: { mapId: map.id, countryCode: 'IT' } })).toBe(1);
  });

  it('is for editors with a verified email; an unknown landmark is a 404', async () => {
    expect((await viewer.agent.put(been(viewer, colosseum.id))).status).toBe(403);
    const own = await defaultMapOf(unverified.agent);
    expect((await unverified.agent.put(`/api/maps/${own.id}/landmarks/${colosseum.id}/been`)).status).toBe(403);
    expect((await owner.agent.put(been(owner, '00000000-0000-4000-8000-000000000000'))).status).toBe(404);
  });

  it('goes in "Your data"', async () => {
    await owner.agent.put(been(owner, colosseum.id));
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map;
    expect(exported.landmarksBeenTo).toEqual([expect.objectContaining({ landmarkId: colosseum.id, name: 'Colosseum', countryCode: 'IT' })]);
  });
});
