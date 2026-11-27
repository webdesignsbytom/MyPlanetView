// Postcards (26 Nov 2026, the user's wish; docs/API.md "Postcards"): sent by a link of their own,
// never part of a map. A country's card is free on every plan, with a city's or the wilderness's
// photo on its front; a landmark's photo or one from your own (in the private bucket) needs a
// paid plan. Anyone with the link sees the card; its sender
// lists them, gives one a new link or deletes it; they go with the sender's account, and the
// daily clean-up keeps a sent card's photo.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, givePlan, inBucket, prisma, signUp } from './helpers.js';
import POSTCARD_PHOTOS from '../../src/data/postcardPhotos.json' with { type: 'json' };

const { deleteOrphanUploads } = await import('../../src/services/s3/mediaService.js');
const { createPostcardInDB } = await import('../../src/domain/postcards.js');

const senders = [];
afterAll(async () => {
  // The pictures' rows lose their owner with the account (SET NULL), so they go first
  await prisma.mediaItem.deleteMany({ where: { resource: 'postcard', ownerId: { in: senders } } });
  await cleanUp();
});

const PICTURE = { contentType: 'image/jpeg', bytes: 480_000 };
const fakeR2 = () => globalThis.__fakeR2;
const CARD = { kind: 'COUNTRY', countryCode: 'FR', style: 'airmail', message: 'Bonjour from Paris!\nThe croissants are as good as you said.', toName: 'Gran', fromName: 'Sam' };

