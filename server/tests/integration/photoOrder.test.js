// Rearranging galleries: a country's on the map (and the unplaced photos), and a trip's.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const ids = async (agent, url) => {
  const res = await agent.get(url);
  expect(res.status).toBe(200);
  return data(res).photos.map((p) => p.id);
};
const upload = async (agent, mapId, options) => {
  const res = await uploadPhoto(agent, mapId, options);
  expect(res.status).toBe(201);
  return data(res).photo.id;
};
const move = (agent, photoId, body) => agent.post(`/api/photos/${photoId}/move`).send(body);

describe('rearranging photos', () => {
  let owner;
  let map;
  let countryUrl;
  let a;
  let b;
  let c;

  beforeAll(async () => {
    owner = await signUp('Arranger');
    map = await defaultMapOf(owner.agent);
    countryUrl = `/api/maps/${map.id}/photos?country=FR`;
    a = await upload(owner.agent, map.id, { countryCode: 'FR', caption: 'a' });
    b = await upload(owner.agent, map.id, { countryCode: 'FR', caption: 'b' });
    c = await upload(owner.agent, map.id, { countryCode: 'FR', caption: 'c' });
  });

  it('puts a new photo first, as the newest-first lists did', async () => {
    expect(await ids(owner.agent, countryUrl)).toEqual([c, b, a]);
  });

  it('moves a photo first, last, or between two others', async () => {
    expect((await move(owner.agent, a, { gallery: 'country', afterId: null })).status).toBe(200);
    expect(await ids(owner.agent, countryUrl)).toEqual([a, c, b]);

    expect((await move(owner.agent, a, { gallery: 'country', afterId: b })).status).toBe(200);
    expect(await ids(owner.agent, countryUrl)).toEqual([c, b, a]);

    expect((await move(owner.agent, c, { gallery: 'country', afterId: b })).status).toBe(200);
    expect(await ids(owner.agent, countryUrl)).toEqual([b, c, a]);
  });

  it('writes only the moved photo, unless its neighbours have no room left: then it renumbers', async () => {
    const before = await prisma.photo.findMany({ where: { id: { in: [a, b] } }, select: { id: true, countryPosition: true } });
    expect((await move(owner.agent, a, { gallery: 'country', afterId: b })).status).toBe(200);
    const after = await prisma.photo.findMany({ where: { id: { in: [a, b] } }, select: { id: true, countryPosition: true } });
    const position = (rows, id) => rows.find((r) => r.id === id).countryPosition;
    expect(position(after, b)).toBe(position(before, b));
    expect(await ids(owner.agent, countryUrl)).toEqual([b, a, c]);

    // Two photos saved at the same moment can share a position: dropping a photo
    // between them still lands where it was dropped
    await prisma.photo.updateMany({ where: { id: { in: [a, b] } }, data: { countryPosition: 5 } });
    const [first, second] = [a, b].sort();
    expect((await move(owner.agent, c, { gallery: 'country', afterId: first })).status).toBe(200);
    expect(await ids(owner.agent, countryUrl)).toEqual([first, c, second]);
  });

  it('pages through a rearranged gallery without repeats or gaps', async () => {
    const all = await ids(owner.agent, countryUrl);
    const page1 = data(await owner.agent.get(`${countryUrl}&limit=2`));
    const page2 = data(await owner.agent.get(`${countryUrl}&limit=2&cursor=${page1.nextCursor}`));
    expect([...page1.photos, ...page2.photos].map((p) => p.id)).toEqual(all);
    expect(page2.nextCursor).toBeNull();
  });

  it('puts a photo first in its new gallery when its country changes, and leaves it when the country is the same', async () => {
    const order = await ids(owner.agent, countryUrl);
    const last = order[order.length - 1];
    expect((await owner.agent.patch(`/api/photos/${last}`).send({ countryCode: 'FR', caption: 'same place' })).status).toBe(200);
    expect(await ids(owner.agent, countryUrl)).toEqual(order);

    const spain = await upload(owner.agent, map.id, { countryCode: 'ES' });
    expect((await owner.agent.patch(`/api/photos/${last}`).send({ countryCode: 'ES' })).status).toBe(200);
    expect(await ids(owner.agent, `/api/maps/${map.id}/photos?country=ES`)).toEqual([last, spain]);
    expect(await ids(owner.agent, countryUrl)).toEqual(order.slice(0, -1));
  });

  it('rearranges the unplaced photos as a gallery of their own', async () => {
    const unplacedUrl = `/api/maps/${map.id}/photos?unplaced=1`;
    const x = await upload(owner.agent, map.id, {});
    const y = await upload(owner.agent, map.id, {});
    expect(await ids(owner.agent, unplacedUrl)).toEqual([y, x]);
    expect((await move(owner.agent, y, { gallery: 'country', afterId: x })).status).toBe(200);
    expect(await ids(owner.agent, unplacedUrl)).toEqual([x, y]);
  });

  it('refuses a bad gallery, the photo itself, or a photo from another gallery', async () => {
    expect((await move(owner.agent, a, { gallery: 'map', afterId: null })).status).toBe(400);
    expect((await move(owner.agent, a, {})).status).toBe(400);
    // Not on a trip, so no trip gallery
    expect((await move(owner.agent, a, { gallery: 'trip', afterId: null })).status).toBe(400);
    expect((await move(owner.agent, a, { gallery: 'country', afterId: a })).status).toBe(400);
    expect((await move(owner.agent, a, { gallery: 'country', afterId: 'not-an-id' })).status).toBe(400);
    const elsewhere = await upload(owner.agent, map.id, { countryCode: 'IT' });
    expect((await move(owner.agent, a, { gallery: 'country', afterId: elsewhere })).status).toBe(409);
  });
});

