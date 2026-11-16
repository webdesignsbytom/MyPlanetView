// Moments (docs/API.md "Moments"): life events and notes on a map, with the same access
// rules as photos. Editors write any; a trip-only editor only those of their trip, with
// that trip's photos; viewers and share links read them, never hidden ones; dates to the
// day, month or year; date order with undated notes last, paged by cursor.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const MOMENT_KEYS = [
  'countryCode',
  'createdAt',
  'datePrecision',
  'happenedOn',
  'hidden',
  'id',
  'kind',
  'landmark',
  'photos',
  'placeName',
  'spot',
  'text',
  'title',
  'travellerIds',
  'tripId',
];
const MISSING = '00000000-0000-4000-8000-000000000000';

describe('moments', () => {
  let owner;
  let editor;
  let viewer;
  let tripEd;
  let tripViewer;
  let stranger;
  let map;
  let trip;
  let otherTrip;
  let travellers;
  let eiffel;
  let colosseum;
  let photos;
  let foreignPhoto;
  let wedding;

  const create = (who, body) => who.agent.post(`/api/maps/${map.id}/moments`).send(body);
  const listFor = async (agent, url) => data(await agent.get(url)).moments;
  const base = { kind: 'SAW_OR_DID', title: 'We saw a volcano', countryCode: 'IT' };

  beforeAll(async () => {
    [owner, editor, viewer, tripEd, tripViewer, stranger] = await Promise.all(
      ['MomentOwner', 'MomentEditor', 'MomentViewer', 'MomentTripEditor', 'MomentTripViewer', 'MomentStranger'].map((n) => signUp(n))
    );
    map = await defaultMapOf(owner.agent);
    await owner.agent.patch(`/api/maps/${map.id}`).send({ groupType: 'COUPLE' });
    await owner.agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Partner' });
    travellers = data(await owner.agent.get(`/api/maps/${map.id}`)).map.travellers;

    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Paris' })).trip;
    otherTrip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Rome' })).trip;
    for (const [who, resource, role] of [
      [editor, `maps/${map.id}`, 'EDITOR'],
      [viewer, `maps/${map.id}`, 'VIEWER'],
      [tripEd, `trips/${trip.id}`, 'EDITOR'],
      [tripViewer, `trips/${trip.id}`, 'VIEWER'],
    ]) {
      expect((await owner.agent.post(`/api/${resource}/members`).send({ email: who.email, role })).status).toBe(201);
    }

    const upload = async (opts) => data(await uploadPhoto(owner.agent, map.id, opts)).photo;
    photos = {
      onTrip: await upload({ tripId: trip.id, countryCode: 'FR' }),
      onTripHidden: await upload({ tripId: trip.id, countryCode: 'FR' }),
      off: await upload({ countryCode: 'IT' }),
      offHidden: await upload({ countryCode: 'IT' }),
    };
    for (const p of [photos.onTripHidden, photos.offHidden]) {
      expect((await owner.agent.patch(`/api/photos/${p.id}`).send({ hidden: true })).status).toBe(200);
    }
    const strangerMap = await defaultMapOf(stranger.agent);
    foreignPhoto = data(await uploadPhoto(stranger.agent, strangerMap.id, { countryCode: 'FR' })).photo;

    eiffel = data(await owner.agent.get('/api/landmarks?country=FR')).landmarks.find((l) => l.name === 'Eiffel Tower');
    colosseum = data(await owner.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum');
  });

  it('lets the owner add a moment with a place, people and photos, and no coordinates', async () => {
    const res = await create(owner, {
      kind: 'WEDDING',
      title: '<i>We got married</i>',
      text: 'At the tower, at sunset',
      happenedOn: '2019-06-14',
      countryCode: 'FR',
      landmarkId: eiffel.id,
      placeName: 'Paris',
      travellerIds: travellers.map((t) => t.id),
      photoIds: [photos.off.id, photos.onTrip.id],
    });
    expect(res.status).toBe(201);
    wedding = data(res).moment;
    expect(Object.keys(wedding).sort()).toEqual(MOMENT_KEYS);
    expect(wedding).toMatchObject({
      kind: 'WEDDING',
      title: 'We got married',
      text: 'At the tower, at sunset',
      happenedOn: '2019-06-14',
      datePrecision: 'DAY',
      countryCode: 'FR',
      landmark: { id: eiffel.id, name: 'Eiffel Tower' },
      placeName: 'Paris',
      tripId: null,
      travellerIds: travellers.map((t) => t.id),
      hidden: false,
    });
    expect(wedding.photos.map((p) => p.id)).toEqual([photos.off.id, photos.onTrip.id]);
    expect(wedding.photos[0].thumbUrl).toContain('X-Amz-Signature=');
    expect(JSON.stringify(wedding)).not.toMatch(/latitude|longitude/);
  });

  it('refuses bad input, and writes nothing', async () => {
    const before = await prisma.moment.count({ where: { mapId: map.id } });
    const cases = [
      [{ ...base, kind: 'DIVORCE' }, 'Choose what kind of moment it is from the list.'],
      [{ ...base, kind: undefined }, 'Choose what kind of moment it is from the list.'],
      [{ ...base, title: undefined }, 'Give the moment a title of 1 to 120 characters.'],
      [{ ...base, title: '<b></b>' }, 'Give the moment a title of 1 to 120 characters.'],
      [{ ...base, title: 5 }, 'Give the moment a title of 1 to 120 characters.'],
      [{ ...base, text: 42 }, "A moment's title, story and place name must be text."],
      [{ ...base, placeName: ['Rome'] }, "A moment's title, story and place name must be text."],
      [{ ...base, countryCode: undefined }, "That country isn't on the map."],
      [{ ...base, countryCode: 'ZZ' }, "That country isn't on the map."],
      [{ ...base, landmarkId: eiffel.id }, "That landmark isn't in the moment's country."],
      [{ ...base, landmarkId: MISSING }, "That landmark doesn't exist."],
      [{ ...base, travellerIds: [MISSING] }, "Every traveller must be one of this map's travellers."],
      [{ ...base, travellerIds: 'all' }, "Every traveller must be one of this map's travellers."],
      [{ ...base, photoIds: [foreignPhoto.id] }, 'Choose up to 20 photos, each from this map.'],
      [{ ...base, photoIds: [photos.off.id, photos.off.id] }, 'Choose up to 20 photos, each from this map.'],
      [{ ...base, photoIds: Array.from({ length: 21 }, () => photos.off.id) }, 'Choose up to 20 photos, each from this map.'],
      [{ ...base, photoIds: ['not-a-photo'] }, 'Choose up to 20 photos, each from this map.'],
      [{ ...base, hidden: 'yes' }, 'Data incorrectly formatted or malformed request'],
    ];
    for (const [body, message] of cases) {
      const res = await create(owner, body);
      expect(res.status, JSON.stringify(body).slice(0, 80)).toBe(400);
      expect(res.body.message).toBe(message);
    }
    expect(await prisma.moment.count({ where: { mapId: map.id } })).toBe(before);
  });

  it('checks dates: a day, a month or a year, stored as its first day, or none', async () => {
    const bad = [
      { happenedOn: '2019-02-31' },
      { happenedOn: '2019', datePrecision: 'DAY' },
      { happenedOn: '2019-06', datePrecision: 'DAY' },
      { datePrecision: 'YEAR' },
      { happenedOn: null, datePrecision: 'YEAR' },
      { happenedOn: '1700' },
      { happenedOn: '14/06/2019' },
      { happenedOn: '2019', datePrecision: 'DECADE' },
    ];
    for (const date of bad) {
      const res = await create(owner, { ...base, ...date });
      expect(res.status, JSON.stringify(date)).toBe(400);
      expect(res.body.message).toMatch(/^A moment's date is a year \(2019\)/);
    }

    const asYear = data(await create(owner, { ...base, happenedOn: '2015-08-20', datePrecision: 'YEAR' })).moment;
    expect(asYear).toMatchObject({ happenedOn: '2015-01-01', datePrecision: 'YEAR' });
    const url = `/api/moments/${asYear.id}`;
    expect(data(await owner.agent.patch(url).send({ happenedOn: '2016-03' })).moment).toMatchObject({ happenedOn: '2016-03-01', datePrecision: 'MONTH' });
    expect((await owner.agent.patch(url).send({ datePrecision: 'YEAR' })).status).toBe(400);
    expect(data(await owner.agent.patch(url).send({ happenedOn: null })).moment).toMatchObject({ happenedOn: null, datePrecision: null });
    const undated = data(await create(owner, base)).moment;
    expect(undated).toMatchObject({ happenedOn: null, datePrecision: null });
    for (const id of [asYear.id, undated.id]) expect((await owner.agent.delete(`/api/moments/${id}`)).status).toBe(200);

    // The database holds the rule too
    await expect(
      prisma.moment.create({ data: { mapId: map.id, kind: 'BORN', title: 'x', countryCode: 'FR', happenedOn: new Date('2019-01-01') } })
    ).rejects.toThrow();
    await expect(
      prisma.moment.create({ data: { mapId: map.id, kind: 'BORN', title: 'x', countryCode: 'FR', datePrecision: 'DAY' } })
    ).rejects.toThrow();
  });

  it('cuts a long title, story and place to their limits', async () => {
    const res = await create(owner, { ...base, title: 't'.repeat(200), text: 's'.repeat(2500), placeName: 'p'.repeat(200) });
    expect(res.status).toBe(201);
    const moment = data(res).moment;
    expect([moment.title.length, moment.text.length, moment.placeName.length]).toEqual([120, 2000, 120]);
    await owner.agent.delete(`/api/moments/${moment.id}`);
  });

  it("lets a map editor change and delete anyone's moments", async () => {
    const mine = data(await create(editor, { ...base, title: 'Pizza in Naples' })).moment;
    const changed = await editor.agent.patch(`/api/moments/${wedding.id}`).send({ placeName: 'Champ de Mars', travellerIds: [travellers[0].id] });
    expect(changed.status).toBe(200);
    expect(data(changed).moment).toMatchObject({ placeName: 'Champ de Mars', travellerIds: [travellers[0].id], title: 'We got married' });

    // Moving it to Italy needs its landmark to fit, or to go with it
    expect((await editor.agent.patch(`/api/moments/${wedding.id}`).send({ countryCode: 'IT' })).status).toBe(400);
    const moved = await editor.agent.patch(`/api/moments/${wedding.id}`).send({ countryCode: 'IT', landmarkId: colosseum.id });
    expect(data(moved).moment).toMatchObject({ countryCode: 'IT', landmark: { id: colosseum.id, name: 'Colosseum' } });
    await editor.agent.patch(`/api/moments/${wedding.id}`).send({ countryCode: 'FR', landmarkId: eiffel.id });

    expect((await owner.agent.delete(`/api/moments/${mine.id}`)).status).toBe(200);
    expect((await editor.agent.delete(`/api/moments/${mine.id}`)).status).toBe(404);
  });

  it('lets viewers read but not write, strangers see nothing, and needs a verified email to write', async () => {
    expect((await listFor(viewer.agent, `/api/maps/${map.id}/moments`)).map((m) => m.id)).toContain(wedding.id);
    expect((await create(viewer, base)).status).toBe(403);
    expect((await viewer.agent.patch(`/api/moments/${wedding.id}`).send({ title: 'Mine' })).status).toBe(403);
    expect((await viewer.agent.delete(`/api/moments/${wedding.id}`)).status).toBe(403);

    expect((await stranger.agent.get(`/api/maps/${map.id}/moments`)).status).toBe(404);
    expect((await create(stranger, base)).status).toBe(404);
    expect((await stranger.agent.patch(`/api/moments/${wedding.id}`).send({ title: 'Mine' })).status).toBe(404);
    expect((await stranger.agent.delete(`/api/moments/${MISSING}`)).status).toBe(404);
    expect((await anon().get(`/api/maps/${map.id}/moments`)).status).toBe(401);

    await prisma.user.update({ where: { id: editor.user.id }, data: { emailVerified: false } });
    const refused = [await create(editor, base), await editor.agent.patch(`/api/moments/${wedding.id}`).send({ title: 'x' })];
    await prisma.user.update({ where: { id: editor.user.id }, data: { emailVerified: true } });
    for (const res of refused) {
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/verify your email address/i);
    }
  });

  it('keeps hidden moments and hidden photos from viewers', async () => {
    const secret = data(await create(owner, { ...base, title: 'A secret', hidden: true, photoIds: [photos.off.id] })).moment;
    // A visible moment showing a hidden photo
    const mixed = data(await create(owner, { ...base, title: 'Mixed', photoIds: [photos.offHidden.id, photos.off.id] })).moment;

    const forViewer = await listFor(viewer.agent, `/api/maps/${map.id}/moments`);
    expect(forViewer.map((m) => m.id)).not.toContain(secret.id);
    expect(forViewer.every((m) => !('hidden' in m))).toBe(true);
    expect(forViewer.find((m) => m.id === mixed.id).photos.map((p) => p.id)).toEqual([photos.off.id]);
    expect((await viewer.agent.patch(`/api/moments/${secret.id}`).send({ title: 'x' })).status).toBe(404);

    const forEditor = await listFor(editor.agent, `/api/maps/${map.id}/moments`);
    expect(forEditor.find((m) => m.id === secret.id)).toMatchObject({ hidden: true });
    expect(forEditor.find((m) => m.id === mixed.id).photos).toHaveLength(2);

    // The map marks countries with moments: hidden ones count for editors only
    const counts = async (agent) => data(await agent.get(`/api/maps/${map.id}`)).map.momentCountsByCountry;
    expect(await counts(owner.agent)).toEqual({ FR: 1, IT: 2 });
    expect(await counts(viewer.agent)).toEqual({ FR: 1, IT: 1 });

    for (const m of [secret, mixed]) await owner.agent.delete(`/api/moments/${m.id}`);
  });

  describe('a trip-only editor', () => {
    let onTrip;

    it('adds moments only on their trip, with only its photos', async () => {
      expect((await create(tripEd, base)).status).toBe(404);
      expect((await create(tripEd, { ...base, tripId: otherTrip.id })).status).toBe(404);
      expect((await tripEd.agent.get(`/api/maps/${map.id}/moments`)).status).toBe(404);

      const offTrip = await create(tripEd, { ...base, tripId: trip.id, photoIds: [photos.off.id] });
      expect(offTrip.status).toBe(400);
      expect(offTrip.body.message).toBe('You can only choose photos from this trip.');

      const res = await create(tripEd, { ...base, countryCode: 'FR', tripId: trip.id, photoIds: [photos.onTrip.id, photos.onTripHidden.id] });
      expect(res.status).toBe(201);
      expect(data(res).moment).toMatchObject({ tripId: trip.id, hidden: false });
      expect(data(res).moment.photos).toHaveLength(2);
    });

    it("changes the trip's moments, keeping the photos from elsewhere it can't see", async () => {
      // The owner adds one on the trip with a photo from off the trip
      onTrip = data(await create(owner, { ...base, title: 'Louvre', countryCode: 'FR', tripId: trip.id, photoIds: [photos.off.id, photos.onTrip.id] })).moment;

      const seen = (await listFor(tripEd.agent, `/api/trips/${trip.id}/moments`)).find((m) => m.id === onTrip.id);
      expect(seen.photos.map((p) => p.id)).toEqual([photos.onTrip.id]);

      const changed = await tripEd.agent.patch(`/api/moments/${onTrip.id}`).send({ title: 'The Louvre', photoIds: [photos.onTripHidden.id] });
      expect(changed.status).toBe(200);
      expect(data(changed).moment.photos.map((p) => p.id)).toEqual([photos.onTripHidden.id]);
      const forOwner = (await listFor(owner.agent, `/api/maps/${map.id}/moments`)).find((m) => m.id === onTrip.id);
      expect(forOwner).toMatchObject({ title: 'The Louvre' });
      expect(forOwner.photos.map((p) => p.id)).toEqual([photos.onTripHidden.id, photos.off.id]);
    });

    it("can't move a moment off the trip, or touch the map's other moments", async () => {
      for (const tripId of [null, otherTrip.id]) {
        const res = await tripEd.agent.patch(`/api/moments/${onTrip.id}`).send({ tripId });
        expect(res.status).toBe(403);
        expect(res.body.message).toBe("Only the map's owner and its editors can move a moment to another trip.");
      }
      expect((await tripEd.agent.patch(`/api/moments/${wedding.id}`).send({ title: 'x' })).status).toBe(404);
      expect((await tripEd.agent.delete(`/api/moments/${wedding.id}`)).status).toBe(404);
      // A map editor can move it
      const moved = await editor.agent.patch(`/api/moments/${onTrip.id}`).send({ tripId: otherTrip.id });
      expect(data(moved).moment.tripId).toBe(otherTrip.id);
      expect((await editor.agent.patch(`/api/moments/${onTrip.id}`).send({ tripId: MISSING })).status).toBe(400);
      expect((await tripEd.agent.patch(`/api/moments/${onTrip.id}`).send({ title: 'x' })).status).toBe(404);
      await editor.agent.patch(`/api/moments/${onTrip.id}`).send({ tripId: trip.id });
    });

    it("lets a trip-only viewer read the trip's visible moments and photos, nothing more", async () => {
      const hiddenOnTrip = data(await create(owner, { ...base, countryCode: 'FR', title: 'Hidden on trip', tripId: trip.id, hidden: true })).moment;
      const list = await listFor(tripViewer.agent, `/api/trips/${trip.id}/moments`);
      expect(list.map((m) => m.id)).not.toContain(hiddenOnTrip.id);
      expect(list.every((m) => m.tripId === trip.id)).toBe(true);
      const louvre = list.find((m) => m.id === onTrip.id);
      // The trip's hidden photo and the photo from off the trip are both left out
      expect(louvre.photos).toEqual([]);
      expect((await tripViewer.agent.patch(`/api/moments/${onTrip.id}`).send({ title: 'x' })).status).toBe(403);
      expect((await tripEd.agent.delete(`/api/moments/${hiddenOnTrip.id}`)).status).toBe(200);
      expect((await stranger.agent.get(`/api/trips/${trip.id}/moments`)).status).toBe(404);
    });
  });

  it('shows visible moments through share links: the map\'s, or only the trip\'s with its photos', async () => {
    const secret = data(await create(owner, { ...base, title: 'Shh', hidden: true })).moment;
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const mapCode = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;
    const viaMap = await listFor(anon(), `/api/shared/${mapCode}/moments`);
    expect(viaMap.map((m) => m.id)).toContain(wedding.id);
    expect(viaMap.map((m) => m.id)).not.toContain(secret.id);
    expect(viaMap.every((m) => !('hidden' in m))).toBe(true);
    expect(data(await anon().get(`/api/shared/${mapCode}`)).map.momentCountsByCountry).toEqual(
      data(await viewer.agent.get(`/api/maps/${map.id}`)).map.momentCountsByCountry
    );

    await owner.agent.patch(`/api/trips/${trip.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const tripCode = data(await owner.agent.get(`/api/trips/${trip.id}/sharing`)).shareCode;
    const viaTrip = await listFor(anon(), `/api/shared/${tripCode}/moments`);
    expect(viaTrip.length).toBeGreaterThan(0);
    expect(viaTrip.every((m) => m.tripId === trip.id)).toBe(true);
    expect(viaTrip.flatMap((m) => m.photos.map((p) => p.id)).every((id) => id === photos.onTrip.id)).toBe(true);

    expect((await anon().get('/api/shared/NOT-A-CODE/moments')).status).toBe(404);
    await owner.agent.delete(`/api/moments/${secret.id}`);
  });

  it('pins a moment to a spot: editors always see it, viewers and share links only when it’s shared', async () => {
    const SPOT = { latitude: 48.8584, longitude: 2.2945 };
    const res = await create(owner, { ...base, title: 'Picnic under the tower', countryCode: 'FR', spot: SPOT });
    expect(res.status).toBe(201);
    const pinned = data(res).moment;
    // Not shared unless asked
    expect(pinned.spot).toEqual({ ...SPOT, shared: false });

    const mapMoments = `/api/maps/${map.id}/moments`;
    const seen = async (agent, url) => (await listFor(agent, url)).find((m) => m.id === pinned.id);
    const pinsOn = async (agent, url) => data(await agent.get(url)).map.momentSpots.map((spot) => spot.id);
    expect((await seen(editor.agent, mapMoments)).spot).toEqual({ ...SPOT, shared: false });
    expect((await seen(viewer.agent, mapMoments)).spot).toBeNull();
    expect(await pinsOn(owner.agent, `/api/maps/${map.id}`)).toContain(pinned.id);
    expect(await pinsOn(viewer.agent, `/api/maps/${map.id}`)).not.toContain(pinned.id);

    // Shared: everyone the map is shared with sees the exact spot, a share link too
    expect((await owner.agent.patch(`/api/moments/${pinned.id}`).send({ spot: { ...SPOT, shared: true } })).status).toBe(200);
    expect((await seen(viewer.agent, mapMoments)).spot).toEqual(SPOT);
    expect(await pinsOn(viewer.agent, `/api/maps/${map.id}`)).toContain(pinned.id);
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const code = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;
    expect((await seen(anon(), `/api/shared/${code}/moments`)).spot).toEqual(SPOT);
    expect(data(await anon().get(`/api/shared/${code}`)).map.momentSpots.find((spot) => spot.id === pinned.id)).toEqual({
      id: pinned.id,
      kind: 'SAW_OR_DID',
      title: 'Picnic under the tower',
      countryCode: 'FR',
      ...SPOT,
    });

    // A hidden moment's pin never reaches a viewer, shared or not
    await owner.agent.patch(`/api/moments/${pinned.id}`).send({ hidden: true });
    expect(await pinsOn(viewer.agent, `/api/maps/${map.id}`)).not.toContain(pinned.id);
    expect(await pinsOn(owner.agent, `/api/maps/${map.id}`)).toContain(pinned.id);

    // Taken off: nothing kept
    expect(data(await owner.agent.patch(`/api/moments/${pinned.id}`).send({ spot: null })).moment.spot).toBeNull();
    expect(await prisma.moment.findUnique({ where: { id: pinned.id }, select: { latitude: true, longitude: true, spotShared: true } })).toEqual({
      latitude: null,
      longitude: null,
      spotShared: false,
    });
    await owner.agent.delete(`/api/moments/${pinned.id}`);
  });

  it('keeps a pin in the moment’s country', async () => {
    const PARIS = { latitude: 48.8584, longitude: 2.2945 };
    // Paris for an Italian moment, and a spot off the globe
    const wrong = await create(owner, { ...base, spot: PARIS });
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toMatch(/isn't in the moment's country/);
    expect((await create(owner, { ...base, spot: { latitude: 95, longitude: 0 } })).status).toBe(400);
    expect((await create(owner, { ...base, spot: { ...PARIS, shared: 'yes' } })).status).toBe(400);

    // Moving a pinned moment to another country needs its pin moved (or taken off) too
    const rome = data(await create(owner, { ...base, spot: { latitude: 41.8902, longitude: 12.4922 } })).moment;
    expect((await owner.agent.patch(`/api/moments/${rome.id}`).send({ countryCode: 'FR' })).status).toBe(400);
    const moved = await owner.agent.patch(`/api/moments/${rome.id}`).send({ countryCode: 'FR', spot: PARIS });
    expect(moved.status).toBe(200);
    expect(data(moved).moment).toMatchObject({ countryCode: 'FR', spot: { ...PARIS, shared: false } });
    await owner.agent.delete(`/api/moments/${rome.id}`);
  });

  it('lets go of a deleted photo, and of a deleted trip', async () => {
    const moment = data(await create(owner, { ...base, tripId: otherTrip.id, photoIds: [photos.off.id] })).moment;
    expect((await owner.agent.delete(`/api/photos/${photos.off.id}`)).status).toBe(200);
    expect((await owner.agent.delete(`/api/trips/${otherTrip.id}`)).status).toBe(200);
    const after = (await listFor(owner.agent, `/api/maps/${map.id}/moments`)).find((m) => m.id === moment.id);
    expect(after).toMatchObject({ tripId: null, photos: [] });
  });

  it('logs writes without their words', async () => {
    await vi.waitFor(async () => {
      const events = await prisma.appEvent.findMany({ where: { domain: 'moments', actorId: owner.user.id } });
      expect(events.length).toBeGreaterThan(0);
      for (const e of events) expect(`${e.message} ${JSON.stringify(e.metadata)}`).not.toMatch(/married|volcano|Louvre|Paris|sunset/i);
    });
  });
});

describe('the moments list', () => {
  let user;
  let map;
  let trip;
  const ids = {};

  beforeAll(async () => {
    user = await signUp('MomentPager');
    map = await defaultMapOf(user.agent);
    trip = data(await user.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Lisbon' })).trip;
    const add = async (label, body) => {
      const res = await user.agent.post(`/api/maps/${map.id}/moments`).send({ kind: 'SAW_OR_DID', title: label, countryCode: 'PT', ...body });
      expect(res.status).toBe(201);
      ids[label] = data(res).moment.id;
    };
    await add('day', { happenedOn: '2019-06-14' });
    await add('undated1', {});
    await add('year', { happenedOn: '2018' });
    await add('sameDay', { happenedOn: '2019-06-14', tripId: trip.id });
    await add('month', { happenedOn: '2019-06', countryCode: 'ES' });
    await add('undated2', {});
  });

  const expected = () => {
    const byId = (a, b) => (ids[a] < ids[b] ? -1 : 1);
    return ['year', 'month', ...['day', 'sameDay'].sort(byId), ...['undated1', 'undated2'].sort(byId)].map((l) => ids[l]);
  };

  const all = async (query = '', limit = 2, beforePage = null) => {
    const seen = [];
    let cursor = null;
    for (let page = 0; page < 10; page++) {
      if (beforePage) await beforePage(page);
      const qs = new URLSearchParams({ limit: String(limit), ...(cursor ? { cursor } : {}) }).toString();
      const res = await user.agent.get(`/api/maps/${map.id}/moments?${qs}${query}`);
      expect(res.status).toBe(200);
      seen.push(...data(res).moments.map((m) => m.id));
      cursor = data(res).nextCursor;
      if (!cursor) break;
    }
    return seen;
  };

  it('is in date order, oldest first, undated last, page by page', async () => {
    expect(await all()).toEqual(expected());
    expect(await all('', 60)).toEqual(expected());
    const first = data(await user.agent.get(`/api/maps/${map.id}/moments?limit=2`));
    expect(first.moments).toHaveLength(2);
    expect(first.nextCursor).toMatch(/^2019-06-01_/);
  });

  it('filters by country and trip, and refuses bad filters', async () => {
    expect(await all('&country=ES')).toEqual([ids.month]);
    expect(await all(`&tripId=${trip.id}`)).toEqual([ids.sameDay]);
    expect((await all('&country=PT', 60)).length).toBe(5);
    for (const query of ['country=ZZ', 'tripId=nope', 'cursor=nope', `cursor=someday_${ids.day}`]) {
      expect((await user.agent.get(`/api/maps/${map.id}/moments?${query}`)).status, query).toBe(400);
    }
    // limit is kept within 1 to 60
    expect(data(await user.agent.get(`/api/maps/${map.id}/moments?limit=0`)).moments).toHaveLength(1);
    expect(data(await user.agent.get(`/api/maps/${map.id}/moments?limit=500`)).moments).toHaveLength(6);
  });

  it("keeps paging when the page's last moment is deleted meanwhile", async () => {
    const order = expected();
    const res = data(await user.agent.get(`/api/maps/${map.id}/moments?limit=3`));
    expect(res.moments.map((m) => m.id)).toEqual(order.slice(0, 3));
    expect((await user.agent.delete(`/api/moments/${order[2]}`)).status).toBe(200);
    const next = data(await user.agent.get(`/api/maps/${map.id}/moments?limit=3&cursor=${encodeURIComponent(res.nextCursor)}`));
    expect(next.moments.map((m) => m.id)).toEqual(order.slice(3, 6));
    expect(next.nextCursor).toBeNull();
  });
});
