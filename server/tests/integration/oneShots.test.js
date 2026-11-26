// Life's One Shots (docs/API.md "Life's One Shots"; 24 Nov 2026, the user's wish and name):
// ticks of the catalogue on a map, seen by everyone who can see it, ticked by its editors.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadPhoto, uploadVideo } from './helpers.js';

afterAll(cleanUp);

describe('Life’s One Shots', () => {
  let owner;
  let viewer;
  let unverified;
  let map;
  let traveller;
  const url = (itemKey = '') => `/api/maps/${map.id}/one-shots${itemKey ? `/${itemKey}` : ''}`;
  const listOf = async (who) => data(await who.agent.get(url()));

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('ShotOwner'), signUp('ShotViewer')]);
    unverified = await signUp('ShotUnverified', { verified: false });
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    traveller = data(await owner.agent.get(`/api/maps/${map.id}`)).map.travellers[0];
  });

  it('starts with nothing ticked and nothing to suggest', async () => {
    expect(await listOf(owner)).toEqual({ oneShots: [], suggestions: [] });
  });

  it('ticks one with when, where and who, marking the country visited', async () => {
    const res = await owner.agent.put(url('lion')).send({ seenOn: '2024-03-12', countryCode: 'KE', notes: 'At dawn', travellerIds: [traveller.id] });
    expect(res.status).toBe(201);
    expect(data(res)).toMatchObject({
      created: true,
      countryCode: 'KE',
      oneShot: { itemKey: 'lion', seenOn: '2024-03-12', datePrecision: 'DAY', countryCode: 'KE', notes: 'At dawn', source: 'MANUAL', travellerIds: [traveller.id], photo: null },
    });
    const visits = data(await owner.agent.get(`/api/maps/${map.id}`)).map.visits;
    expect(visits.find((v) => v.countryCode === 'KE')).toMatchObject({ status: 'VISITED', source: 'MANUAL' });
  });

  it('changes a tick in place, and clears what’s sent as null', async () => {
    const res = await owner.agent.put(url('lion')).send({ seenOn: '2024', notes: null, travellerIds: [] });
    expect(res.status).toBe(200);
    expect(data(res).created).toBe(false);
    expect(data(res).oneShot).toMatchObject({ seenOn: '2024-01-01', datePrecision: 'YEAR', countryCode: 'KE', notes: null, travellerIds: [] });
    expect((await listOf(owner)).oneShots).toHaveLength(1);
  });

  it('shows a tick with its photo; a hidden photo only to editors', async () => {
    const photo = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'IS' })).photo;
    expect((await owner.agent.put(url('puffin')).send({ photoId: photo.id, countryCode: 'IS' })).status).toBe(201);
    const mine = (await listOf(owner)).oneShots.find((o) => o.itemKey === 'puffin');
    // The older single photo still works: a list of one
    expect(mine.photo).toMatchObject({ id: photo.id, thumbUrl: expect.any(String), displayUrl: expect.any(String) });
    expect(mine.photos.map((p) => p.id)).toEqual([photo.id]);
    await owner.agent.patch(`/api/photos/${photo.id}`).send({ hidden: true });
    expect((await listOf(owner)).oneShots.find((o) => o.itemKey === 'puffin').photo?.id).toBe(photo.id);
    expect((await listOf(viewer)).oneShots.find((o) => o.itemKey === 'puffin').photo).toBeNull();
    await owner.agent.patch(`/api/photos/${photo.id}`).send({ hidden: false });
  });

  // 26 Nov 2026, the user's wish: "a photo/multiple photos of you with" it
  it('keeps up to 5 photos in order, the first on its card; a hidden one only for editors; a deleted one goes', async () => {
    const upload = async () => data(await uploadPhoto(owner.agent, map.id, { countryCode: 'KE' })).photo.id;
    const ids = [];
    for (let i = 0; i < 6; i += 1) ids.push(await upload());
    const put = (photoIds) => owner.agent.put(url('giraffe')).send({ countryCode: 'KE', photoIds });
    expect((await put(ids)).status).toBe(400);
    const saved = await put([ids[2], ids[0], ids[1]]);
    expect(saved.status).toBe(201);
    expect(data(saved).oneShot.photos.map((p) => p.id)).toEqual([ids[2], ids[0], ids[1]]);
    expect(data(saved).oneShot.photo.id).toBe(ids[2]);
    expect(data(saved).oneShot.photos.every((p) => p.thumbUrl && p.displayUrl)).toBe(true);

    // Another one first: the card's photo changes
    expect(data(await put([ids[1], ids[2]])).oneShot.photos.map((p) => p.id)).toEqual([ids[1], ids[2]]);
    await owner.agent.patch(`/api/photos/${ids[1]}`).send({ hidden: true });
    const forViewer = (await listOf(viewer)).oneShots.find((o) => o.itemKey === 'giraffe');
    expect(forViewer.photos.map((p) => p.id)).toEqual([ids[2]]);
    expect(forViewer.photo.id).toBe(ids[2]);
    expect((await listOf(owner)).oneShots.find((o) => o.itemKey === 'giraffe').photos).toHaveLength(2);

    // Deleting a photo takes it off the tick, and the tick stays
    expect((await owner.agent.delete(`/api/photos/${ids[1]}`)).status).toBe(200);
    expect((await listOf(owner)).oneShots.find((o) => o.itemKey === 'giraffe').photos.map((p) => p.id)).toEqual([ids[2]]);
    // An empty list takes them all off; leaving it out keeps them
    expect(data(await owner.agent.put(url('giraffe')).send({ notes: 'Huge' })).oneShot.photos).toHaveLength(1);
    expect(data(await put([])).oneShot).toMatchObject({ photos: [], photo: null });

    // Never a video, even the map's own
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    const video = data(await uploadVideo(owner.agent, map.id, { countryCode: 'KE', ready: true })).photo.id;
    const refused = await put([ids[2], video]);
    expect(refused.status).toBe(400);
    expect(refused.body.message).toBe("Choose up to 5 of this map's own photos (not videos).");
    await owner.agent.put(url('giraffe')).send({ photoIds: [ids[2], ids[0]] });
    expect(await prisma.oneShotPhoto.count({ where: { photoId: { in: [ids[2], ids[0]] } } })).toBe(2);
  });

  it('refuses an item that isn’t one, a bad field, another map’s photo, a stranger as traveller', async () => {
    expect((await owner.agent.put(url('unicorn')).send({})).status).toBe(404);
    expect((await owner.agent.put(url('lion')).send({ seenOn: '2024-02-31' })).status).toBe(400);
    expect((await owner.agent.put(url('lion')).send({ countryCode: 'QQ' })).status).toBe(400);
    const otherMap = await defaultMapOf(viewer.agent);
    const theirs = data(await uploadPhoto(viewer.agent, otherMap.id, { countryCode: 'FR' })).photo;
    const wrongPhoto = await owner.agent.put(url('lion')).send({ photoId: theirs.id });
    expect(wrongPhoto.status).toBe(400);
    expect(wrongPhoto.body.message).toBe("Choose up to 5 of this map's own photos (not videos).");
    expect((await owner.agent.put(url('lion')).send({ travellerIds: ['11111111-1111-4111-8111-111111111111'] })).status).toBe(400);
    // A flight as the source only for a line a flight crosses
    expect((await owner.agent.put(url('lion')).send({ source: 'FLIGHT' })).status).toBe(400);
  });

  it('lets a viewer look but not tick, an unverified editor nothing, a stranger not even look', async () => {
    expect((await listOf(viewer)).suggestions).toEqual([]);
    expect((await viewer.agent.put(url('tiger')).send({})).status).toBe(403);
    expect((await unverified.agent.put(url('tiger')).send({})).status).toBe(403);
    expect((await unverified.agent.get(url())).status).toBe(404);
  });

  it('suggests the lines its flights crossed, ticked from a flight with one press', async () => {
    const flights = await owner.agent.post(`/api/maps/${map.id}/flights`).send({ flights: [{ from: 'LHR', to: 'NBO', flownOn: '2019-03-02' }] });
    expect(flights.status).toBe(201);
    const { suggestions } = await listOf(owner);
    expect(suggestions).toEqual([
      expect.objectContaining({ itemKey: 'equator', seenOn: '2019-03-02', from: 'FLIGHT', flight: expect.objectContaining({ fromAirport: 'LHR', toAirport: 'NBO' }) }),
    ]);
    const res = await owner.agent.put(url('equator')).send({ seenOn: '2019-03-02', source: 'FLIGHT' });
    expect(data(res).oneShot).toMatchObject({ source: 'FLIGHT', seenOn: '2019-03-02' });
    expect((await listOf(owner)).suggestions).toEqual([]);
  });

  it('counts for the badges, and stays out of the passport for now (24 Nov 2026, the user’s decision)', async () => {
    const { badges } = data(await owner.agent.get(`/api/maps/${map.id}/badges`));
    expect(badges.find((b) => b.key === 'oneshots-wildlife-1')).toMatchObject({ group: 'oneShots', have: 1, earnedAt: expect.any(String) });
    expect(badges.find((b) => b.key === 'oneshots-journeys-1').earnedAt).not.toBeNull();
    const { passport } = data(await owner.agent.get(`/api/maps/${map.id}/passport`));
    expect(passport).not.toHaveProperty('oneShots');
    // Who saw it, kept on the tick
    await owner.agent.put(url('lion')).send({ travellerIds: [traveller.id] });
    expect((await listOf(owner)).oneShots.find((o) => o.itemKey === 'lion').travellerIds).toEqual([traveller.id]);
  });

  it('shows through a share link, never with suggestions', async () => {
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const code = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;
    const res = await anon().get(`/api/shared/${code}/one-shots`);
    expect(res.status).toBe(200);
    expect(data(res).suggestions).toEqual([]);
    expect(data(res).oneShots.map((o) => o.itemKey).sort()).toEqual(['equator', 'giraffe', 'lion', 'puffin']);
  });

  it('takes one off, leaving the country visited, and carries the rest in "Your data"', async () => {
    const res = await owner.agent.delete(url('puffin'));
    expect(data(res)).toEqual({ itemKey: 'puffin', ticked: false });
    expect((await listOf(owner)).oneShots.map((o) => o.itemKey).sort()).toEqual(['equator', 'giraffe', 'lion']);
    const visits = data(await owner.agent.get(`/api/maps/${map.id}`)).map.visits;
    expect(visits.find((v) => v.countryCode === 'IS')).toBeTruthy();
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map;
    expect(exported.oneShots).toEqual([
      expect.objectContaining({ item: 'lion', seenOn: '2024-01-01', datePrecision: 'YEAR', countryCode: 'KE', travellerIds: [traveller.id], photoIds: [] }),
      expect.objectContaining({ item: 'giraffe', photoIds: [expect.any(String), expect.any(String)] }),
      expect.objectContaining({ item: 'equator', source: 'FLIGHT' }),
    ]);
  });
});
