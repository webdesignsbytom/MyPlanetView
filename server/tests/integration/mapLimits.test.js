// The plan limits on maps, photos and people (docs/API.md, "Map limits"): map slots and
// locked maps, the best copy kept by the owner's plan, photos per country, the storage
// safety net, the plan fields on maps and trips, and the caps on editors and trip people.
import crypto from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
  ORIGINAL_SIZES,
  anon,
  cleanUp,
  data,
  defaultMapOf,
  givePlan,
  inBucket,
  prisma,
  sentEmails,
  signUp,
  testEmail,
  uploadPhoto,
} from './helpers.js';

afterAll(cleanUp);

const NEAR_EIFFEL = { latitude: 48.8575, longitude: 2.2952 };
const NEW_MAP = { name: 'Another map', groupType: 'SOLO', travellers: [{ name: 'Me' }] };
const LOCKED = "This map isn't paid for, so it can't take new photos. Its owner can pay for it as an extra map, or make it their main map.";

/** `n` photos of a country on a map, written straight to the table (the caps count rows). */
async function fillCountry(mapId, uploaderId, countryCode, n, { hidden = false } = {}) {
  await prisma.photo.createMany({
    data: Array.from({ length: n }, () => ({ mapId, uploaderId, countryCode, width: 10, height: 10, hidden })),
  });
}

const presign = (agent, mapId, sizes, extra = {}) =>
  agent.post(`/api/maps/${mapId}/photos/presign`).send({
    ...extra,
    files: sizes.map((size) => ({ size, contentType: 'image/jpeg', bytes: 1000 })),
  });

describe('map slots', () => {
  it('a second map needs a paid extra map (402); a paid slot makes room', async () => {
    const { agent, user } = await signUp('Slots');
    const refused = await agent.post('/api/maps').send(NEW_MAP);
    expect(refused.status).toBe(402);
    expect(refused.body).toEqual({
      status: 'fail',
      message: "Your plan includes 1 map, and every extra map you've paid for is in use. An extra map costs £3.99 a month or £39 a year.",
    });
    // The body is checked before the slot
    expect((await agent.post('/api/maps').send({ ...NEW_MAP, travellers: [] })).status).toBe(400);

    await givePlan(user.id, { extraMaps: 1 });
    const created = await agent.post('/api/maps').send(NEW_MAP);
    expect(created.status).toBe(201);
    const extra = data(created).map;
    expect((await agent.post('/api/maps').send(NEW_MAP)).status).toBe(402);

    // First Class's price for an extra map
    await givePlan(user.id, { plan: 'PREMIUM', extraMaps: 1 });
    expect((await agent.post('/api/maps').send(NEW_MAP)).body.message).toMatch(/An extra map costs £5\.99 a month or £59 a year\.$/);

    // A subscription that has ended pays for nothing: the extra map is locked, not deleted
    await givePlan(user.id, { extraMaps: 1, status: 'canceled' });
    const maps = data(await agent.get('/api/maps')).maps;
    expect(maps.find((m) => m.id === extra.id)).toMatchObject({ locked: true, graceUntil: null });
    expect(maps.find((m) => m.isDefault)).toMatchObject({ locked: false, graceUntil: null });
    expect(await prisma.travelMap.count({ where: { ownerId: user.id } })).toBe(2);
  });

  it('a locked map takes no photos but stays editable; the owner picks the main map', async () => {
    const owner = await signUp('Locky');
    await givePlan(owner.user.id, { extraMaps: 1 });
    const home = await defaultMapOf(owner.agent);
    const extra = data(await owner.agent.post('/api/maps').send(NEW_MAP)).map;
    expect((await uploadPhoto(owner.agent, extra.id, { countryCode: 'FR' })).status).toBe(201);

    // Presigned while paid for, confirmed after the subscription ended
    const early = await presign(owner.agent, extra.id, ['THUMB', 'DISPLAY', 'PRINT']);
    expect(early.status).toBe(200);
    const { photoId, uploads } = data(early);
    for (const u of uploads) globalThis.__fakeR2.set(u.key, { bytes: 1000, contentType: 'image/jpeg' });
    await givePlan(owner.user.id, { extraMaps: 0 });

    const confirm = await owner.agent.post(`/api/maps/${extra.id}/photos`).send({
      photoId,
      width: 10,
      height: 10,
      variants: uploads.map((u) => ({ size: u.size, key: u.key, width: 10, height: 10 })),
    });
    expect(confirm.status).toBe(403);
    expect(confirm.body.message).toBe(LOCKED);
    expect(uploads.some((u) => inBucket(u.key))).toBe(false);
    expect(await prisma.photo.findUnique({ where: { id: photoId } })).toBeNull();

    const refused = await presign(owner.agent, extra.id, ['THUMB', 'DISPLAY', 'PRINT']);
    expect(refused.status).toBe(403);
    expect(refused.body.message).toBe(LOCKED);

    // Still viewable and editable: countries, trips
    expect((await owner.agent.put(`/api/maps/${extra.id}/visits/JP`).send({ status: 'VISITED' })).status).toBe(200);
    expect((await owner.agent.post(`/api/maps/${extra.id}/trips`).send({ title: 'Still planning' })).status).toBe(201);
    const view = data(await owner.agent.get(`/api/maps/${extra.id}`)).map;
    expect(view).toMatchObject({ locked: true, uploadRules: { locked: true } });
    expect(view.photoCounts).toEqual({ FR: 1 });

    // Making it the main map unlocks it, and locks the old default instead
    const main = await owner.agent.post(`/api/maps/${extra.id}/main`);
    expect(main.status).toBe(200);
    expect(data(main).map).toMatchObject({ id: extra.id, isDefault: true, locked: false });
    const rows = await prisma.travelMap.findMany({ where: { ownerId: owner.user.id }, select: { id: true, isDefault: true, defaultForOwnerId: true } });
    expect(rows.find((m) => m.id === extra.id)).toMatchObject({ isDefault: true, defaultForOwnerId: owner.user.id });
    expect(rows.find((m) => m.id === home.id)).toMatchObject({ isDefault: false, defaultForOwnerId: null });
    expect((await uploadPhoto(owner.agent, extra.id, { countryCode: 'FR' })).status).toBe(201);
    expect((await presign(owner.agent, home.id, ['THUMB', 'DISPLAY', 'PRINT'])).status).toBe(403);
    // Nobody else can choose it
    const stranger = await signUp('NotOwner');
    expect((await stranger.agent.post(`/api/maps/${home.id}/main`)).status).toBe(404);
  });
});

