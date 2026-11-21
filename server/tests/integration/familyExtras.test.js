// Family extras (21 Nov 2026, the user's wish): each traveller's own passport, from the
// family map (docs/API.md "Passport"), and anniversaries as moments: the new kinds, a map's
// moments whose day comes round (docs/API.md "Moments") and the "On this day" email, which
// sends a moment's anniversary before any photo (docs/API.md "Emails").
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, sentEmails, signUp, uploadPhoto } from './helpers.js';

const { sendOnThisDayEmails } = await import('../../src/services/memories/onThisDay.js');

afterAll(cleanUp);

describe('a traveller’s own passport', () => {
  let owner;
  let viewer;
  let map;
  let ann;
  let bo;
  let colosseum;
  const passportOf = async (who, travellerId) =>
    who.agent.get(`/api/maps/${map.id}/passport${travellerId ? `?traveller=${travellerId}` : ''}`);
  const codesOf = (passport) => passport.pages.map((p) => p.countryCode).sort();

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('KidPassportOwner'), signUp('KidPassportViewer')]);
    map = await defaultMapOf(owner.agent);
    await owner.agent.patch(`/api/maps/${map.id}`).send({ groupType: 'FAMILY' });
    const add = async (name, birthCountryCode) =>
      data(await owner.agent.post(`/api/maps/${map.id}/travellers`).send({ name, birthCountryCode })).traveller;
    ann = await add('Ann', 'GB');
    bo = await add('Bo', 'IE');
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    colosseum = data(await owner.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum');

    // Ann went to Portugal and Rome; her photo at the Colosseum is on the trip
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Lisbon and Rome', startDate: '2024-04-01', endDate: '2024-04-10' })).trip;
    await owner.agent.put(`/api/trips/${trip.id}/travellers`).send({ travellerIds: [ann.id] });
    await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'PT', arriveOn: '2024-04-01' });
    await owner.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' });
    const photo = data(await uploadPhoto(owner.agent, map.id, { tripId: trip.id, countryCode: 'IT', takenAt: '2024-04-08T10:00:00.000Z' })).photo;
    expect((await owner.agent.post(`/api/photos/${photo.id}/landmarks`).send({ landmarkId: colosseum.id })).status).toBe(201);

    // Bo's moment in France; and a photo of the owner's own, on no trip, in Spain
    expect(
      (await owner.agent.post(`/api/maps/${map.id}/moments`).send({ kind: 'FIRST_TRIP', title: 'Bo’s first trip', happenedOn: '2025-08-02', countryCode: 'FR', travellerIds: [bo.id] })).status,
    ).toBe(201);
    await uploadPhoto(owner.agent, map.id, { countryCode: 'ES' });
  });

  it('has only that traveller’s places and stamps, and their name on it', async () => {
    const res = await passportOf(owner, ann.id);
    expect(res.status).toBe(200);
    const passport = data(res).passport;
    expect(passport.map.traveller).toEqual({ id: ann.id, name: 'Ann' });
    expect(codesOf(passport)).toEqual(['GB', 'IT', 'PT']);
    expect(passport.pages.find((p) => p.countryCode === 'IT').stamps.map((s) => s.name)).toEqual(['Colosseum']);
    expect(passport.totals).toMatchObject({ countries: 3, landmarks: 1 });
    // Every traveller still listed, for choosing another
    expect(passport.travellers.map((t) => t.name)).toEqual(expect.arrayContaining(['Ann', 'Bo']));

    const bos = data(await passportOf(owner, bo.id)).passport;
    expect(codesOf(bos)).toEqual(['FR', 'IE']);
    expect(bos.totals.landmarks).toBe(0);
    expect(bos.pages.find((p) => p.countryCode === 'FR').enteredOn).toBe('2025-08-02');
  });

  it('the whole map’s passport is as it was', async () => {
    const whole = data(await passportOf(owner)).passport;
    expect(whole.map.traveller).toBeNull();
    expect(codesOf(whole)).toEqual(expect.arrayContaining(['ES', 'IT', 'PT']));
  });

  it('is for anyone who can see the map, through a share link too; a traveller not on it is a 404', async () => {
    expect(codesOf(data(await passportOf(viewer, ann.id)).passport)).toEqual(['GB', 'IT', 'PT']);
    expect((await passportOf(owner, '00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await passportOf(owner, 'not-an-id')).status).toBe(404);
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const shared = await anon().get(`/api/shared/${shareCode}/passport?traveller=${bo.id}`);
    expect(shared.status).toBe(200);
    expect(codesOf(data(shared).passport)).toEqual(['FR', 'IE']);
  });
});

describe('anniversaries as moments', () => {
  let owner;
  let viewer;
  let map;
  let wedding;
  const on = (who, day) => who.agent.get(`/api/maps/${map.id}/moments?anniversary=${day}`);

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('AnniversaryOwner'), signUp('AnniversaryViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    const create = async (body) => data(await owner.agent.post(`/api/maps/${map.id}/moments`).send(body)).moment;
    wedding = await create({ kind: 'WEDDING', title: 'Our wedding', happenedOn: '2016-05-09', countryCode: 'IT' });
    await create({ kind: 'ANNIVERSARY', title: 'Five years', happenedOn: '2021-05-09', countryCode: 'FR', hidden: true });
    // Only the month: no day to come round
    await create({ kind: 'CELEBRATION', title: 'May party', happenedOn: '2019-05-01', datePrecision: 'MONTH', countryCode: 'ES' });
  });

  it('lists the moments whose day comes round on the viewer’s today, newest first', async () => {
    const titles = data(await on(owner, '2026-05-09')).moments.map((m) => m.title);
    expect(titles).toEqual(['Five years', 'Our wedding']);
    // Viewers: not the hidden one
    expect(data(await on(viewer, '2026-05-09')).moments.map((m) => m.title)).toEqual(['Our wedding']);
    // Another day, or the year it happened: none
    expect(data(await on(owner, '2026-05-10')).moments).toEqual([]);
    expect(data(await on(owner, '2016-05-09')).moments).toEqual([]);
    expect((await on(owner, 'tomorrow')).status).toBe(400);
  });

  it('sends a moment’s anniversary before any photo in the "On this day" email', async () => {
    // A photo taken on the same day, which would otherwise be the memory
    await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', takenAt: '2022-05-09T12:00:00.000Z' });
    await sendOnThisDayEmails({ now: new Date('2026-05-09T08:00:00Z') });
    const [email] = sentEmails().filter((e) => e.kind === 'memory' && e.to === owner.email);
    expect(email).toMatchObject({
      subject: '10 years ago today: Our wedding',
      context: { headline: '10 years ago today, in Italy', caption: 'Our wedding', takenOn: '9 May 2016', photoUrl: null },
    });
    expect(wedding.kind).toBe('WEDDING');
  });
});
