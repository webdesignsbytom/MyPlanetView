// Group trips' "Add to my map" (docs/API.md "Group trips"): anyone on a trip shows it on
// a map they own or edit. Nothing is copied; completing the trip marks its countries on
// every map showing it; taking it off, or leaving the trip, keeps those visits.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const LIMITED_KEYS = ['canOpen', 'countryCodes', 'endDate', 'id', 'linked', 'organiserMapName', 'startDate', 'status', 'title'];

describe('group trips: add to my map', () => {
  let org;
  let friend;
  let pal;
  let partner;
  let stranger;
  let qOwner;
  let orgMap;
  let friendMap;
  let palMap;
  let strangerMap;
  let qMap;
  let trip;
  let tripPhoto;

  const visitsOn = async (agent, mapId) => data(await agent.get(`/api/maps/${mapId}`)).map.visits;
  const codesOn = async (agent, mapId) => (await visitsOn(agent, mapId)).map((v) => v.countryCode).sort();
  const listedOn = async (agent, mapId) => data(await agent.get(`/api/maps/${mapId}/trips`)).trips.find((t) => t.id === trip.id);
  const addTo = (who, mapId) => who.agent.post(`/api/trips/${trip.id}/maps`).send({ mapId });

  beforeAll(async () => {
    [org, friend, pal, partner, stranger, qOwner] = await Promise.all(
      ['Organiser', 'StagFriend', 'StagPal', 'FriendPartner', 'NotOnTrip', 'QOwner'].map((name) => signUp(name))
    );
    [orgMap, friendMap, palMap, strangerMap, qMap] = await Promise.all([org, friend, pal, stranger, qOwner].map((u) => defaultMapOf(u.agent)));

    trip = data(await org.agent.post(`/api/maps/${orgMap.id}/trips`).send({ title: 'Stag do', startDate: '2026-05-01', endDate: '2026-05-04' })).trip;
    for (const countryCode of ['FR', 'IT']) {
      expect((await org.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode })).status).toBe(201);
    }
    for (const [who, role] of [[friend, 'EDITOR'], [pal, 'VIEWER']]) {
      expect((await org.agent.post(`/api/trips/${trip.id}/members`).send({ email: who.email, role })).status).toBe(201);
    }
    // friend's partner edits friend's map, but isn't on the trip; friend edits Q's map
    expect((await friend.agent.post(`/api/maps/${friendMap.id}/members`).send({ email: partner.email, role: 'EDITOR' })).status).toBe(201);
    expect((await qOwner.agent.post(`/api/maps/${qMap.id}/members`).send({ email: friend.email, role: 'EDITOR' })).status).toBe(201);
    // pal can see friend's map, as a viewer only
    expect((await friend.agent.post(`/api/maps/${friendMap.id}/members`).send({ email: pal.email, role: 'VIEWER' })).status).toBe(201);

    tripPhoto = data(await uploadPhoto(friend.agent, orgMap.id, { tripId: trip.id, countryCode: 'FR' })).photo;
    expect(tripPhoto).toBeTruthy();
  });

  it('refuses people not on the trip, the trip\'s own map, and maps the caller can\'t edit', async () => {
    expect((await addTo(stranger, strangerMap.id)).status).toBe(404);
    expect((await addTo(partner, friendMap.id)).status).toBe(404);

    const own = await addTo(friend, orgMap.id);
    expect(own.status).toBe(400);
    expect(own.body.message).toBe('This trip is already on its own map.');
    expect((await addTo(friend, 'not-a-map')).status).toBe(400);
    expect((await friend.agent.post(`/api/trips/${trip.id}/maps`).send({})).status).toBe(400);

    // Someone else's map: unseen is 404, viewed only is 403
    expect((await addTo(friend, strangerMap.id)).status).toBe(404);
    expect((await addTo(pal, friendMap.id)).status).toBe(403);
    expect(await prisma.tripMap.count({ where: { tripId: trip.id } })).toBe(0);
  });

  it('needs a verified email address', async () => {
    await prisma.user.update({ where: { id: friend.user.id }, data: { emailVerified: false } });
    const res = await addTo(friend, friendMap.id);
    await prisma.user.update({ where: { id: friend.user.id }, data: { emailVerified: true } });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/verify your email address/i);
  });

  it('adds it for a trip editor and a trip viewer, once each', async () => {
    const added = await addTo(friend, friendMap.id);
    expect(added.status).toBe(201);
    expect(data(added).trip).toMatchObject({
      id: trip.id,
      onMyMaps: [{ mapId: friendMap.id, name: friendMap.name, canRemove: true }],
      canAddToMyMap: true,
    });
    const again = await addTo(friend, friendMap.id);
    expect(again.status).toBe(200);
    expect(data(again).trip.onMyMaps).toHaveLength(1);

    expect((await addTo(pal, palMap.id)).status).toBe(201);
    // An editor of someone else's map can add it there too
    expect((await addTo(friend, qMap.id)).status).toBe(201);
    expect(await prisma.tripMap.count({ where: { tripId: trip.id } })).toBe(3);

    await vi.waitFor(async () => {
      const event = await prisma.appEvent.findFirst({ where: { actorId: friend.user.id, domain: 'trips', action: 'Map Link Success' } });
      expect(event?.message).toContain(trip.id);
    });
  });

  it('says on the trip which of your maps show it, and whether you have one to add it to', async () => {
    const asFriend = data(await friend.agent.get(`/api/trips/${trip.id}`)).trip;
    expect(asFriend.onMyMaps.map((m) => m.mapId).sort()).toEqual([friendMap.id, qMap.id].sort());
    expect(asFriend.canAddToMyMap).toBe(true);

    // The organiser has only the trip's own map: nothing to add it to
    const asOrg = data(await org.agent.get(`/api/trips/${trip.id}`)).trip;
    expect(asOrg).toMatchObject({ onMyMaps: [], canAddToMyMap: false });

    // The partner edits friend's map but isn't on the trip: it still doesn't open for them
    expect((await partner.agent.get(`/api/trips/${trip.id}`)).status).toBe(404);
  });

  it("lists it in the map's trips: in full for people on the trip, limited for everyone else", async () => {
    const forFriend = await listedOn(friend.agent, friendMap.id);
    expect(forFriend).toMatchObject({
      linked: true,
      canOpen: true,
      organiserMapName: orgMap.name,
      title: 'Stag do',
      status: 'PLANNED',
      startDate: '2026-05-01',
      countryCodes: ['FR', 'IT'],
      stopCount: 2,
      photoCount: 1,
    });

    const forPartner = await listedOn(partner.agent, friendMap.id);
    expect(Object.keys(forPartner).sort()).toEqual(LIMITED_KEYS);
    expect(forPartner).toMatchObject({ linked: true, canOpen: false, organiserMapName: orgMap.name, countryCodes: ['FR', 'IT'] });

    // The organiser's own list marks its trips as its own
    expect(await listedOn(org.agent, orgMap.id)).toMatchObject({ linked: false, canOpen: true, stopCount: 2 });
  });

  it("keeps its photos on the organiser's map, while the trip counts in the map's stats", async () => {
    const photos = data(await friend.agent.get(`/api/maps/${friendMap.id}/photos`)).photos;
    expect(photos.map((p) => p.id)).not.toContain(tripPhoto.id);

    const { stats } = data(await friend.agent.get(`/api/maps/${friendMap.id}/stats`));
    expect(stats).toMatchObject({ trips: 1, photos: 0 });
    const listed = data(await friend.agent.get('/api/maps')).maps.find((m) => m.id === friendMap.id);
    expect(listed.counts).toMatchObject({ trips: 1, photos: 0 });
    // Per-traveller stats come from the map's own trips only
    expect(stats.byTraveller.every((t) => t.countries === 0)).toBe(true);
  });

  it('marks the countries on every map showing it when the trip is completed, and as stops change', async () => {
    expect(await codesOn(friend.agent, friendMap.id)).toEqual([]);
    expect((await friend.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' })).status).toBe(200);

    // The trip's own map (France came first from the trip's photo there)
    expect((await visitsOn(org.agent, orgMap.id)).find((v) => v.countryCode === 'IT')).toMatchObject({ status: 'VISITED', source: 'TRIP' });
    for (const [who, mapId] of [[friend, friendMap.id], [pal, palMap.id], [qOwner, qMap.id]]) {
      const visits = await visitsOn(who.agent, mapId);
      expect(visits.find((v) => v.countryCode === 'FR'), mapId).toMatchObject({ status: 'VISITED', source: 'TRIP' });
      expect(visits.find((v) => v.countryCode === 'IT'), mapId).toMatchObject({ status: 'VISITED', source: 'TRIP' });
    }

    // A stop added to the completed trip, at the South Pole: Antarctica comes with it
    expect((await friend.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'XS' })).status).toBe(201);
    expect(await codesOn(pal.agent, palMap.id)).toEqual(['AQ', 'FR', 'IT', 'XS']);

    // A stop's country changed
    const stops = data(await org.agent.get(`/api/trips/${trip.id}`)).trip.stops;
    const italy = stops.find((s) => s.countryCode === 'IT');
    expect((await org.agent.patch(`/api/trips/${trip.id}/stops/${italy.id}`).send({ countryCode: 'JP' })).status).toBe(200);
    expect(await codesOn(friend.agent, friendMap.id)).toEqual(['AQ', 'FR', 'IT', 'JP', 'XS']);
    // A map that never showed it gets nothing
    expect(await codesOn(stranger.agent, strangerMap.id)).toEqual([]);
  });

  it('marks a completed trip\'s countries at once on a map it is added to', async () => {
    const late = await signUp('LateJoiner');
    const lateMap = await defaultMapOf(late.agent);
    expect((await org.agent.post(`/api/trips/${trip.id}/members`).send({ email: late.email, role: 'VIEWER' })).status).toBe(201);
    expect((await late.agent.post(`/api/trips/${trip.id}/maps`).send({ mapId: lateMap.id })).status).toBe(201);
    const visits = await visitsOn(late.agent, lateMap.id);
    expect(visits.map((v) => v.countryCode).sort()).toEqual(['AQ', 'FR', 'JP', 'XS']);
    expect(visits.every((v) => v.source === 'TRIP')).toBe(true);

    // The organiser removing them takes it off their map; the visits stay
    expect((await org.agent.delete(`/api/trips/${trip.id}/members/${late.user.id}`)).status).toBe(200);
    expect(await prisma.tripMap.count({ where: { tripId: trip.id, mapId: lateMap.id } })).toBe(0);
    expect(await codesOn(late.agent, lateMap.id)).toEqual(['AQ', 'FR', 'JP', 'XS']);
  });

  it('lists it with the limited fields through the map\'s share link, even for someone on the trip', async () => {
    await friend.agent.patch(`/api/maps/${friendMap.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const code = data(await friend.agent.get(`/api/maps/${friendMap.id}/sharing`)).shareCode;
    for (const agent of [anon(), friend.agent]) {
      const listed = data(await agent.get(`/api/shared/${code}`)).trips.find((t) => t.id === trip.id);
      expect(Object.keys(listed).sort()).toEqual(LIMITED_KEYS);
      expect(listed).toMatchObject({ canOpen: false, status: 'COMPLETED' });
    }
    // The map's stats through the link count it as well
    expect(data(await anon().get(`/api/shared/${code}`)).map.stats.trips).toBe(1);
  });

  it('can be taken off by whoever added it, or by the map\'s owner, and the visits stay', async () => {
    // Q's owner isn't on the trip: the trip shows, limited, and they can take it off
    expect(await listedOn(qOwner.agent, qMap.id)).toMatchObject({ canOpen: false });
    // Another editor of the map, who didn't add it, can't; a stranger gets 404
    expect((await partner.agent.delete(`/api/trips/${trip.id}/maps/${friendMap.id}`)).status).toBe(403);
    expect((await stranger.agent.delete(`/api/trips/${trip.id}/maps/${friendMap.id}`)).status).toBe(404);

    expect((await qOwner.agent.delete(`/api/trips/${trip.id}/maps/${qMap.id}`)).status).toBe(200);
    expect(await listedOn(qOwner.agent, qMap.id)).toBeUndefined();
    expect(await codesOn(qOwner.agent, qMap.id)).toEqual(['AQ', 'FR', 'IT', 'JP', 'XS']);

    expect((await friend.agent.delete(`/api/trips/${trip.id}/maps/${friendMap.id}`)).status).toBe(200);
    expect((await friend.agent.delete(`/api/trips/${trip.id}/maps/${friendMap.id}`)).status).toBe(404);
    expect(await listedOn(friend.agent, friendMap.id)).toBeUndefined();
    expect(await codesOn(friend.agent, friendMap.id)).toEqual(['AQ', 'FR', 'IT', 'JP', 'XS']);
    expect(data(await friend.agent.get(`/api/trips/${trip.id}`)).trip.onMyMaps).toEqual([]);
    expect(data(await friend.agent.get(`/api/maps/${friendMap.id}/stats`)).stats.trips).toBe(0);
  });

  it('comes off your maps when you leave the trip; the visits stay', async () => {
    expect(await listedOn(pal.agent, palMap.id)).toMatchObject({ canOpen: true });
    expect((await pal.agent.delete(`/api/trips/${trip.id}/members/${pal.user.id}`)).status).toBe(200);
    expect(await listedOn(pal.agent, palMap.id)).toBeUndefined();
    expect(await codesOn(pal.agent, palMap.id)).toEqual(['AQ', 'FR', 'IT', 'JP', 'XS']);
    expect((await pal.agent.get(`/api/trips/${trip.id}`)).status).toBe(404);
  });

  it('goes with the trip when the trip is deleted', async () => {
    expect((await addTo(friend, friendMap.id)).status).toBe(201);
    expect((await org.agent.delete(`/api/trips/${trip.id}`)).status).toBe(200);
    expect(await prisma.tripMap.count({ where: { tripId: trip.id } })).toBe(0);
    expect(await listedOn(friend.agent, friendMap.id)).toBeUndefined();
  });
});