describe('the best copy kept follows the owner’s plan', () => {
  it('Economy keeps a JPEG print copy, never the original', async () => {
    const owner = await signUp('Thrifty');
    const map = await defaultMapOf(owner.agent);

    const saved = await uploadPhoto(owner.agent, map.id, { countryCode: 'IT' });
    expect(saved.status).toBe(201);
    expect(saved.uploadedKeys.some((k) => /\/print-[^/]+\.jpg$/.test(k))).toBe(true);
    const photo = data(saved).photo;
    expect(photo.bestCopy).toBe('PRINT');
    expect(photo.originalUrl).toContain('X-Amz-Signature=');
    expect(photo.originalUrl).toContain('/print-');

    const original = await presign(owner.agent, map.id, ['THUMB', 'DISPLAY', 'ORIGINAL']);
    expect(original.status).toBe(400);
    expect(original.body.message).toBe('Economy keeps a print-quality copy, not the original.');
    expect((await presign(owner.agent, map.id, ['THUMB', 'DISPLAY'])).status).toBe(400);
    // JPEG only, 5 MB at most
    const webp = await owner.agent.post(`/api/maps/${map.id}/photos/presign`).send({
      files: [
        { size: 'THUMB', contentType: 'image/jpeg', bytes: 10 },
        { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 10 },
        { size: 'PRINT', contentType: 'image/webp', bytes: 10 },
      ],
    });
    expect(webp.status).toBe(400);
    const big = await owner.agent.post(`/api/maps/${map.id}/photos/presign`).send({
      files: [
        { size: 'THUMB', contentType: 'image/jpeg', bytes: 10 },
        { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 10 },
        { size: 'PRINT', contentType: 'image/jpeg', bytes: 6 * 1024 * 1024 },
      ],
    });
    expect(big.status).toBe(413);
  });

  it('Business keeps the original, whoever uploads; an editor’s own plan adds nothing', async () => {
    const owner = await signUp('Business');
    const editor = await signUp('FreeEditor');
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    const map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });

    const saved = await uploadPhoto(editor.agent, map.id, { countryCode: 'IT', sizes: ORIGINAL_SIZES });
    expect(saved.status).toBe(201);
    expect(data(saved).photo).toMatchObject({ bestCopy: 'ORIGINAL' });
    const print = await presign(editor.agent, map.id, ['THUMB', 'DISPLAY', 'PRINT']);
    expect(print.status).toBe(400);
    expect(print.body.message).toBe('This map keeps the original, so it needs no print copy.');

    // A First Class editor on an Economy map still keeps print copies there
    const editorsMap = await defaultMapOf(editor.agent);
    await givePlan(editor.user.id, { plan: 'PREMIUM' });
    await editor.agent.post(`/api/maps/${editorsMap.id}/members`).send({ email: owner.email, role: 'EDITOR' });
    await givePlan(owner.user.id, { plan: 'FREE', status: 'canceled' });
    expect((await presign(editor.agent, map.id, ORIGINAL_SIZES)).status).toBe(400);
    // Downgrading kept the original already saved
    expect(data(await owner.agent.get(`/api/photos/${data(saved).photo.id}`)).photo.bestCopy).toBe('ORIGINAL');
    // And the editor's own map follows the editor's plan
    expect((await uploadPhoto(owner.agent, editorsMap.id, { countryCode: 'IT', sizes: ORIGINAL_SIZES })).status).toBe(201);
  });
});

