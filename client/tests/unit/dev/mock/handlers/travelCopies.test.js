import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { COPY_MESSAGES } from '@/dev/mock/travelCopies';
import { ALEX, HOME_MAP, MORGANS_MAP, SAM_MAP, TOM_MAP, USER, db, del, freshStore, get, post, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const CHARLIE = 'trav-morgan-charlie';
const choice = (fields = {}) => ({ toMapId: HOME_MAP, travellerId: CHARLIE, tripIds: ['trip-morgans-spain'], momentIds: ['moment-morgans-churros'], ...fields });
const ask = (fields) => post(`/api/maps/${MORGANS_MAP}/travel-copies`, choice(fields));
const coOwnMorgans = () => (db().mapMembers.find((m) => m.mapId === MORGANS_MAP && m.userId === USER).role = 'CO_OWNER');

describe('choosing what to take', () => {
  it('lists the family map’s travellers, and what one of them can take', async () => {
    const none = await get(`/api/maps/${MORGANS_MAP}/travel-copy-choices`);
    expect(none.data.travellers).toEqual([
      { id: 'trav-morgan-alex', name: 'Alex', mine: false, taken: true },
      { id: CHARLIE, name: 'Charlie', mine: false, taken: false },
      { id: 'trav-morgan-nora', name: 'Nora', mine: false, taken: false },
    ]);
    expect(none.data).toMatchObject({ travellerId: null, trips: [], moments: [], countries: [] });
    const charlie = await get(`/api/maps/${MORGANS_MAP}/travel-copy-choices`, { traveller: CHARLIE });
    expect(charlie.data.trips.map((t) => t.id)).toEqual(['trip-morgans-spain']);
    expect((await get(`/api/maps/${TOM_MAP}/travel-copy-choices`)).status).toBe(404);
    signOut();
    expect((await get(`/api/maps/${MORGANS_MAP}/travel-copy-choices`)).status).toBe(401);
  });

  it('previews how much fits on the new map', async () => {
    const { data } = await post(`/api/maps/${MORGANS_MAP}/travel-copies/preview`, choice());
    expect(data).toMatchObject({ photos: 2, alreadyCopied: 0, fits: 2, trips: 1, moments: 1, locked: false });
    expect(data.countries).toEqual([{ countryCode: 'ES', photos: 2, room: expect.any(Number), fits: 2 }]);
  });

  it('refuses a map, traveller or choice that won’t do', async () => {
    const preview = (fields, mapId = MORGANS_MAP) => post(`/api/maps/${mapId}/travel-copies/preview`, choice(fields));
    expect((await preview({}, TOM_MAP)).status).toBe(404);
    expect((await preview({ toMapId: 'map-nope' })).status).toBe(404);
    expect((await preview({ toMapId: SAM_MAP })).status).toBe(403);
    expect((await preview({ travellerId: 'trav-morgan-alex' })).message).toBe(COPY_MESSAGES.copyTravellerTaken);
    expect((await preview({ travellerId: 'trav-test' })).message).toBe(COPY_MESSAGES.copyTravellerNotFound);
    expect((await preview({ tripIds: ['trip-italy'] })).message).toBe(COPY_MESSAGES.invalidCopyChoice);
    expect((await preview({ tripIds: [], momentIds: [], photoIds: ['photo-morgans-hidden'] })).message).toBe(COPY_MESSAGES.invalidCopyChoice);
    expect((await preview({ tripIds: [], momentIds: [] })).message).toBe(COPY_MESSAGES.emptyCopyChoice);
    coOwnMorgans();
    expect((await preview({ toMapId: MORGANS_MAP })).message).toBe(COPY_MESSAGES.copyToSameMap);
  });
});

describe('asking for a copy', () => {
  it('asks once per map and traveller, until answered', async () => {
    const { status, data } = await ask();
    expect(status).toBe(201);
    expect(data.request).toMatchObject({ status: 'PENDING', trips: 1, moments: 1, photos: 2, mine: true, canCancel: true, canDecide: false });
    expect((await ask()).message).toBe(COPY_MESSAGES.copyAlreadyWaiting);
  });

  it('asks at most 20 times a day', async () => {
    db().travelCopyAsks = Array.from({ length: 20 }, () => ({ userId: USER, at: Date.now() }));
    expect((await ask()).status).toBe(429);
  });

  it('won’t copy onto a locked map', async () => {
    db().subscriptions = [];
    for (const id of ['a', 'b', 'c']) db().maps.push({ id, name: id, ownerId: USER, isDefault: false, createdAt: new Date(Date.now() - 1000).toISOString() });
    expect((await ask({ toMapId: 'c' })).status).toBe(403);
  });

  it('lists the requests on a map for its owner, and nothing for a viewer', async () => {
    const { data } = await ask();
    expect((await get(`/api/maps/${HOME_MAP}/travel-copies`)).data.outgoing.map((r) => r.id)).toEqual([data.request.id]);
    expect((await get(`/api/maps/${MORGANS_MAP}/travel-copies`)).data).toEqual({ incoming: [], outgoing: [] });
    expect((await get(`/api/maps/${TOM_MAP}/travel-copies`)).status).toBe(404);
    const one = await get(`/api/travel-copies/${data.request.id}`);
    expect(one.data.request.tripList.map((t) => t.title)).toEqual(['Spain at Easter']);
    expect((await get('/api/travel-copies/nope')).status).toBe(404);
  });
});

describe('answering a request', () => {
  it('lets the family map’s owner or a co-owner approve, copying everything at once', async () => {
    const { data } = await ask();
    expect((await post(`/api/travel-copies/${data.request.id}/approve`)).status).toBe(403);
    coOwnMorgans();
    const approved = await post(`/api/travel-copies/${data.request.id}/approve`);
    expect(approved.data.request).toMatchObject({ status: 'DONE', progress: { done: 2, copied: 2, skipped: 0 } });
    expect(db().trips.some((t) => t.mapId === HOME_MAP && t.copiedFromId === 'trip-morgans-spain')).toBe(true);
    expect(db().photos.some((p) => p.mapId === HOME_MAP && p.copiedFromId === 'photo-morgans-hidden')).toBe(false);
    expect((await post(`/api/travel-copies/${data.request.id}/approve`)).status).toBe(409);
    expect((await post(`/api/travel-copies/${data.request.id}/continue`)).data.request.status).toBe('DONE');
  });

  it('declines one, which can’t then be withdrawn', async () => {
    const { data } = await ask();
    coOwnMorgans();
    expect((await post(`/api/travel-copies/${data.request.id}/decline`)).data.request.status).toBe('DECLINED');
    expect((await post(`/api/travel-copies/${data.request.id}/decline`)).status).toBe(409);
    expect((await del(`/api/travel-copies/${data.request.id}`)).message).toBe(COPY_MESSAGES.copyNotWaiting);
  });

  it('lets only the person asking withdraw a waiting request', async () => {
    const { data } = await ask();
    expect((await del(`/api/travel-copies/${data.request.id}`)).body).toEqual({ status: 'success', message: COPY_MESSAGES.copyRequestWithdrawn });
    expect(db().travelCopyRequests).toEqual([]);
    const theirs = await ask();
    db().travelCopyRequests[0].requestedById = ALEX;
    expect((await del(`/api/travel-copies/${theirs.data.request.id}`)).status).toBe(403);
  });

  it('hides a request from anyone it isn’t for', async () => {
    const { data } = await ask();
    db().travelCopyRequests[0].requestedById = ALEX;
    db().travelCopyRequests[0].toMapId = SAM_MAP;
    expect((await get(`/api/travel-copies/${data.request.id}`)).status).toBe(404);
  });
});
