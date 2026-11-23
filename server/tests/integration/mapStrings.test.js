// Strings between places (docs/API.md "Strings"): editors tie red thread between two places,
// or add the ones the map's trips and first visits suggest; everyone who can see the map,
// a share link too, sees them.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('strings between places', () => {
  let owner;
  let viewer;
  let editor;
  let stranger;
  let unverified;
  let map;
  const path = (suffix = '') => `/api/maps/${map.id}/strings${suffix}`;
  const stringsOf = async (who) => data(await who.agent.get(`/api/maps/${map.id}`)).map.strings;

  beforeAll(async () => {
    [owner, viewer, editor, stranger] = await Promise.all([signUp('StringOwner'), signUp('StringViewer'), signUp('StringEditor'), signUp('StringStranger')]);
    unverified = await signUp('StringUnverified', { verified: false });
    map = await defaultMapOf(owner.agent);
    for (const [who, role] of [
      [viewer, 'VIEWER'],
      [editor, 'EDITOR'],
      [unverified, 'EDITOR'],
    ]) {
      expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: who.email, role })).status).toBe(201);
    }
  });

  it('ties a string between two places, in code order, and everyone on the map sees it', async () => {
    expect(await stringsOf(owner)).toEqual([]);
    const res = await owner.agent.post(path()).send({ from: 'jp', to: 'FR' });
    expect(res.status).toBe(201);
    const { string } = data(res);
    expect(string).toEqual({ id: expect.any(String), from: 'FR', to: 'JP' });
    expect(await stringsOf(owner)).toEqual([string]);
    expect(await stringsOf(viewer)).toEqual([string]);
  });

  it('gives back the string already tied, either way round, instead of a second', async () => {
    const [first] = await stringsOf(owner);
    const again = await editor.agent.post(path()).send({ from: 'JP', to: 'FR' });
    expect(again.status).toBe(200);
    expect(data(again).string).toEqual(first);
    expect(await prisma.mapString.count({ where: { mapId: map.id } })).toBe(1);
  });

  it('refuses one place twice, a code that isn’t a place, and a body that isn’t two codes', async () => {
    for (const body of [{ from: 'FR', to: 'FR' }, { from: 'FR', to: 'ZZ' }, { from: 'FR' }, { from: 'FRANCE', to: 'JP' }]) {
      expect((await owner.agent.post(path()).send(body)).status).toBe(400);
    }
    expect(data(await owner.agent.post(path()).send({ from: 'FR', to: 'FR' }))).toBeUndefined();
  });

  it('places a UK nation as the map does', async () => {
    await prisma.travelMap.update({ where: { id: map.id }, data: { splitUk: false } });
    const res = await owner.agent.post(path()).send({ from: 'XC', to: 'IE' });
    expect(data(res).string).toMatchObject({ from: 'GB', to: 'IE' });
    // England and Scotland are both the UK there
    expect((await owner.agent.post(path()).send({ from: 'XE', to: 'XC' })).status).toBe(400);
    await prisma.travelMap.update({ where: { id: map.id }, data: { splitUk: true } });
    expect(data(await owner.agent.post(path()).send({ from: 'XC', to: 'IE' })).string).toMatchObject({ from: 'IE', to: 'XC' });
  });

  it('is for editors with a verified email; anyone else gets 403 or 404', async () => {
    expect((await viewer.agent.post(path()).send({ from: 'FR', to: 'DE' })).status).toBe(403);
    expect((await stranger.agent.post(path()).send({ from: 'FR', to: 'DE' })).status).toBe(404);
    expect((await unverified.agent.post(path()).send({ from: 'FR', to: 'DE' })).status).toBe(403);
    expect((await anon().post(path()).send({ from: 'FR', to: 'DE' })).status).toBe(401);
    const [one] = await stringsOf(owner);
    expect((await viewer.agent.delete(path(`/${one.id}`))).status).toBe(403);
    expect((await stranger.agent.delete(path())).status).toBe(404);
    expect((await viewer.agent.post(path('/auto'))).status).toBe(403);
  });

  it('unties one, and a string that isn’t the map’s is a 404', async () => {
    const before = await stringsOf(owner);
    const res = await editor.agent.delete(path(`/${before[0].id}`));
    expect(data(res)).toEqual({ removed: before[0].id });
    expect((await stringsOf(owner)).map((s) => s.id)).not.toContain(before[0].id);
    expect((await owner.agent.delete(path(`/${before[0].id}`))).status).toBe(404);
    expect((await owner.agent.delete(path('/not-an-id'))).status).toBe(404);
  });

  it('adds the strings the trips and first visits suggest, keeping the ones tied', async () => {
    await owner.agent.delete(path());
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Grand tour', startDate: '2019-06-01', endDate: '2019-06-20' })).trip;
    for (const countryCode of ['FR', 'IT', 'GR']) {
      expect((await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode })).status).toBe(201);
    }
    expect((await owner.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' })).status).toBe(200);
    // Two countries no trip reached, in the order first visited
    for (const [code, firstVisitedOn] of [
      ['BR', '2015-01-01'],
      ['JP', '2010-03-01'],
    ]) {
      await prisma.countryVisit.upsert({
        where: { mapId_countryCode: { mapId: map.id, countryCode: code } },
        create: { mapId: map.id, countryCode: code, status: 'VISITED', firstVisitedOn: new Date(firstVisitedOn) },
        update: { status: 'VISITED', firstVisitedOn: new Date(firstVisitedOn) },
      });
    }
    // One tied by hand already, which stays
    await owner.agent.post(path()).send({ from: 'FR', to: 'IT' });

    const res = await owner.agent.post(path('/auto'));
    expect(res.status).toBe(200);
    const body = data(res);
    const pairs = body.strings.map((s) => `${s.from}-${s.to}`);
    expect(pairs).toEqual(expect.arrayContaining(['FR-IT', 'GR-IT', 'BR-JP']));
    expect(body.full).toBe(false);
    // FR-IT was already there; the rest are new (and any birthplace the map started with)
    expect(body.added).toBe(pairs.length - 1);
    // Again adds nothing
    expect(data(await owner.agent.post(path('/auto'))).added).toBe(0);
  });

  it('shows the strings through a share link, and in "Download my data"', async () => {
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const shared = data(await anon().get(`/api/shared/${shareCode}`));
    expect(shared.map.strings).toEqual(await stringsOf(owner));
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map;
    expect(exported.strings.map((s) => `${s.from}-${s.to}`)).toEqual(expect.arrayContaining(['FR-IT', 'BR-JP']));
    expect(exported.strings[0]).toEqual({ from: expect.any(String), to: expect.any(String), since: expect.any(String) });
  });

  it('holds 500 a map: past that a tie is a 409, and the automatic ones add what fits', async () => {
    await owner.agent.delete(path());
    // 500 strings straight into the table: every pair of the first 32 places
    const codes = (await prisma.country.findMany({ where: { kind: 'COUNTRY' }, select: { code: true }, orderBy: { code: 'asc' }, take: 40 })).map((c) => c.code);
    const rows = [];
    for (let i = 0; i < codes.length && rows.length < 500; i += 1) {
      for (let j = i + 1; j < codes.length && rows.length < 500; j += 1) rows.push({ mapId: map.id, fromCode: codes[i], toCode: codes[j] });
    }
    await prisma.mapString.createMany({ data: rows });
    const unused = await prisma.country.findMany({ where: { kind: 'COUNTRY', code: { notIn: codes } }, select: { code: true }, take: 2 });
    const res = await owner.agent.post(path()).send({ from: unused[0].code, to: unused[1].code });
    expect(res.status).toBe(409);
    const auto = data(await owner.agent.post(path('/auto')));
    expect(auto).toMatchObject({ added: 0, full: true });
    expect(await prisma.mapString.count({ where: { mapId: map.id } })).toBe(500);
  });

  it('unties every string at once', async () => {
    const res = await editor.agent.delete(path());
    expect(data(res)).toEqual({ removed: 500 });
    expect(await stringsOf(owner)).toEqual([]);
  });

  it('goes with its map', async () => {
    await owner.agent.post(path()).send({ from: 'FR', to: 'JP' });
    const other = data(await owner.agent.post('/api/maps').send({ name: 'Strings to go', groupType: 'SOLO', travellers: [{ name: 'Me' }] })).map;
    await owner.agent.post(`/api/maps/${other.id}/strings`).send({ from: 'FR', to: 'JP' });
    expect(await prisma.mapString.count({ where: { mapId: other.id } })).toBe(1);
    expect((await owner.agent.delete(`/api/maps/${other.id}`)).status).toBe(200);
    expect(await prisma.mapString.count({ where: { mapId: other.id } })).toBe(0);
  });
});