describe('photos per country', () => {
  it('stops at the cap: at presign with a hint, at confirm with the final country, and on a move', async () => {
    const owner = await signUp('Capped');
    const editor = await signUp('CapEditor');
    const map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });
    // 29 of France already, hidden ones counting too, from both uploaders
    await fillCountry(map.id, owner.user.id, 'FR', 20);
    await fillCountry(map.id, editor.user.id, 'FR', 9, { hidden: true });

    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', countryHint: 'FR' })).status).toBe(201);
    expect(data(await owner.agent.get(`/api/maps/${map.id}`)).map.photoCounts).toEqual({ FR: 30 });

    const full = '30 of 30 photos of France on this map. Upgrade to add more.';
    const early = await presign(editor.agent, map.id, ['THUMB', 'DISPLAY', 'PRINT'], { countryCode: 'FR' });
    expect(early.status).toBe(409);
    expect(early.body).toEqual({ status: 'fail', message: full });
    expect((await presign(editor.agent, map.id, ['THUMB', 'DISPLAY', 'PRINT'], { countryCode: 'ZZ' })).status).toBe(400);

    // No hint: refused at confirm, and the upload's files are deleted
    const late = await uploadPhoto(editor.agent, map.id, { countryCode: 'FR' });
    expect(late.status).toBe(409);
    expect(late.body.message).toBe(full);
    expect(late.uploadedKeys.some(inBucket)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: late.uploadedKeys } } })).toBe(0);

    // The final country is the GPS one: chosen Spain, taken in Paris
    const gps = await uploadPhoto(owner.agent, map.id, { ...NEAR_EIFFEL, countryCode: 'ES', countryHint: 'ES' });
    expect(gps.status).toBe(409);
    expect(gps.body.message).toBe(full);

    // Moving a photo into the full country is refused too
    const spanish = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'ES' })).photo;
    const move = await owner.agent.patch(`/api/photos/${spanish.id}`).send({ countryCode: 'FR' });
    expect(move.status).toBe(409);
    expect(move.body.message).toBe(full);
    expect(await prisma.photo.findUnique({ where: { id: spanish.id } })).toMatchObject({ countryCode: 'ES' });
    // Other changes, and photos with no country, are fine
    expect((await owner.agent.patch(`/api/photos/${spanish.id}`).send({ caption: 'Madrid' })).status).toBe(200);
    expect((await uploadPhoto(owner.agent, map.id, {})).status).toBe(201);

    // Deleting one frees a place
    const one = await prisma.photo.findFirst({ where: { mapId: map.id, countryCode: 'FR' }, select: { id: true } });
    await prisma.photo.delete({ where: { id: one.id } });
    expect((await owner.agent.patch(`/api/photos/${spanish.id}`).send({ countryCode: 'FR' })).status).toBe(200);

    // Business has room for more
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    expect((await presign(editor.agent, map.id, ORIGINAL_SIZES, { countryCode: 'FR' })).status).toBe(200);
  });

  it('the storage safety net stops a Business map at 50 GB', async () => {
    const owner = await signUp('Hoarder2');
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    const map = await defaultMapOf(owner.agent);
    // 25 photos whose files hold 2 GB each: 50 GB in all
    for (let i = 0; i < 25; i++) {
      const id = crypto.randomUUID();
      const media = await prisma.mediaItem.create({
        data: {
          key: `myplanetview/photos/${map.id}/${id}/thumb-big${i}.jpg`,
          resource: 'photo',
          kind: 'IMAGE',
          visibility: 'PRIVATE',
          contentType: 'image/jpeg',
          bytes: 2_000_000_000,
          ownerId: owner.user.id,
        },
      });
      await prisma.photo.create({
        data: {
          id,
          mapId: map.id,
          uploaderId: owner.user.id,
          width: 10,
          height: 10,
          variants: { create: { size: 'THUMB', mediaId: media.id, width: 10, height: 10 } },
        },
      });
    }
    const res = await uploadPhoto(owner.agent, map.id, { countryCode: 'PT', sizes: ORIGINAL_SIZES });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('This map has used its 50 GB of photo storage. Delete some photos to add more.');
    expect(res.uploadedKeys.some(inBucket)).toBe(false);
    // First Class has 200 GB
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'PT', sizes: ORIGINAL_SIZES })).status).toBe(201);
  });
});

