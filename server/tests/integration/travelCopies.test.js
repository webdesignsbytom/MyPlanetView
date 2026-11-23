// Taking your travels with you (docs/API.md "Travel copies"): Mia, grown up, asks for copies
// of her travels on the family map; Mum (the owner) approves or declines; the photos' files
// are copied in the bucket under Mia's map, with the trips, moments, stamps and visits.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanUp, data, defaultMapOf, inBucket, prisma, sentEmails, signUp, uploadPhoto } from './helpers.js';
import { runTravelCopy } from '../../src/services/travel/travelCopies.js';

afterAll(cleanUp);

const COLOSSEUM = { latitude: 41.8902, longitude: 12.4922 };

describe('travel copies', () => {
  let mum;
  let mia;
  let stranger;
  let familyMap;
  let miaMap;
  let miaT;
  let dadT;
  let italy;
  let workTrip;
  let italyPhotos;
  let hiddenPhoto;
  let gelato;
  let colosseumId;

  const choicesFor = (who, query = '') => who.agent.get(`/api/maps/${familyMap.id}/travel-copy-choices${query}`);
  const choice = (extra) => ({ toMapId: miaMap.id, travellerId: miaT.id, ...extra });
  const preview = (who, body) => who.agent.post(`/api/maps/${familyMap.id}/travel-copies/preview`).send(body);
  const ask = (who, body) => who.agent.post(`/api/maps/${familyMap.id}/travel-copies`).send(body);
  const miaPhotos = () => prisma.photo.findMany({ where: { mapId: miaMap.id }, include: { variants: { include: { media: true } }, landmarks: true } });

  beforeAll(async () => {
    [mum, mia, stranger] = await Promise.all(['CopyMum', 'CopyMia', 'CopyStranger'].map((n) => signUp(n)));
    [familyMap, miaMap] = await Promise.all([defaultMapOf(mum.agent), defaultMapOf(mia.agent)]);
    expect((await mum.agent.patch(`/api/maps/${familyMap.id}`).send({ name: 'The family', groupType: 'FAMILY' })).status).toBe(200);
    miaT = data(await mum.agent.post(`/api/maps/${familyMap.id}/travellers`).send({ name: 'Mia' })).traveller;
    dadT = data(await mum.agent.post(`/api/maps/${familyMap.id}/travellers`).send({ name: 'Dad' })).traveller;
    expect((await mum.agent.post(`/api/maps/${familyMap.id}/members`).send({ email: mia.email, role: 'VIEWER' })).status).toBe(201);

    italy = data(
      await mum.agent
        .post(`/api/maps/${familyMap.id}/trips`)
        .send({ title: 'Italy, summer 2015', startDate: '2015-07-01', endDate: '2015-07-14', travellerIds: [miaT.id, dadT.id] })
    ).trip;
    expect((await mum.agent.post(`/api/trips/${italy.id}/stops`).send({ countryCode: 'IT', placeName: 'Rome', arriveOn: '2015-07-02' })).status).toBe(201);
    expect((await mum.agent.patch(`/api/trips/${italy.id}`).send({ status: 'COMPLETED' })).status).toBe(200);
    workTrip = data(await mum.agent.post(`/api/maps/${familyMap.id}/trips`).send({ startDate: '2019-04-10', endDate: '2019-04-12', title: 'Work trip', travellerIds: [dadT.id] })).trip;

    colosseumId = data(await mum.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum').id;
    const atColosseum = data(
      await uploadPhoto(mum.agent, familyMap.id, { tripId: italy.id, ...COLOSSEUM, caption: 'Mia at the Colosseum', takenAt: '2015-07-03T10:00:00.000Z' })
    ).photo;
    expect((await mum.agent.patch(`/api/photos/${atColosseum.id}/landmarks/${colosseumId}`).send({ confirmed: true })).status).toBe(200);
    const gelatoPhoto = data(await uploadPhoto(mum.agent, familyMap.id, { tripId: italy.id, countryCode: 'IT', takenAt: '2015-07-05T15:00:00.000Z' })).photo;
    italyPhotos = [atColosseum, gelatoPhoto];
    hiddenPhoto = data(await uploadPhoto(mum.agent, familyMap.id, { tripId: italy.id, countryCode: 'IT' })).photo;
    expect((await mum.agent.patch(`/api/photos/${hiddenPhoto.id}`).send({ hidden: true })).status).toBe(200);
    expect((await uploadPhoto(mum.agent, familyMap.id, { countryCode: 'FR', takenAt: '2019-04-01T09:00:00.000Z' })).status).toBe(201);

    gelato = data(
      await mum.agent.post(`/api/maps/${familyMap.id}/moments`).send({
        kind: 'SAW_OR_DID',
        title: "Mia's first gelato",
        countryCode: 'IT',
        tripId: italy.id,
        travellerIds: [miaT.id],
        photoIds: [gelatoPhoto.id],
      })
    ).moment;
    expect(
      (await mum.agent.post(`/api/maps/${familyMap.id}/moments`).send({ kind: 'SAW_OR_DID', title: 'Secret', countryCode: 'IT', travellerIds: [miaT.id], hidden: true })).status
    ).toBe(201);
  });

  it("lists a traveller's own trips and moments, and the countries' photos, never hidden ones", async () => {
    const res = await choicesFor(mia, `?traveller=${miaT.id}`);
    expect(res.status).toBe(200);
    const body = data(res);
    // The map's owner is one of its travellers too, linked to her account
    expect(body.travellers.map((t) => t.name).sort()).toEqual(['CopyMum', 'Dad', 'Mia']);
    expect(body.travellers.find((t) => t.name === 'CopyMum')).toMatchObject({ mine: false, taken: true });
    expect(body.travellers.find((t) => t.name === 'Mia')).toMatchObject({ mine: false, taken: false });
    expect(body.travellerId).toBe(miaT.id);
    expect(body.trips).toEqual([
      expect.objectContaining({ id: italy.id, title: 'Italy, summer 2015', status: 'COMPLETED', startDate: '2015-07-01', countries: ['IT'], photos: 2 }),
    ]);
    expect(body.moments).toEqual([expect.objectContaining({ id: gelato.id, title: "Mia's first gelato", photoIds: [italyPhotos[1].id] })]);
    expect(body.countries.sort((a, b) => a.countryCode.localeCompare(b.countryCode))).toEqual([
      { countryCode: 'FR', photos: 1 },
      { countryCode: 'IT', photos: 2 },
    ]);
    // Not on the map: nothing to see
    expect((await choicesFor(stranger)).status).toBe(404);
  });

  it('refuses what isn\'t theirs to take', async () => {
    expect((await preview(mia, choice({ tripIds: [workTrip.id] }))).status).toBe(400);
    expect((await preview(mia, choice({ photoIds: [hiddenPhoto.id] }))).status).toBe(400);
    expect((await preview(mia, choice({}))).status).toBe(400);
    // Onto a map they don't own: the family map itself, or someone else's
    expect((await preview(mia, choice({ toMapId: familyMap.id, tripIds: [italy.id] }))).status).toBe(403);
    const strangerMap = await defaultMapOf(stranger.agent);
    expect((await preview(mia, choice({ toMapId: strangerMap.id, tripIds: [italy.id] }))).status).toBe(404);
    // A traveller linked to someone else's account: Mum's own
    const mumT = await prisma.traveller.findFirst({ where: { mapId: familyMap.id, userId: mum.user.id } });
    const taken = await preview(mia, choice({ travellerId: mumT.id, countryCodes: ['FR'] }));
    expect(taken.status).toBe(403);
    expect(taken.body.message).toBe("That traveller is someone else's account.");
  });

  it('previews what fits on the new map', async () => {
    const res = await preview(mia, choice({ tripIds: [italy.id], countryCodes: ['FR'], momentIds: [gelato.id] }));
    expect(res.status).toBe(200);
    expect(data(res)).toMatchObject({ photos: 3, alreadyCopied: 0, fits: 3, trips: 1, moments: 1, locked: false });
    expect(data(res).countries).toEqual([
      { countryCode: 'IT', photos: 2, room: 30, fits: 2 },
      { countryCode: 'FR', photos: 1, room: 30, fits: 1 },
    ]);
  });

  it('asks the owner, who approves, and the copies land on her map', async () => {
    const before = sentEmails().length;
    const res = await ask(mia, choice({ tripIds: [italy.id], countryCodes: ['FR'], momentIds: [gelato.id] }));
    expect(res.status).toBe(201);
    const request = data(res).request;
    expect(request).toMatchObject({ status: 'PENDING', photos: 3, trips: 1, moments: 1, mine: true, canCancel: true, canDecide: false });
    const email = await vi.waitFor(() => {
      const sent = sentEmails().slice(before).find((e) => e.to === mum.email);
      expect(sent).toBeTruthy();
      return sent;
    });
    expect(email).toMatchObject({ template: 'travelCopyEmail', subject: 'My Planet View: someone asks to copy their travels' });
    expect(email.context).toMatchObject({ isRequest: true, requesterName: 'CopyMia', travellerName: 'Mia', summary: '3 photos, 1 trip and 1 moment' });

    // One waiting at a time; only the family map's managers decide
    expect((await ask(mia, choice({ tripIds: [italy.id] }))).status).toBe(409);
    expect((await mia.agent.post(`/api/travel-copies/${request.id}/approve`)).status).toBe(403);
    expect((await stranger.agent.post(`/api/travel-copies/${request.id}/approve`)).status).toBe(404);

    const listed = data(await mum.agent.get(`/api/maps/${familyMap.id}/travel-copies`));
    expect(listed.incoming).toEqual([expect.objectContaining({ id: request.id, canDecide: true })]);
    const detail = data(await mum.agent.get(`/api/travel-copies/${request.id}`)).request;
    expect(detail.tripList).toEqual([{ id: italy.id, title: 'Italy, summer 2015', startDate: '2015-07-01' }]);
    expect(detail.countries).toEqual([
      { countryCode: 'IT', photos: 2 },
      { countryCode: 'FR', photos: 1 },
    ]);

    const familyPhotosBefore = await prisma.photo.count({ where: { mapId: familyMap.id } });
    const approved = await mum.agent.post(`/api/travel-copies/${request.id}/approve`);
    expect(approved.status).toBe(200);
    expect(data(approved).request).toMatchObject({ status: 'DONE', progress: { done: 3, copied: 3, skipped: 0 } });
    expect((await mum.agent.post(`/api/travel-copies/${request.id}/approve`)).status).toBe(409);

    // The photos: new rows and new files under Mia's map, uploaded by her, the stamp kept
    const copies = await miaPhotos();
    expect(copies).toHaveLength(3);
    for (const copy of copies) {
      expect(copy.uploaderId).toBe(mia.user.id);
      for (const v of copy.variants) {
        expect(v.media.key).toContain(`/photos/${miaMap.id}/${copy.id}/`);
        expect(inBucket(v.media.key)).toBe(true);
        expect(v.media.ownerId).toBe(mia.user.id);
      }
    }
    const colosseumCopy = copies.find((p) => p.copiedFromId === italyPhotos[0].id);
    expect(colosseumCopy.caption).toBe('Mia at the Colosseum');
    // Its matches as they were: the confirmed Colosseum (a passport stamp) and any suggestion
    const originalMatches = await prisma.photoLandmark.count({ where: { photoId: italyPhotos[0].id } });
    expect(colosseumCopy.landmarks).toHaveLength(originalMatches);
    expect(colosseumCopy.landmarks).toContainEqual(expect.objectContaining({ landmarkId: colosseumId, confirmed: true, mapId: miaMap.id }));
    // The family map keeps everything
    expect(await prisma.photo.count({ where: { mapId: familyMap.id } })).toBe(familyPhotosBefore);

    // The trip, completed, with its stop and photos; the moment, with its photo
    const trip = await prisma.trip.findFirst({ where: { mapId: miaMap.id, copiedFromId: italy.id }, include: { stops: true } });
    expect(trip).toMatchObject({ title: 'Italy, summer 2015', status: 'COMPLETED', createdById: mia.user.id });
    expect(trip.stops).toEqual([expect.objectContaining({ countryCode: 'IT', placeName: 'Rome' })]);
    expect(copies.filter((p) => p.tripId === trip.id)).toHaveLength(2);
    const moment = await prisma.moment.findFirst({ where: { mapId: miaMap.id, copiedFromId: gelato.id }, include: { photos: true } });
    expect(moment).toMatchObject({ title: "Mia's first gelato", tripId: trip.id, spotShared: false });
    expect(moment.photos.map((p) => p.photoId)).toEqual([copies.find((p) => p.copiedFromId === italyPhotos[1].id).id]);
    expect(await prisma.moment.count({ where: { mapId: miaMap.id } })).toBe(1);

    // Italy and France visited, from her own dates: the trip's arrival, the photo's day
    const visits = await prisma.countryVisit.findMany({ where: { mapId: miaMap.id, countryCode: { in: ['IT', 'FR'] } } });
    const visit = (code) => visits.find((v) => v.countryCode === code);
    expect(visit('IT').firstVisitedOn.toISOString().slice(0, 10)).toBe('2015-07-02');
    expect(visit('FR').firstVisitedOn.toISOString().slice(0, 10)).toBe('2019-04-01');

    // Mia is told
    await vi.waitFor(() =>
      expect(sentEmails().some((e) => e.to === mia.email && e.context?.isDone && e.context.summary === '3 photos, 1 trip and 1 moment')).toBe(true),
    );
  });

  it('never copies the same photo twice', async () => {
    const again = await preview(mia, choice({ tripIds: [italy.id] }));
    expect(data(again)).toMatchObject({ photos: 2, alreadyCopied: 2, fits: 0 });
    const request = data(await ask(mia, choice({ tripIds: [italy.id] }))).request;
    const approved = data(await mum.agent.post(`/api/travel-copies/${request.id}/approve`)).request;
    expect(approved).toMatchObject({ status: 'DONE', progress: { done: 2, copied: 2, skipped: 0 } });
    expect(await prisma.photo.count({ where: { mapId: miaMap.id } })).toBe(3);
    expect(await prisma.trip.count({ where: { mapId: miaMap.id, copiedFromId: italy.id } })).toBe(1);
  });

  it('declines, and withdraws', async () => {
    const declined = data(await ask(mia, choice({ countryCodes: ['FR'] }))).request;
    const before = sentEmails().length;
    const res = await mum.agent.post(`/api/travel-copies/${declined.id}/decline`);
    expect(res.status).toBe(200);
    expect(data(res).request.status).toBe('DECLINED');
    await vi.waitFor(() =>
      expect(sentEmails().slice(before).some((e) => e.to === mia.email && e.subject === 'My Planet View: your request to copy your travels')).toBe(true),
    );

    const withdrawn = data(await ask(mia, choice({ countryCodes: ['FR'] }))).request;
    expect((await mum.agent.delete(`/api/travel-copies/${withdrawn.id}`)).status).toBe(403);
    expect((await mia.agent.delete(`/api/travel-copies/${withdrawn.id}`)).status).toBe(200);
    expect(await prisma.travelCopyRequest.findUnique({ where: { id: withdrawn.id } })).toBeNull();
  });

  it('carries on where a run stopped', async () => {
    await prisma.photo.deleteMany({ where: { mapId: miaMap.id } });
    const request = data(await ask(mia, choice({ tripIds: [italy.id], countryCodes: ['FR'] }))).request;
    await prisma.travelCopyRequest.update({ where: { id: request.id }, data: { status: 'APPROVED', decidedById: mum.user.id, decidedAt: new Date() } });
    // A run with no time copies nothing and lets the request go
    const stopped = await runTravelCopy(request.id, { budgetMs: 0 });
    expect(stopped).toMatchObject({ status: 'APPROVED', photoCursor: 0 });
    const res = await mia.agent.post(`/api/travel-copies/${request.id}/continue`);
    expect(res.status).toBe(200);
    expect(data(res).request).toMatchObject({ status: 'DONE', progress: { done: 3, copied: 3 } });
    expect(await prisma.photo.count({ where: { mapId: miaMap.id } })).toBe(3);
    expect((await stranger.agent.post(`/api/travel-copies/${request.id}/continue`)).status).toBe(404);
  });
});
