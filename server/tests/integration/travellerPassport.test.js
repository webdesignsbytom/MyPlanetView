// A traveller's passport page (25 Nov 2026, the user's wish: "improve passport page for user
// avatars and info"; docs/API.md "Passport"): their photo (one of the map's, cropped, else
// their account's picture), their signature, the date of birth for editors only, when they
// were added and when they started travelling, as editors, viewers and share links see them.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('a traveller’s passport page', () => {
  let owner;
  let editor;
  let viewer;
  let stranger;
  let map;
  let me;
  let photo;
  let other;
  let strangersPhoto;

  const passportOf = async (agent) => data(await agent.get(`/api/maps/${map.id}/passport`)).passport;
  const travellerIn = (passport) => passport.travellers.find((t) => t.id === me.id);
  const update = (body, agent = owner.agent, id = me.id) => agent.patch(`/api/maps/${map.id}/travellers/${id}/passport`).send(body);

  beforeAll(async () => {
    [owner, editor, viewer, stranger] = await Promise.all([
      signUp('PassportPageOwner'),
      signUp('PassportPageEditor'),
      signUp('PassportPageViewer'),
      signUp('PassportPageStranger'),
    ]);
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
    me = data(await owner.agent.get(`/api/maps/${map.id}`)).map.travellers[0];
    await owner.agent.patch(`/api/maps/${map.id}/travellers/${me.id}`).send({ birthCountryCode: 'GB', birthDate: '1990-01-14' });
    photo = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', caption: 'Me in Paris' })).photo;
    other = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'IT' })).photo;
    strangersPhoto = data(await uploadPhoto(stranger.agent, (await defaultMapOf(stranger.agent)).id, { countryCode: 'DE' })).photo;
  });

  it('starts with the details the map has: born, home, the date of birth for editors, the day of issue', async () => {
    const passport = await passportOf(owner.agent);
    expect(passport.map).toMatchObject({ homeCountryCode: 'GB', canEdit: true });
    const traveller = travellerIn(passport);
    expect(traveller).toMatchObject({
      name: me.name,
      birthCountryCode: 'GB',
      birthDate: '1990-01-14',
      issuedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      travellingSince: null,
      photo: null,
      signature: null,
    });
    // Never the account it's linked to
    expect(traveller).not.toHaveProperty('userId');
    expect(traveller).not.toHaveProperty('user');
  });

  it('uses a linked traveller’s own account picture until a photo is chosen', async () => {
    await prisma.user.update({ where: { id: owner.user.id }, data: { image: 'https://media.example.test/avatars/me.webp' } });
    expect(travellerIn(await passportOf(owner.agent)).photo).toEqual({
      source: 'ACCOUNT',
      photoId: null,
      url: 'https://media.example.test/avatars/me.webp',
      width: null,
      height: null,
      focusX: 0.5,
      focusY: 0.5,
      zoom: 1,
    });
  });

  it('takes one of the map’s photos, cropped, from an editor', async () => {
    expect((await update({ photo: { photoId: photo.id, focusX: 0.25, focusY: 0.4, zoom: 2 } }, editor.agent)).status).toBe(200);
    const shown = travellerIn(await passportOf(owner.agent)).photo;
    expect(shown).toMatchObject({ source: 'MAP', photoId: photo.id, focusX: 0.25, focusY: 0.4, zoom: 2 });
    expect(shown.url).toContain('display-');
    // The reply is the traveller as their page shows them
    const res = await update({ photo: { photoId: photo.id, focusX: 0.3, focusY: 0.4, zoom: 2 } });
    expect(data(res).traveller.photo).toMatchObject({ source: 'MAP', focusX: 0.3 });
  });

  it('refuses another map’s photo, a hidden one, a crop outside the photo, and anyone but an editor', async () => {
    expect((await update({ photo: { photoId: strangersPhoto.id } })).status).toBe(400);
    expect((await update({ photo: { photoId: photo.id, zoom: 9 } })).status).toBe(400);
    expect((await update({ photo: 'me.jpg' })).status).toBe(400);
    expect((await owner.agent.patch(`/api/photos/${other.id}`).send({ hidden: true })).status).toBe(200);
    expect((await update({ photo: { photoId: other.id } })).status).toBe(400);
    expect((await update({})).status).toBe(400);
    expect((await update({ photo: null }, viewer.agent)).status).toBe(403);
    expect((await update({ photo: null }, stranger.agent)).status).toBe(404);
    expect((await update({ photo: null }, owner.agent, '00000000-0000-4000-8000-000000000000')).status).toBe(404);
    const unverified = await signUp('PassportPageUnverified', { verified: false });
    const ownMap = await defaultMapOf(unverified.agent);
    const ownTraveller = data(await unverified.agent.get(`/api/maps/${ownMap.id}`)).map.travellers[0];
    expect((await unverified.agent.patch(`/api/maps/${ownMap.id}/travellers/${ownTraveller.id}/passport`).send({ signature: null })).status).toBe(403);
  });

  it('takes a drawn signature, written the same way, and refuses anything else', async () => {
    const res = await update({ signature: 'M10 60 L40 30 L 70.25 65 M90 50L120 40' });
    expect(res.status).toBe(200);
    expect(data(res).traveller.signature).toBe('M10 60L40 30L70.3 65M90 50L120 40');
    expect((await update({ signature: 'M10 10' })).status).toBe(400);
    expect((await update({ signature: '<path d="M1 1L2 2"/>' })).status).toBe(400);
    expect((await update({ signature: 'M10 10L999 10' })).status).toBe(400);
  });

  it('says when they started travelling: their first trip that isn’t still planned', async () => {
    const trip = (title, startDate, endDate, status) =>
      owner.agent.post(`/api/maps/${map.id}/trips`).send({ title, startDate, endDate, status, travellerIds: [me.id] });
    expect((await trip('Lisbon', '2014-05-01', '2014-05-08', 'COMPLETED')).status).toBe(201);
    expect((await trip('Next year', '2027-03-01', '2027-03-08', 'PLANNED')).status).toBe(201);
    expect(travellerIn(await passportOf(owner.agent)).travellingSince).toBe('2014-05-01');
  });

  it('shows viewers and share links the photo and signature, never the date of birth', async () => {
    const forViewer = await passportOf(viewer.agent);
    expect(forViewer.map.canEdit).toBe(false);
    const traveller = travellerIn(forViewer);
    expect(traveller).not.toHaveProperty('birthDate');
    expect(traveller.photo).toMatchObject({ source: 'MAP', photoId: photo.id });
    expect(traveller.signature).toBe('M10 60L40 30L70.3 65M90 50L120 40');

    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const shared = data(await anon().get(`/api/shared/${shareCode}/passport`)).passport;
    expect(shared.map.canEdit).toBe(false);
    expect(travellerIn(shared)).toMatchObject({ photo: { source: 'MAP' }, signature: expect.any(String), travellingSince: '2014-05-01' });
    expect(travellerIn(shared)).not.toHaveProperty('birthDate');
  });

  it('keeps a photo hidden later for editors, the account picture for the rest', async () => {
    expect((await owner.agent.patch(`/api/photos/${photo.id}`).send({ hidden: true })).status).toBe(200);
    expect(travellerIn(await passportOf(owner.agent)).photo.source).toBe('MAP');
    expect(travellerIn(await passportOf(viewer.agent)).photo.source).toBe('ACCOUNT');
    expect((await owner.agent.patch(`/api/photos/${photo.id}`).send({ hidden: false })).status).toBe(200);
  });

  it('comes with the owner’s data', async () => {
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map;
    expect(exported.travellers.find((t) => t.id === me.id)).toMatchObject({
      passportPhoto: { photoId: photo.id, focusX: 0.3, focusY: 0.4, zoom: 2 },
      signature: 'M10 60L40 30L70.3 65M90 50L120 40',
    });
  });

  it('lets go of a photo deleted, and takes both off with null', async () => {
    expect((await owner.agent.delete(`/api/photos/${photo.id}`)).status).toBe(200);
    expect(await prisma.traveller.findUnique({ where: { id: me.id }, select: { portraitPhotoId: true } })).toEqual({ portraitPhotoId: null });
    expect(travellerIn(await passportOf(owner.agent)).photo.source).toBe('ACCOUNT');
    expect((await update({ photo: null, signature: null })).status).toBe(200);
    expect(await prisma.traveller.findUnique({ where: { id: me.id }, select: { portraitFocusX: true, signature: true } })).toEqual({
      portraitFocusX: null,
      signature: null,
    });
  });

  it('keeps a crop and a signature in shape, by the database’s own checks too', async () => {
    await expect(prisma.traveller.update({ where: { id: me.id }, data: { portraitZoom: 5 } })).rejects.toThrow();
    await expect(prisma.traveller.update({ where: { id: me.id }, data: { portraitPhotoId: other.id, portraitFocusX: null } })).rejects.toThrow();
    await expect(prisma.traveller.update({ where: { id: me.id }, data: { signature: '' } })).rejects.toThrow();
  });
});