describe('plan fields on maps and trips', () => {
  it('the owner and editors see the owner’s plan; viewers and share links never do', async () => {
    const owner = await signUp('Planner');
    const editor = await signUp('PlanEditor');
    const viewer = await signUp('PlanViewer');
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    const map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
    await fillCountry(map.id, owner.user.id, 'GR', 3, { hidden: true });

    const expected = {
      plan: { id: 'REGULAR', name: 'Business', photosPerCountry: 200, keepsOriginals: true, videos: false, storageCapBytes: 50e9 },
      locked: false,
      graceUntil: null,
      photoCounts: { GR: 3 },
      uploadRules: { keepsOriginals: true, photosPerCountry: 200, locked: false },
    };
    for (const who of [owner, editor]) {
      expect(data(await who.agent.get(`/api/maps/${map.id}`)).map).toMatchObject(expected);
    }
    const planKeys = ['plan', 'locked', 'graceUntil', 'photoCounts', 'uploadRules'];
    const viewed = data(await viewer.agent.get(`/api/maps/${map.id}`)).map;
    for (const key of planKeys) expect(viewed).not.toHaveProperty(key);

    // Through the share link, even for an editor
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    for (const agent of [anon(), editor.agent]) {
      const shared = data(await agent.get(`/api/shared/${shareCode}`)).map;
      for (const key of planKeys) expect(shared).not.toHaveProperty(key);
    }
    // GET /maps: only your own maps say whether they're locked
    const editorsList = data(await editor.agent.get('/api/maps')).maps;
    expect(editorsList.find((m) => m.id === map.id)).not.toHaveProperty('locked');
  });

  it('a trip tells anyone who can upload to it the rules, trip-only editors included', async () => {
    const owner = await signUp('TripPlanner');
    const tripEditor = await signUp('TripOnlyEditor');
    const tripViewer = await signUp('TripOnlyViewer');
    const map = await defaultMapOf(owner.agent);
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Stag do' })).trip;
    expect(trip.uploadRules).toEqual({ keepsOriginals: false, photosPerCountry: 30, videos: null, locked: false });
    await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: tripEditor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: tripViewer.email, role: 'VIEWER' });

    expect(data(await tripEditor.agent.get(`/api/trips/${trip.id}`)).trip.uploadRules).toEqual({
      keepsOriginals: false,
      photosPerCountry: 30,
      videos: null,
      locked: false,
    });
    // Changing the trip answers with the same shape
    const patched = data(await tripEditor.agent.patch(`/api/trips/${trip.id}`).send({ title: 'Stag do 2026' })).trip;
    expect(patched.uploadRules).toMatchObject({ keepsOriginals: false });
    expect(data(await tripViewer.agent.get(`/api/trips/${trip.id}`)).trip).not.toHaveProperty('uploadRules');

    await owner.agent.patch(`/api/trips/${trip.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/trips/${trip.id}/sharing`));
    for (const agent of [anon(), tripEditor.agent]) {
      expect(data(await agent.get(`/api/shared/${shareCode}`)).trip).not.toHaveProperty('uploadRules');
    }

    // The owner's plan, whoever looks; a trip-only editor uploads by it
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    expect(data(await tripEditor.agent.get(`/api/trips/${trip.id}`)).trip.uploadRules).toMatchObject({
      keepsOriginals: true,
      photosPerCountry: 1000,
      videos: { perCountry: 20 },
      locked: false,
    });
    const upload = await uploadPhoto(tripEditor.agent, map.id, { tripId: trip.id, countryCode: 'CZ', sizes: ORIGINAL_SIZES });
    expect(upload.status).toBe(201);
  });
});