describe('rearranging a trip', () => {
  let owner;
  let map;
  let trip;
  let t1;
  let t2;
  let tripUrl;

  beforeAll(async () => {
    owner = await signUp('TripArranger');
    map = await defaultMapOf(owner.agent);
    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ startDate: '2019-04-10', endDate: '2019-04-12', title: 'Ordered trip' })).trip;
    tripUrl = `/api/trips/${trip.id}/photos`;
    t1 = await upload(owner.agent, map.id, { tripId: trip.id, countryCode: 'IT' });
    t2 = await upload(owner.agent, map.id, { tripId: trip.id, countryCode: 'IT' });
  });

  it('keeps the trip and the country in their own orders', async () => {
    expect(await ids(owner.agent, tripUrl)).toEqual([t2, t1]);
    expect((await move(owner.agent, t2, { gallery: 'trip', afterId: t1 })).status).toBe(200);
    expect(await ids(owner.agent, tripUrl)).toEqual([t1, t2]);
    // The map's list filtered by the trip follows the trip's order too
    expect(await ids(owner.agent, `/api/maps/${map.id}/photos?tripId=${trip.id}`)).toEqual([t1, t2]);
    // The country's gallery didn't move
    expect(await ids(owner.agent, `/api/maps/${map.id}/photos?country=IT`)).toEqual([t2, t1]);
  });

  it('puts a photo moved onto the trip first in it', async () => {
    const loose = await upload(owner.agent, map.id, { countryCode: 'IT' });
    expect((await owner.agent.patch(`/api/photos/${loose}`).send({ tripId: trip.id })).status).toBe(200);
    expect(await ids(owner.agent, tripUrl)).toEqual([loose, t1, t2]);
  });

  it('lets editors rearrange: a viewer gets 403, a stranger 404, a trip-only editor only the trip', async () => {
    const viewer = await signUp('ArrangeViewer');
    const tripEditor = await signUp('ArrangeTripEditor');
    const stranger = await signUp('ArrangeStranger');
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    expect((await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: tripEditor.email, role: 'EDITOR' })).status).toBe(201);

    expect((await move(viewer.agent, t1, { gallery: 'country', afterId: null })).status).toBe(403);
    expect((await move(viewer.agent, t1, { gallery: 'trip', afterId: null })).status).toBe(403);
    expect((await move(stranger.agent, t1, { gallery: 'trip', afterId: null })).status).toBe(404);

    // The trip's gallery is the trip's; the country's belongs to the map
    expect((await move(tripEditor.agent, t2, { gallery: 'trip', afterId: null })).status).toBe(200);
    expect((await ids(owner.agent, tripUrl))[0]).toBe(t2);
    expect((await move(tripEditor.agent, t2, { gallery: 'country', afterId: null })).status).toBe(403);
  });
});
