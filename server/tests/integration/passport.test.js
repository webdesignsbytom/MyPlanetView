// The passport (docs/API.md, "Passport"): a page per country in the order they were first
// visited, a stamp per landmark with a confirmed photo, the photo a stamp shows, and what
// viewers and share links see.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ORIGINAL_SIZES, anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const EIFFEL = { latitude: 48.8583, longitude: 2.29448 };

describe('the passport', () => {
  let owner;
  let viewer;
  let stranger;
  let map;
  let eiffelId;
  let first;
  let second;

  const passportOf = async (agent) => {
    const res = await agent.get(`/api/maps/${map.id}/passport`);
    expect(res.status).toBe(200);
    return data(res).passport;
  };
  const pageOf = (passport, code) => passport.pages.find((p) => p.countryCode === code);
  const eiffelStamp = (passport) => pageOf(passport, 'FR')?.stamps.find((s) => s.name === 'Eiffel Tower');
  const confirm = (photoId) => owner.agent.patch(`/api/photos/${photoId}/landmarks/${eiffelId}`).send({ confirmed: true });

  beforeAll(async () => {
    owner = await signUp('PassportOwner');
    viewer = await signUp('PassportViewer');
    stranger = await signUp('PassportStranger');
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    eiffelId = data(await owner.agent.get('/api/landmarks?country=FR')).landmarks.find((l) => l.name === 'Eiffel Tower').id;
  });

  it('stamps a landmark only once a photo of it is confirmed', async () => {
    const res = await uploadPhoto(owner.agent, map.id, { ...EIFFEL, takenAt: '2025-04-02T09:30:00.000Z' });
    expect(res.status).toBe(201);
    first = data(res).photo;

    // The photo marks France visited, but a GPS suggestion isn't a stamp yet
    let passport = await passportOf(owner.agent);
    expect(pageOf(passport, 'FR')).toMatchObject({ status: 'VISITED', enteredOn: '2025-04-02', stamps: [] });
    expect(pageOf(passport, 'FR').toStamp.map((l) => l.name)).toContain('Eiffel Tower');

    expect((await confirm(first.id)).status).toBe(200);
    passport = await passportOf(owner.agent);
    expect(eiffelStamp(passport)).toMatchObject({ landmarkId: eiffelId, stampedOn: '2025-04-02', photoCount: 1, photoChosen: false });
    expect(eiffelStamp(passport).photo).toMatchObject({ id: first.id, thumbUrl: expect.any(String) });
    expect(pageOf(passport, 'FR').toStamp.map((l) => l.name)).not.toContain('Eiffel Tower');
    expect(passport.totals).toMatchObject({ countries: 1, landmarks: 1 });
    expect(passport.map).toMatchObject({ id: map.id, ownerName: 'PassportOwner' });
    // The match remembers its map and when it was confirmed
    expect(await prisma.photoLandmark.findFirst({ where: { photoId: first.id, landmarkId: eiffelId } })).toMatchObject({
      mapId: map.id,
      confirmed: true,
      confirmedAt: expect.any(Date),
    });
  });

  it('orders the pages by first visit, and leaves out "want to go"', async () => {
    await owner.agent.put(`/api/maps/${map.id}/visits/JP`).send({ status: 'VISITED', firstVisitedOn: '2019-03-01' });
    await owner.agent.put(`/api/maps/${map.id}/visits/IS`).send({ status: 'WANT_TO_GO' });
    const passport = await passportOf(owner.agent);
    expect(passport.pages.map((p) => p.countryCode)).toEqual(['JP', 'FR']);
    expect(pageOf(passport, 'JP')).toMatchObject({ enteredOn: '2019-03-01', stamps: [] });
  });

  it('shows the photo an editor picks, and never a hidden one below editor', async () => {
    second = data(await uploadPhoto(owner.agent, map.id, { ...EIFFEL, takenAt: '2026-01-05T12:00:00.000Z' })).photo;
    expect((await confirm(second.id)).status).toBe(200);
    expect(eiffelStamp(await passportOf(owner.agent))).toMatchObject({ photoCount: 2, photo: { id: first.id } });

    const url = `/api/maps/${map.id}/passport/stamps/${eiffelId}/photo`;
    expect((await owner.agent.put(url).send({ photoId: second.id })).status).toBe(200);
    expect(eiffelStamp(await passportOf(owner.agent))).toMatchObject({ photo: { id: second.id }, photoChosen: true });
    expect(eiffelStamp(await passportOf(viewer.agent))).toMatchObject({ photo: { id: second.id } });
    expect(eiffelStamp(await passportOf(viewer.agent))).not.toHaveProperty('photoChosen');

    // Hidden: the viewer gets the earliest photo they can see, and the count leaves it out
    await owner.agent.patch(`/api/photos/${second.id}`).send({ hidden: true });
    expect(eiffelStamp(await passportOf(viewer.agent))).toMatchObject({ photo: { id: first.id }, photoCount: 1 });
    expect(eiffelStamp(await passportOf(owner.agent))).toMatchObject({ photo: { id: second.id }, photoCount: 2 });

    // Every photo of it hidden: no stamp for the viewer, but the landmark is still listed
    await owner.agent.patch(`/api/photos/${first.id}`).send({ hidden: true });
    const forViewer = await passportOf(viewer.agent);
    expect(eiffelStamp(forViewer)).toBeUndefined();
    expect(forViewer.totals.landmarks).toBe(0);
    await owner.agent.patch(`/api/photos/${first.id}`).send({ hidden: false });
    await owner.agent.patch(`/api/photos/${second.id}`).send({ hidden: false });

    // Back to the earliest
    expect((await owner.agent.delete(url)).status).toBe(200);
    expect(eiffelStamp(await passportOf(owner.agent))).toMatchObject({ photo: { id: first.id }, photoChosen: false });
  });

  it('only takes a confirmed photo of that landmark, from an editor', async () => {
    const url = `/api/maps/${map.id}/passport/stamps/${eiffelId}/photo`;
    const elsewhere = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'JP' })).photo;
    expect((await owner.agent.put(url).send({ photoId: elsewhere.id })).status).toBe(400);
    expect((await owner.agent.put(url).send({ photoId: 'not-an-id' })).status).toBe(400);
    expect((await viewer.agent.put(url).send({ photoId: first.id })).status).toBe(403);
    expect((await stranger.agent.put(url).send({ photoId: first.id })).status).toBe(404);
    expect((await stranger.agent.get(`/api/maps/${map.id}/passport`)).status).toBe(404);
  });

  it('drops a picked photo with its match', async () => {
    const url = `/api/maps/${map.id}/passport/stamps/${eiffelId}/photo`;
    expect((await owner.agent.put(url).send({ photoId: second.id })).status).toBe(200);
    expect(await prisma.landmarkCover.count({ where: { mapId: map.id } })).toBe(1);
    expect((await owner.agent.delete(`/api/photos/${second.id}/landmarks/${eiffelId}`)).status).toBe(200);
    expect(await prisma.landmarkCover.count({ where: { mapId: map.id } })).toBe(0);
    expect(eiffelStamp(await passportOf(owner.agent))).toMatchObject({ photo: { id: first.id }, photoCount: 1 });
  });

  it('gives a page with only stamps no status, even when it is marked "want to go"', async () => {
    // A landmark in Italy confirmed on a photo placed in France (as at a border)
    const colosseum = data(await owner.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum');
    const photo = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'FR' })).photo;
    expect((await owner.agent.post(`/api/photos/${photo.id}/landmarks`).send({ landmarkId: colosseum.id })).status).toBe(201);
    await owner.agent.put(`/api/maps/${map.id}/visits/IT`).send({ status: 'WANT_TO_GO' });
    const italy = (await passportOf(owner.agent)).pages.find((p) => p.countryCode === 'IT');
    expect(italy).toMatchObject({ status: null, stamps: [expect.objectContaining({ name: 'Colosseum' })] });
    await owner.agent.delete(`/api/photos/${photo.id}`);
    await owner.agent.delete(`/api/maps/${map.id}/visits/IT`);
  });

  it('opens through a map link, never a trip link', async () => {
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const res = await anon().get(`/api/shared/${shareCode}/passport`);
    expect(res.status).toBe(200);
    expect(eiffelStamp(data(res).passport)).toMatchObject({ photo: { id: first.id } });
    expect(eiffelStamp(data(res).passport)).not.toHaveProperty('photoChosen');

    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Paris' })).trip;
    await owner.agent.patch(`/api/trips/${trip.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const tripCode = data(await owner.agent.get(`/api/trips/${trip.id}/sharing`)).shareCode;
    expect((await anon().get(`/api/shared/${tripCode}/passport`)).status).toBe(404);
    expect((await anon().get('/api/shared/AAAA-BBBB-CCCC/passport')).status).toBe(404);
  });

  it('wears the owner’s plan on its cover, for everyone who opens it', async () => {
    expect((await passportOf(owner.agent)).map.plan).toEqual({ id: 'FREE', name: 'Economy' });
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    expect((await passportOf(viewer.agent)).map.plan).toEqual({ id: 'PREMIUM', name: 'First Class' });
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    expect((await passportOf(owner.agent)).map.plan).toEqual({ id: 'REGULAR', name: 'Business' });
  });

  it('shows the moments that happened at a stamped landmark, hidden ones to editors only', async () => {
    // The owner is on Business by now (the test above): the original is kept
    const photo = data(await uploadPhoto(owner.agent, map.id, { ...EIFFEL, takenAt: '2025-06-01T10:00:00.000Z', sizes: ORIGINAL_SIZES })).photo;
    expect((await confirm(photo.id)).status).toBe(200);
    const moment = (title, extra = {}) =>
      owner.agent.post(`/api/maps/${map.id}/moments`).send({ kind: 'SAW_OR_DID', title, countryCode: 'FR', landmarkId: eiffelId, ...extra });
    expect((await moment('Picnic on the Champ de Mars', { happenedOn: '2025-06-01', datePrecision: 'DAY' })).status).toBe(201);
    expect((await moment('A secret proposal plan', { hidden: true })).status).toBe(201);

    const mine = eiffelStamp(await passportOf(owner.agent)).moments;
    expect(mine.map((m) => m.title)).toEqual(['Picnic on the Champ de Mars', 'A secret proposal plan']);
    expect(mine[0]).toMatchObject({ happenedOn: '2025-06-01', datePrecision: 'DAY', kind: 'SAW_OR_DID' });
    const theirs = eiffelStamp(await passportOf(viewer.agent)).moments;
    expect(theirs.map((m) => m.title)).toEqual(['Picnic on the Champ de Mars']);
  });

  it('lists a landmark’s photos for the stamp picker, whichever country they were placed in', async () => {
    // A photo of the tower placed in Belgium (taken across a border, say), matched by hand
    const border = data(
      await uploadPhoto(owner.agent, map.id, { countryCode: 'BE', takenAt: '2024-01-05T08:00:00.000Z', sizes: ORIGINAL_SIZES })
    ).photo;
    expect((await owner.agent.post(`/api/photos/${border.id}/landmarks`).send({ landmarkId: eiffelId })).status).toBe(201);
    // A GPS suggestion that isn't confirmed doesn't count
    const suggested = data(await uploadPhoto(owner.agent, map.id, { ...EIFFEL, takenAt: '2023-01-01T08:00:00.000Z', sizes: ORIGINAL_SIZES })).photo;

    const listed = async (agent, query = `landmark=${eiffelId}`) => {
      const res = await agent.get(`/api/maps/${map.id}/photos?${query}`);
      expect(res.status).toBe(200);
      return data(res).photos.map((p) => p.id);
    };
    const mine = await listed(owner.agent);
    // Oldest taken first: the Belgian one leads, and the suggestion isn't there
    expect(mine[0]).toBe(border.id);
    expect(mine).toContain(first.id);
    expect(mine).not.toContain(suggested.id);
    const france = await listed(owner.agent, 'country=FR');
    expect(france).not.toContain(border.id);

    // Below editor, hidden photos stay out; a bad id is a 400
    expect((await owner.agent.patch(`/api/photos/${border.id}`).send({ hidden: true })).status).toBe(200);
    expect(await listed(viewer.agent)).not.toContain(border.id);
    expect(await listed(owner.agent)).toContain(border.id);
    expect((await owner.agent.get(`/api/maps/${map.id}/photos?landmark=nope`)).status).toBe(400);
    expect((await stranger.agent.get(`/api/maps/${map.id}/photos?landmark=${eiffelId}`)).status).toBe(404);
  });

  it('names the stamped landmarks with the map, to mark their pins; a hidden photo’s only for editors', async () => {
    const montId = data(await owner.agent.get('/api/landmarks?country=FR')).landmarks.find((l) => l.name === 'Mont-Saint-Michel').id;
    const hiddenPhoto = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', sizes: ORIGINAL_SIZES })).photo;
    expect((await owner.agent.post(`/api/photos/${hiddenPhoto.id}/landmarks`).send({ landmarkId: montId })).status).toBe(201);
    expect((await owner.agent.patch(`/api/photos/${hiddenPhoto.id}`).send({ hidden: true })).status).toBe(200);

    const stampedFor = async (agent) => {
      const res = await agent.get(`/api/maps/${map.id}`);
      expect(res.status).toBe(200);
      return data(res).map.stampedLandmarkIds;
    };
    const mine = await stampedFor(owner.agent);
    expect(mine).toEqual(expect.arrayContaining([eiffelId, montId]));
    expect(data(await owner.agent.get(`/api/maps/${map.id}`)).map.stats.landmarks).toBe(mine.length);
    const theirs = await stampedFor(viewer.agent);
    expect(theirs).toContain(eiffelId);
    expect(theirs).not.toContain(montId);
  });
});