describe('caps on people', () => {
  const shareEmailTo = (to) => sentEmails().filter((e) => e.to === to && e.template === 'shareEmail');

  it('a map takes 10 editors, members and pending invites together; viewers are unlimited', async () => {
    const owner = await signUp('Crowded');
    const map = await defaultMapOf(owner.agent);
    const members = [await signUp('Ed1'), await signUp('Viewer1')];
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: members[0].email, role: 'EDITOR' })).status).toBe(201);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: members[1].email, role: 'VIEWER' })).status).toBe(201);
    // 9 invites to addresses with no account: 10 editors in all
    const invited = [];
    for (let i = 0; i < 9; i++) {
      const email = testEmail(`editor-invite-${i}`);
      invited.push(email);
      expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email, role: 'EDITOR' })).status).toBe(201);
    }

    const message = 'A map can have up to 10 editors.';
    const eleventh = await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: testEmail('one-too-many'), role: 'EDITOR' });
    expect(eleventh.status).toBe(409);
    expect(eleventh.body).toEqual({ status: 'fail', message });
    const promote = await owner.agent.patch(`/api/maps/${map.id}/members/${members[1].user.id}`).send({ role: 'EDITOR' });
    expect(promote.status).toBe(409);
    expect(promote.body.message).toBe(message);

    // Re-inviting someone already counted, or re-adding an editor, takes no new place
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: invited[0], role: 'EDITOR' })).status).toBe(201);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: members[0].email, role: 'EDITOR' })).status).toBe(201);
    // Viewers are unlimited
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: testEmail('just-looking'), role: 'VIEWER' })).status).toBe(201);

    // An invite holds its place, and accepting it never fails on the cap
    const newcomer = await signUp('editor-invite-late', { verified: true });
    const lateEmail = testEmail('accepting');
    await prisma.shareInvite.deleteMany({ where: { mapId: map.id, email: invited[8] } });
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: lateEmail, role: 'EDITOR' })).status).toBe(201);
    await prisma.user.update({ where: { id: newcomer.user.id }, data: { email: lateEmail } });
    await vi.waitFor(() => expect(shareEmailTo(lateEmail)).toHaveLength(1));
    const token = shareEmailTo(lateEmail)[0].context.actionUrl.split('/').pop();
    expect((await newcomer.agent.post('/api/invites/accept').send({ token })).status).toBe(200);
    expect(await prisma.mapMember.count({ where: { mapId: map.id, role: 'EDITOR' } })).toBe(2);
  });

  it('a trip takes 20 people of any role, apart from the map’s editors', async () => {
    const owner = await signUp('Organiser');
    const map = await defaultMapOf(owner.agent);
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Big group' })).trip;
    const friend = await signUp('TripFriend');
    expect((await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: friend.email, role: 'VIEWER' })).status).toBe(201);
    for (let i = 0; i < 19; i++) {
      const role = i % 2 ? 'VIEWER' : 'EDITOR';
      expect((await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: testEmail(`trip-${i}`), role })).status).toBe(201);
    }
    const message = 'A trip can have up to 20 people.';
    const extra = await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: testEmail('trip-21'), role: 'VIEWER' });
    expect(extra.status).toBe(409);
    expect(extra.body).toEqual({ status: 'fail', message });
    // A role change adds nobody; re-adding someone counted is fine
    expect((await owner.agent.patch(`/api/trips/${trip.id}/members/${friend.user.id}`).send({ role: 'EDITOR' })).status).toBe(200);
    expect((await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: friend.email, role: 'EDITOR' })).status).toBe(201);
    // The map's own editors are counted apart
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: testEmail('map-editor'), role: 'EDITOR' })).status).toBe(201);
  });
});