describe('postcards', () => {
  let free;
  let paid;
  let unverified;
  let eiffel;
  let colosseum;

  /** The browser's picture: presign, "PUT" into the fake bucket. -> its key */
  async function uploadPicture(agent, { put = PICTURE } = {}) {
    const presign = await agent.post('/api/postcards/picture/presign').send(PICTURE);
    expect(presign.status).toBe(200);
    const { key, upload } = data(presign);
    expect(upload).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, bytes: PICTURE.bytes });
    if (put) fakeR2().set(key, put);
    return key;
  }

  beforeAll(async () => {
    [free, paid] = await Promise.all([signUp('PostcardFree'), signUp('PostcardPaid')]);
    unverified = await signUp('PostcardUnverified', { verified: false });
    senders.push(free.user.id, paid.user.id, unverified.user.id);
    await givePlan(paid.user.id, { plan: 'REGULAR' });
    const landmarks = data(await free.agent.get('/api/landmarks')).landmarks;
    eiffel = landmarks.find((l) => l.name === 'Eiffel Tower');
    colosseum = landmarks.find((l) => l.name === 'Colosseum');
  });

  it('sends a country’s card on every plan, and anyone with its link sees it', async () => {
    const res = await free.agent.post('/api/postcards').send(CARD);
    expect(res.status).toBe(201);
    const { postcard } = data(res);
    expect(postcard).toMatchObject({
      id: expect.any(String),
      code: expect.stringMatching(/^[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$/),
      kind: 'COUNTRY',
      countryCode: 'FR',
      landmark: null,
      pictureUrl: null,
      style: 'airmail',
      message: CARD.message,
      toName: 'Gran',
      fromName: 'Sam',
    });

    // Signed in or not; the code in any case, with or without its dashes
    const opened = await anon().get(`/api/postcard/${postcard.code.replace(/-/g, '').toLowerCase()}`);
    expect(opened.status).toBe(200);
    const shown = data(opened).postcard;
    expect(shown).toEqual({
      code: postcard.code,
      kind: 'COUNTRY',
      countryCode: 'FR',
      landmark: null,
      pictureUrl: null,
      style: 'airmail',
      message: CARD.message,
      toName: 'Gran',
      fromName: 'Sam',
      sentAt: postcard.sentAt,
    });
    // Nothing of the sender's account, nor of any map
    expect(JSON.stringify(shown)).not.toContain(free.user.id);
    expect(JSON.stringify(shown)).not.toContain(free.email);

    expect((await anon().get('/api/postcard/ABCD-EFGH-JKMN')).status).toBe(404);
    expect((await anon().get('/api/postcard/not-a-code!')).status).toBe(404);
  });

  it('keeps a landmark’s card and one from your own photo for paid plans', async () => {
    const landmark = { ...CARD, kind: 'LANDMARK', landmarkId: eiffel.id };
    const refused = await free.agent.post('/api/postcards').send(landmark);
    expect(refused.status).toBe(403);
    expect(refused.body.message).toMatch(/Business and First Class/);
    expect((await free.agent.post('/api/postcards/picture/presign').send(PICTURE)).status).toBe(403);
    expect(data(await free.agent.get('/api/postcards')).paidCards).toBe(false);

    const res = await paid.agent.post('/api/postcards').send(landmark);
    expect(res.status).toBe(201);
    expect(data(res).postcard).toMatchObject({
      kind: 'LANDMARK',
      landmark: { id: eiffel.id, name: 'Eiffel Tower', slug: eiffel.slug, wikidataId: eiffel.wikidataId, countryCode: 'FR' },
    });
    expect(data(await paid.agent.get('/api/postcards')).paidCards).toBe(true);
  });

  it('puts a city’s or the wilderness’s photo on a country’s card for everyone, a landmark’s for paid plans only', async () => {
    const france = data(await free.agent.get('/api/landmarks?country=FR')).landmarks;
    const seine = france.find((l) => l.name === 'Paris, Banks of the Seine');
    const porto = france.find((l) => l.name === 'Gulf of Porto');
    expect(POSTCARD_PHOTOS[seine.wikidataId]).toBe('c');
    expect(POSTCARD_PHOTOS[porto.wikidataId]).toBe('w');

    const city = await free.agent.post('/api/postcards').send({ ...CARD, landmarkId: seine.id });
    expect(city.status).toBe(201);
    expect(data(city).postcard).toMatchObject({ kind: 'COUNTRY', landmark: { id: seine.id, slug: seine.slug } });
    const opened = data(await anon().get(`/api/postcard/${data(city).postcard.code}`)).postcard;
    expect(opened).toMatchObject({ kind: 'COUNTRY', landmark: { id: seine.id, wikidataId: seine.wikidataId } });
    expect((await free.agent.post('/api/postcards').send({ ...CARD, landmarkId: porto.id })).status).toBe(201);

    // A landmark's own photo on a country's card is a paid plan's, as a landmark's card is
    const onCountryCard = { ...CARD, landmarkId: eiffel.id };
    const refused = await free.agent.post('/api/postcards').send(onCountryCard);
    expect(refused.status).toBe(403);
    expect(refused.body.message).toMatch(/Business and First Class/);
    expect((await paid.agent.post('/api/postcards').send(onCountryCard)).status).toBe(201);

    // A landmark with no postcard photo, or another place's, is never a country card's
    const noPhoto = france.find((l) => !POSTCARD_PHOTOS[l.wikidataId]);
    expect(noPhoto).toBeTruthy();
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, landmarkId: noPhoto.id })).status).toBe(400);
    expect((await free.agent.post('/api/postcards').send({ ...CARD, landmarkId: colosseum.id })).status).toBe(400);
  });

  it('takes a landmark of the place only, a UK nation’s from the UK', async () => {
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'LANDMARK', landmarkId: colosseum.id })).status).toBe(400);
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'LANDMARK', landmarkId: '00000000-0000-4000-8000-000000000000' })).status).toBe(400);
    const bigBen = data(await paid.agent.get('/api/landmarks?country=GB')).landmarks.find((l) => l.name.startsWith('Big Ben'));
    if (bigBen) {
      expect((await paid.agent.post('/api/postcards').send({ ...CARD, countryCode: 'XE', kind: 'LANDMARK', landmarkId: bigBen.id })).status).toBe(201);
    }
  });

  it('carries the sender’s own photo, from the private bucket, theirs and fresh only', async () => {
    const key = await uploadPicture(paid.agent);
    expect(key).toMatch(new RegExp(`/postcards/${paid.user.id}/card-[A-Za-z0-9]+\\.jpg$`));
    // Someone else's picture can't be sent
    await givePlan(free.user.id, { plan: 'PREMIUM' });
    try {
      expect((await free.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: key })).status).toBe(400);
    } finally {
      await prisma.subscription.delete({ where: { userId: free.user.id } });
    }

    const res = await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: key });
    expect(res.status).toBe(201);
    const { postcard } = data(res);
    expect(postcard.kind).toBe('PHOTO');
    expect(postcard.pictureUrl).toContain('/postcards/');
    const row = await prisma.postcard.findUnique({ where: { id: postcard.id }, include: { picture: true } });
    expect(row.picture).toMatchObject({ key, resource: 'postcard', visibility: 'PRIVATE', bytes: PICTURE.bytes });
    // Its link shows the picture signed, never its key
    const shown = data(await anon().get(`/api/postcard/${postcard.code}`)).postcard;
    expect(shown.pictureUrl).toContain('/postcards/');
    expect(JSON.stringify(shown)).not.toContain('"pictureKey"');
    // Never twice
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: key })).status).toBe(400);

    // Not uploaded, or too old
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: await uploadPicture(paid.agent, { put: null }) })).status).toBe(400);
    const stale = await uploadPicture(paid.agent);
    await prisma.mediaItem.update({ where: { key: stale }, data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } });
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: stale })).body.message).toBe(
      'That photo took too long to send. Please add it again.',
    );

    // A picture that isn't one, or too big
    expect((await paid.agent.post('/api/postcards/picture/presign').send({ contentType: 'image/svg+xml', bytes: 10 })).status).toBe(400);
    expect((await paid.agent.post('/api/postcards/picture/presign').send({ contentType: 'image/png', bytes: 9 * 1024 * 1024 })).status).toBe(413);
    expect((await anon().post('/api/postcards/picture/presign').send(PICTURE)).status).toBe(401);
  });

  it('takes a region’s card with a landmark of its country', async () => {
    const indonesian = data(await paid.agent.get('/api/landmarks?country=ID')).landmarks[0];
    const res = await paid.agent.post('/api/postcards').send({ ...CARD, countryCode: 'XB', kind: 'LANDMARK', landmarkId: indonesian.id });
    expect(res.status).toBe(201);
    expect(data(res).postcard).toMatchObject({ countryCode: 'XB', kind: 'LANDMARK', landmark: { countryCode: 'ID' } });
  });

  it('turns away a stored photo that isn’t what was signed for, deleting it', async () => {
    const big = await uploadPicture(paid.agent, { put: { contentType: 'image/jpeg', bytes: 9 * 1024 * 1024 } });
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: big })).status).toBe(413);
    expect(inBucket(big)).toBe(false);
    const gif = await uploadPicture(paid.agent, { put: { contentType: 'image/gif', bytes: 1000 } });
    const res = await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: gif });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The photo must be a JPEG, PNG or WebP picture.');
    expect(inBucket(gif)).toBe(false);
    // Another person's folder is never taken, nor a key that isn't a card's
    expect((await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: 'myplanetview/photos/x/y.jpg' })).status).toBe(400);
  });

  it('allows 10 photos presigned and never sent a day', async () => {
    const presigner = await signUp('PostcardPresigner');
    senders.push(presigner.user.id);
    await givePlan(presigner.user.id, { plan: 'PREMIUM' });
    for (let i = 0; i < 10; i++) expect((await presigner.agent.post('/api/postcards/picture/presign').send(PICTURE)).status).toBe(200);
    expect((await presigner.agent.post('/api/postcards/picture/presign').send(PICTURE)).status).toBe(429);
  });

  it('keeps at most so many cards a person, counted with their row locked', async () => {
    const card = { kind: 'COUNTRY', countryCode: 'FR', landmarkId: null, style: 'classic', message: 'Hi', toName: null, fromName: null };
    const kept = await prisma.postcard.count({ where: { senderId: free.user.id } });
    expect(await createPostcardInDB({ senderId: free.user.id, card, cap: kept + 1 })).toMatchObject({ postcard: { kind: 'COUNTRY' } });
    expect(await createPostcardInDB({ senderId: free.user.id, card, cap: kept + 1 })).toEqual({ tooMany: true });
    // Two at once can't both pass
    const both = await Promise.all([0, 1].map(() => createPostcardInDB({ senderId: free.user.id, card, cap: kept + 2 })));
    expect(both.filter((made) => made.tooMany)).toHaveLength(1);
  });

  it('refuses a card that isn’t right, and needs a verified email address to send one', async () => {
    const send = (body) => free.agent.post('/api/postcards').send(body);
    expect((await send({ ...CARD, message: '' })).body.message).toBe('Write a message on the back of your postcard.');
    expect((await send({ ...CARD, message: 'x'.repeat(401) })).status).toBe(400);
    expect((await send({ ...CARD, style: 'neon' })).status).toBe(400);
    expect((await send({ ...CARD, kind: 'POSTER' })).status).toBe(400);
    expect((await send({ ...CARD, countryCode: 'ZZ' })).status).toBe(400);
    expect((await send({ ...CARD, toName: 'x'.repeat(41) })).status).toBe(400);

    expect((await unverified.agent.post('/api/postcards').send(CARD)).status).toBe(403);
    expect((await anon().post('/api/postcards').send(CARD)).status).toBe(401);
  });

  it('lists the sender’s own cards, newest first, and nobody else’s', async () => {
    const { postcards } = data(await paid.agent.get('/api/postcards'));
    expect(postcards.length).toBeGreaterThanOrEqual(2);
    expect(postcards[0].sentAt >= postcards[1].sentAt).toBe(true);
    const freeOnes = data(await free.agent.get('/api/postcards')).postcards;
    expect(freeOnes.every((p) => !postcards.some((q) => q.id === p.id))).toBe(true);
    expect((await anon().get('/api/postcards')).status).toBe(401);
  });

  it('gives a card a new link (the old one finds nothing), for its sender only', async () => {
    const { postcard } = data(await free.agent.post('/api/postcards').send(CARD));
    expect((await paid.agent.post(`/api/postcards/${postcard.id}/reset-link`)).status).toBe(404);
    const res = await free.agent.post(`/api/postcards/${postcard.id}/reset-link`);
    expect(res.status).toBe(200);
    const moved = data(res).postcard;
    expect(moved.code).not.toBe(postcard.code);
    expect((await anon().get(`/api/postcard/${postcard.code}`)).status).toBe(404);
    expect((await anon().get(`/api/postcard/${moved.code}`)).status).toBe(200);
  });

  it('keeps a sent card’s photo through the daily clean-up, and deleting the card deletes it', async () => {
    const key = await uploadPicture(paid.agent);
    const sent = data(await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'PHOTO', pictureKey: key })).postcard;
    const unsent = await uploadPicture(paid.agent);
    await prisma.mediaItem.updateMany({ where: { key: { in: [key, unsent] } }, data: { createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) } });
    expect((await deleteOrphanUploads()).complete).toBe(true);
    expect(inBucket(key)).toBe(true);
    expect(inBucket(unsent)).toBe(false);

    expect((await free.agent.delete(`/api/postcards/${sent.id}`)).status).toBe(404);
    const res = await paid.agent.delete(`/api/postcards/${sent.id}`);
    expect(res.status).toBe(200);
    expect(await prisma.postcard.findUnique({ where: { id: sent.id } })).toBeNull();
    expect(inBucket(key)).toBe(false);
    expect((await anon().get(`/api/postcard/${sent.code}`)).status).toBe(404);
    expect((await paid.agent.delete(`/api/postcards/${sent.id}`)).status).toBe(404);
  });

  it('stays as sent when the sender’s plan drops', async () => {
    const { postcard } = data(await paid.agent.post('/api/postcards').send({ ...CARD, kind: 'LANDMARK', landmarkId: eiffel.id }));
    await prisma.subscription.update({ where: { userId: paid.user.id }, data: { status: 'canceled' } });
    try {
      expect(data(await anon().get(`/api/postcard/${postcard.code}`)).postcard.kind).toBe('LANDMARK');
      expect(data(await paid.agent.get('/api/postcards')).paidCards).toBe(false);
    } finally {
      await givePlan(paid.user.id, { plan: 'REGULAR' });
    }
  });

  it('puts the sender’s cards in their "Your data" file, their own photo linked', async () => {
    const res = await paid.agent.get('/api/users/export');
    expect(res.status).toBe(200);
    const { postcards } = data(res);
    expect(postcards.length).toBeGreaterThanOrEqual(2);
    expect(postcards.find((p) => p.kind === 'PHOTO')).toMatchObject({ place: 'FR', message: CARD.message, photoUrl: expect.stringContaining('/postcards/') });
    expect(postcards.find((p) => p.kind === 'LANDMARK')).toMatchObject({ landmark: 'Eiffel Tower', photoUrl: null });
  });

  it('goes with the sender’s account', async () => {
    const leaver = await signUp('PostcardLeaver');
    senders.push(leaver.user.id);
    const sent = data(await leaver.agent.post('/api/postcards').send(CARD)).postcard;
    await prisma.user.delete({ where: { id: leaver.user.id } });
    expect(await prisma.postcard.findUnique({ where: { id: sent.id } })).toBeNull();
    expect((await anon().get(`/api/postcard/${sent.code}`)).status).toBe(404);
  });
});
