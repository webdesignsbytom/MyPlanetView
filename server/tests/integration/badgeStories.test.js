// What earned a badge (docs/API.md "Badges and goals"; 27 Nov 2026, the user's wish): the things
// a badge counts, in the order they happened, and the one that earned it, as the caller may see
// the map, through its link too, and one traveller's from their trips.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('a badge’s story', () => {
  let owner;
  let viewer;
  let stranger;
  let map;
  const story = async (who, key, query = '') => {
    const res = await who.agent.get(`/api/maps/${map.id}/badges/${key}${query}`);
    expect(res.status, key).toBe(200);
    return data(res).story;
  };
  const mark = (code, firstVisitedOn) => owner.agent.put(`/api/maps/${map.id}/visits/${code}`).send({ status: 'VISITED', firstVisitedOn });

  beforeAll(async () => {
    [owner, viewer, stranger] = await Promise.all([signUp('StoryOwner'), signUp('StoryViewer'), signUp('StoryStranger')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    // Out of order on purpose: the story follows the days, as the passport does
    for (const [code, day] of [['NO', '2021-08-01'], ['FR', '2014-06-01'], ['SE', '2019-07-01'], ['DK', '2018-05-01']]) {
      expect((await mark(code, day)).status).toBe(200);
    }
  });

  it('names the countries in the order first visited, and the one that earned it', async () => {
    expect(await story(owner, 'countries-1')).toEqual({
      key: 'countries-1',
      group: 'countries',
      measure: 'countries',
      kind: 'places',
      need: 1,
      have: 1,
      items: [{ code: 'FR', on: '2014-06-01' }],
      earnedWith: 0,
    });
    const scandinavia = await story(owner, 'region-scandinavia');
    expect(scandinavia).toMatchObject({ region: 'scandinavia', need: 3, have: 3, earnedWith: 2 });
    expect(scandinavia.items.map((i) => i.code)).toEqual(['DK', 'SE', 'NO']);
    // Not there yet: what there is, nothing marked
    expect(await story(owner, 'countries-5')).toMatchObject({ need: 5, have: 4, earnedWith: null });
  });

  it('tells a viewer and the map’s link the same, a stranger and an unknown badge nothing', async () => {
    expect((await story(viewer, 'continent-europe')).items).toEqual([{ code: 'FR', on: '2014-06-01' }]);
    expect((await stranger.agent.get(`/api/maps/${map.id}/badges/countries-1`)).status).toBe(404);
    const unknown = await owner.agent.get(`/api/maps/${map.id}/badges/countries-7`);
    expect(unknown.status).toBe(404);
    expect(unknown.body.message).toBe("That badge doesn't exist.");

    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const shared = await anon().get(`/api/shared/${shareCode}/badges/countries-1`);
    expect(shared.status).toBe(200);
    expect(data(shared).story.items).toEqual([{ code: 'FR', on: '2014-06-01' }]);
    expect((await anon().get('/api/shared/ZZZZ-ZZZZ-ZZZZ/badges/countries-1')).status).toBe(404);
  });

  it('names the stamp that earned a landmark badge, with its photo as the passport shows it', async () => {
    const [first] = data(await owner.agent.get('/api/landmarks?country=MT')).landmarks;
    expect((await owner.agent.put(`/api/maps/${map.id}/landmarks/${first.id}/been`)).status).toBe(200);
    const stamp = await story(owner, 'landmarks-1');
    expect(stamp).toMatchObject({ kind: 'stamps', earnedWith: 0 });
    // A tick "been here" has no photo
    expect(stamp.items).toEqual([
      { landmarkId: first.id, name: first.name, code: 'MT', isUnesco: expect.any(Boolean), on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), ticked: true, thumbUrl: null },
    ]);
    expect(await story(owner, 'collect-MT-bronze')).toMatchObject({ place: 'MT', tier: 'bronze', need: 1, earnedWith: 0 });

    // A photo of the Eiffel Tower from 2010, confirmed: the first stamp now, with its photo
    const eiffelId = data(await owner.agent.get('/api/landmarks?country=FR')).landmarks.find((l) => l.name === 'Eiffel Tower').id;
    const uploaded = await uploadPhoto(owner.agent, map.id, { latitude: 48.8583, longitude: 2.29448, takenAt: '2010-05-01T10:00:00.000Z' });
    expect(uploaded.status).toBe(201);
    expect((await owner.agent.patch(`/api/photos/${data(uploaded).photo.id}/landmarks/${eiffelId}`).send({ confirmed: true })).status).toBe(200);
    const now = await story(owner, 'landmarks-1');
    expect(now.items[0]).toMatchObject({ landmarkId: eiffelId, code: 'FR', on: '2010-05-01', ticked: false, thumbUrl: expect.any(String) });
    // Only the one that earned it carries a picture
    const ten = await story(owner, 'landmarks-10');
    expect(ten.earnedWith).toBeNull();
    expect(ten.items.every((item) => item.thumbUrl === undefined)).toBe(true);
  });

  it('lists Life’s One Shots in the order seen', async () => {
    // A first tick answers 201
    expect((await owner.agent.put(`/api/maps/${map.id}/one-shots/leopard`).send({ seenOn: '2024-03-12', countryCode: 'KE' })).status).toBe(201);
    expect((await owner.agent.put(`/api/maps/${map.id}/one-shots/lion`).send({ seenOn: '2019' })).status).toBe(201);
    const animals = await story(owner, 'oneshots-wildlife-10');
    expect(animals.items).toEqual([
      { itemKey: 'lion', code: null, on: '2019-01-01', datePrecision: 'YEAR' },
      { itemKey: 'leopard', code: 'KE', on: '2024-03-12', datePrecision: 'DAY' },
    ]);
    expect(animals).toMatchObject({ have: 2, need: 10, earnedWith: null });
  });

  it('lists the themes entered', async () => {
    const uploaded = await uploadPhoto(owner.agent, map.id, { countryCode: 'FR' });
    expect(uploaded.status, JSON.stringify(uploaded.body)).toBe(201);
    const { photo } = data(uploaded);
    const theme = await prisma.photoTheme.create({ data: { month: new Date('1999-03-01T00:00:00Z'), title: 'Story test doors' } });
    try {
      await prisma.photoThemeEntry.create({ data: { themeId: theme.id, photoId: photo.id, mapId: map.id, enteredById: owner.user.id } });
      const themes = await story(owner, 'themes-3');
      expect(themes).toMatchObject({ kind: 'themes', have: 1, need: 3, earnedWith: null });
      expect(themes.items).toEqual([{ title: 'Story test doors', month: '1999-03-01', on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }]);
    } finally {
      await prisma.photoTheme.delete({ where: { id: theme.id } });
    }
  });

  it('gives a photo badge the photo that reached its count, hidden from viewers when it is hidden', async () => {
    // Two uploaded above; 98 more, put on the map before them (so the newest upload is the 100th),
    // the last of them hidden
    const base = Date.now() - 1000 * 60 * 60;
    await prisma.photo.createMany({
      data: [...Array(98)].map((_, i) => ({
        mapId: map.id,
        uploaderId: owner.user.id,
        width: 10,
        height: 10,
        countryCode: 'FR',
        hidden: i === 97,
        createdAt: new Date(base + (i + 1) * 1000),
      })),
    });
    const upload = await prisma.photo.findFirst({ where: { mapId: map.id }, orderBy: { createdAt: 'desc' } });
    const forOwner = await story(owner, 'photos-100');
    expect(forOwner).toMatchObject({ kind: 'photos', have: 100, items: [], earnedWith: null });
    expect(forOwner.photo).toMatchObject({ id: upload.id, video: false, addedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    // Its thumbnail, signed as every photo link is
    expect(forOwner.photo.thumbUrl).toEqual(expect.any(String));
    // A viewer never sees a hidden photo: 99 of 100
    expect(await story(viewer, 'photos-100')).toMatchObject({ have: 99, photo: null });
  });

  it('tells one traveller’s story from the completed trips they were on', async () => {
    const family = await signUp('StoryFamily');
    const familyMap = await defaultMapOf(family.agent);
    await family.agent.patch(`/api/maps/${familyMap.id}`).send({ groupType: 'FAMILY' });
    const ann = data(await family.agent.post(`/api/maps/${familyMap.id}/travellers`).send({ name: 'Ann' })).traveller;
    const trip = data(await family.agent.post(`/api/maps/${familyMap.id}/trips`).send({ title: 'Lisbon', startDate: '2025-03-01', endDate: '2025-03-08' })).trip;
    await family.agent.put(`/api/trips/${trip.id}/travellers`).send({ travellerIds: [ann.id] });
    await family.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'PT' });
    await family.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' });

    const url = (key, traveller) => `/api/maps/${familyMap.id}/badges/${key}?traveller=${traveller}`;
    const res = await family.agent.get(url('countries-1', ann.id));
    expect(res.status).toBe(200);
    expect(data(res).story).toMatchObject({ earnedWith: 0, items: [{ code: 'PT', on: '2025-03-08', trip: { id: trip.id, title: 'Lisbon' } }] });
    // Travel badges only, for a traveller on this map
    expect((await family.agent.get(url('landmarks-1', ann.id))).status).toBe(404);
    const nobody = await family.agent.get(url('countries-1', '00000000-0000-4000-8000-000000000001'));
    expect(nobody.status).toBe(404);
    expect(nobody.body.message).toBe("That traveller isn't on this map.");
  });
});
