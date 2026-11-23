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

  // 23 Nov 2026, the user's decision: "both methods should get a stamp in the passport"
  it('stamps the passport, with no photo, and counts as a stamp for the stats and badges', async () => {
    expect((await owner.agent.put(been(owner, colosseum.id))).status).toBe(200);
    const passport = data(await owner.agent.get(`/api/maps/${map.id}/passport`)).passport;
    const stamp = passport.pages.find((p) => p.countryCode === 'IT').stamps.find((s) => s.landmarkId === colosseum.id);
    expect(stamp).toMatchObject({ name: 'Colosseum', ticked: true, photo: null, photoCount: 0, stampedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    expect(passport.totals.landmarks).toBe(1);
    expect(passport.totals.unesco).toBe(colosseum.isUnesco ? 1 : 0);
    // The account each traveller is linked to stays out of the reply
    expect(passport.travellers.every((t) => !('userId' in t))).toBe(true);
    // A viewer's passport has it too
    const forViewer = data(await viewer.agent.get(`/api/maps/${map.id}/passport`)).passport;
    expect(forViewer.totals.landmarks).toBe(1);

    const detail = data(await owner.agent.get(`/api/maps/${map.id}`)).map;
    // Stamped by a photo: none; ticked: the Colosseum (the map marks both)
    expect(detail.stampedLandmarkIds).toEqual([]);
    expect(detail.tickedLandmarkIds).toEqual([colosseum.id]);
    expect(detail.stats.landmarks).toBe(1);
    const { badges } = data(await owner.agent.get(`/api/maps/${map.id}/badges`));
    expect(badges.find((b) => b.key === 'landmarks-1')).toMatchObject({ have: 1, need: 1, earnedAt: expect.any(String) });
  });

  it('is in the passport of the traveller whose account ticked it, never another’s', async () => {
    await owner.agent.patch(`/api/maps/${map.id}`).send({ groupType: 'FAMILY' });
    const partner = data(await owner.agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Partner' })).traveller;
    const { travellers } = data(await owner.agent.get(`/api/maps/${map.id}`)).map;
    const mine = travellers.find((t) => t.userId === owner.user.id);
    const stampsOf = async (travellerId) =>
      data(await owner.agent.get(`/api/maps/${map.id}/passport?traveller=${travellerId}`)).passport.pages.flatMap((p) => p.stamps.map((s) => s.landmarkId));
    expect(await stampsOf(mine.id)).toEqual([colosseum.id]);
    expect(await stampsOf(partner.id)).toEqual([]);
  });

  it('goes in "Your data"', async () => {
    await owner.agent.put(been(owner, colosseum.id));
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map;
    expect(exported.landmarksBeenTo).toEqual([expect.objectContaining({ landmarkId: colosseum.id, name: 'Colosseum', countryCode: 'IT' })]);
  });
});
