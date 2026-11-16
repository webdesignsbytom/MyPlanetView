// The UK's four nations (docs/API.md "The UK's nations"): a map that splits the UK keeps
// and counts England, Scotland, Wales and Northern Ireland; turning it on or off moves the
// map's UK data (services/travel/ukNations.js).
import { afterAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const EDINBURGH = { latitude: 55.9533, longitude: -3.1883 };
const CARDIFF = { latitude: 51.4816, longitude: -3.1791 };

const mapOf = async (agent, mapId) => data(await agent.get(`/api/maps/${mapId}`)).map;
const visitsOf = async (agent, mapId) =>
  Object.fromEntries((await mapOf(agent, mapId)).visits.map((v) => [v.countryCode, { status: v.status, source: v.source, notes: v.notes ?? null }]));
const split = async (agent, mapId, splitUk) => {
  const res = await agent.patch(`/api/maps/${mapId}`).send({ splitUk });
  expect(res.status).toBe(200);
  return data(res).map;
};

describe('the UK’s nations', () => {
  it('lets only the owner split a map, with a true or false', async () => {
    const owner = await signUp('SplitOwner');
    const editor = await signUp('SplitEditor');
    const map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' })).status).toBe(201);

    expect((await mapOf(owner.agent, map.id)).splitUk).toBe(false);
    expect((await editor.agent.patch(`/api/maps/${map.id}`).send({ splitUk: true })).status).toBe(403);
    expect((await owner.agent.patch(`/api/maps/${map.id}`).send({ splitUk: 'yes' })).status).toBe(400);
    expect((await split(owner.agent, map.id, true)).splitUk).toBe(true);
    // Everyone on the map sees it split
    expect((await mapOf(editor.agent, map.id)).splitUk).toBe(true);
  });

  it('keeps the nations off a map that doesn’t split the UK', async () => {
    const owner = await signUp('NoSplit');
    const map = await defaultMapOf(owner.agent);
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/XC`).send({ status: 'VISITED' })).status).toBe(404);
    expect(data(await uploadPhoto(owner.agent, map.id, { ...EDINBURGH })).photo.countryCode).toBe('GB');
    // A nation chosen for a photo is the UK here
    expect(data(await uploadPhoto(owner.agent, map.id, { countryCode: 'XW' })).photo.countryCode).toBe('GB');
  });

  it('puts a photo in its nation, and counts the nations one each, on a map that splits the UK', async () => {
    const owner = await signUp('SplitPhotos');
    const map = await defaultMapOf(owner.agent);
    await split(owner.agent, map.id, true);

    expect(data(await uploadPhoto(owner.agent, map.id, { ...EDINBURGH })).photo.countryCode).toBe('XC');
    expect(data(await uploadPhoto(owner.agent, map.id, { ...CARDIFF })).photo.countryCode).toBe('XW');
    expect(await visitsOf(owner.agent, map.id)).toEqual({
      XC: { status: 'VISITED', source: 'PHOTO', notes: null },
      XW: { status: 'VISITED', source: 'PHOTO', notes: null },
    });
    expect((await mapOf(owner.agent, map.id)).stats.countries).toBe(2);
  });

  it('moves the UK’s located photos to their nations when the split is turned on, and leaves the rest to be placed', async () => {
    const owner = await signUp('SplitOn');
    const map = await defaultMapOf(owner.agent);
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/GB`).send({ status: 'LIVED' })).status).toBe(200);
    const cardiff = data(await uploadPhoto(owner.agent, map.id, { ...CARDIFF, caption: 'Cardiff' })).photo;
    const somewhere = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'GB', caption: 'Somewhere in the UK' })).photo;
    expect([cardiff.countryCode, somewhere.countryCode]).toEqual(['GB', 'GB']);

    await split(owner.agent, map.id, true);
    const placed = Object.fromEntries(
      (await prisma.photo.findMany({ where: { mapId: map.id }, select: { caption: true, countryCode: true } })).map((p) => [p.caption, p.countryCode])
    );
    expect(placed).toEqual({ Cardiff: 'XW', 'Somewhere in the UK': 'GB' });
    // Wales from its photo; the UK marked by hand stays, for its nations to be chosen
    expect(await visitsOf(owner.agent, map.id)).toEqual({
      GB: { status: 'LIVED', source: 'MANUAL', notes: null },
      XW: { status: 'VISITED', source: 'PHOTO', notes: null },
    });
    // The photo with no nation is with the unplaced ones; the UK counts as Wales only
    const unplaced = data(await owner.agent.get(`/api/maps/${map.id}/photos?unplaced=1`)).photos;
    expect(unplaced.map((p) => p.caption)).toEqual(['Somewhere in the UK']);
    expect((await mapOf(owner.agent, map.id)).stats.countries).toBe(1);
  });

  it('merges the nations into the UK when the split is turned off, and puts them back when it’s turned on again', async () => {
    const owner = await signUp('SplitOff');
    const map = await defaultMapOf(owner.agent);
    await split(owner.agent, map.id, true);
    await uploadPhoto(owner.agent, map.id, { ...EDINBURGH, caption: 'Edinburgh' });
    // Placed by hand with no location: remembered across the round trip
    await uploadPhoto(owner.agent, map.id, { countryCode: 'XE', caption: 'London, no GPS' });
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/XE`).send({ status: 'LIVED', notes: 'Our flat' })).status).toBe(200);

    await split(owner.agent, map.id, false);
    expect(await visitsOf(owner.agent, map.id)).toEqual({ GB: { status: 'LIVED', source: 'MANUAL', notes: 'England: Our flat' } });
    const merged = await prisma.photo.findMany({ where: { mapId: map.id }, select: { caption: true, countryCode: true, ukNation: true }, orderBy: { caption: 'asc' } });
    expect(merged).toEqual([
      { caption: 'Edinburgh', countryCode: 'GB', ukNation: 'XC' },
      { caption: 'London, no GPS', countryCode: 'GB', ukNation: 'XE' },
    ]);

    await split(owner.agent, map.id, true);
    expect(await visitsOf(owner.agent, map.id)).toEqual({
      XC: { status: 'VISITED', source: 'PHOTO', notes: null },
      XE: { status: 'LIVED', source: 'MANUAL', notes: 'Our flat' },
    });
    const back = await prisma.photo.findMany({ where: { mapId: map.id }, select: { caption: true, countryCode: true, ukNation: true }, orderBy: { caption: 'asc' } });
    expect(back).toEqual([
      { caption: 'Edinburgh', countryCode: 'XC', ukNation: null },
      { caption: 'London, no GPS', countryCode: 'XE', ukNation: null },
    ]);
  });

  it('gives each UK landmark its nation', async () => {
    const landmarks = data(await anon().get('/api/landmarks?country=GB')).landmarks;
    expect(landmarks.length).toBeGreaterThan(20);
    expect(landmarks.every((l) => ['XE', 'XC', 'XW', 'XI'].includes(l.nation))).toBe(true);
    const nationOf = (part) => landmarks.find((l) => l.name.includes(part))?.nation;
    expect(nationOf('Stonehenge')).toBe('XE');
    expect(nationOf('Edinburgh')).toBe('XC');
    expect(nationOf('Pontcysyllte')).toBe('XW');
    expect(nationOf('Giant')).toBe('XI');
  });
});
