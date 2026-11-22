// The refusals other files leave out: every admin route refuses a plain user and a visitor,
// an admin's delete keeps the admin rules, and the 403/404/409 answers of routes whose
// success is tested elsewhere (a landmark unticked, a map's upgrade taken back, a travel copy
// declined, a landmark suggestion confirmed, a state unmarked, a share link's country lists).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

// A real UUID that names nothing
const NEVER_A_UUID = '00000000-0000-4000-8000-000000000000';

const ADMIN_ROUTES = [
  ['get', '/api/users/admin/get-all-users'],
  ['get', `/api/users/admin/get-user-by-id/${NEVER_A_UUID}`],
  ['patch', '/api/users/admin/change-user-role'],
  ['patch', `/api/users/admin/deactivate-user/${NEVER_A_UUID}`],
  ['patch', `/api/users/admin/reactivate-user/${NEVER_A_UUID}`],
  ['delete', `/api/users/admin/delete-user-by-id/${NEVER_A_UUID}`],
  ['get', `/api/users/admin/plan-grants/${NEVER_A_UUID}`],
  ['post', `/api/users/admin/plan-grants/${NEVER_A_UUID}`],
  ['patch', `/api/users/admin/end-plan-grant/${NEVER_A_UUID}`],
  ['post', '/api/users/admin/transfer-map'],
  ['get', '/api/users/admin/promo-codes'],
  ['post', '/api/users/admin/promo-codes'],
  ['patch', `/api/users/admin/promo-codes/${NEVER_A_UUID}`],
  ['get', '/api/users/admin/offers'],
  ['post', '/api/users/admin/offers'],
  ['post', '/api/users/admin/offers/import'],
  ['patch', `/api/users/admin/offers/${NEVER_A_UUID}`],
  ['delete', `/api/users/admin/offers/${NEVER_A_UUID}`],
  ['get', '/api/users/admin/themes'],
  ['post', '/api/users/admin/themes'],
  ['patch', `/api/users/admin/themes/${NEVER_A_UUID}`],
  ['delete', `/api/users/admin/themes/${NEVER_A_UUID}`],
  ['get', '/api/contact/get-all-contact-forms'],
  ['delete', `/api/contact/delete-contact-form/${NEVER_A_UUID}`],
  ['delete', '/api/contact/delete-all-contact-forms'],
];

describe('the admin routes', () => {
  it('refuse a plain user (403) and a visitor (401) before looking anything up', async () => {
    const user = await signUp('Not an admin');
    for (const [method, path] of ADMIN_ROUTES) {
      const refused = await user.agent[method](path).send({});
      expect(refused.status, `${method} ${path}`).toBe(403);
      expect(refused.body.message).toBe('This action requires an admin or developer role.');
      expect((await anon()[method](path).send({})).status, `${method} ${path}`).toBe(401);
    }
  });

  it("keep an admin's delete to the admin rules: not yourself, not a developer, not nobody", async () => {
    const admin = await signUp('Deleting admin');
    const developer = await signUp('Kept developer');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
    await prisma.user.update({ where: { id: developer.user.id }, data: { role: 'DEVELOPER' } });
    const remove = (id) => admin.agent.delete(`/api/users/admin/delete-user-by-id/${id}`);

    expect((await remove(admin.user.id)).status).toBe(403);
    const keptDeveloper = await remove(developer.user.id);
    expect(keptDeveloper.status).toBe(403);
    expect(keptDeveloper.body.message).toBe('Only a developer can manage developer accounts.');
    expect((await remove(NEVER_A_UUID)).status).toBe(404);
    expect(await prisma.user.count({ where: { id: { in: [admin.user.id, developer.user.id] } } })).toBe(2);
  });
});

describe('the refusals of routes tested elsewhere', () => {
  let owner;
  let viewer;
  let stranger;
  let map;
  beforeAll(async () => {
    [owner, viewer, stranger] = await Promise.all([signUp('Refusing owner'), signUp('Refused viewer'), signUp('Refused stranger')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
  });

  it('a landmark unticked: a viewer 403, a stranger 404', async () => {
    const colosseum = data(await owner.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum');
    const been = `/api/maps/${map.id}/landmarks/${colosseum.id}/been`;
    expect((await owner.agent.put(been)).status).toBe(200);
    expect((await viewer.agent.delete(been)).status).toBe(403);
    expect((await stranger.agent.delete(been)).status).toBe(404);
    expect(await prisma.landmarkVisit.count({ where: { mapId: map.id, landmarkId: colosseum.id } })).toBe(1);
  });

  it("a map's upgrade taken back: only by its owner", async () => {
    const upgrade = `/api/maps/${map.id}/upgrade`;
    expect((await viewer.agent.delete(upgrade)).status).toBe(403);
    expect((await stranger.agent.delete(upgrade)).status).toBe(404);
    expect((await viewer.agent.post(upgrade)).status).toBe(403);
    expect((await owner.agent.delete(upgrade)).status).toBe(200);
  });

  it('a state unmarked: a viewer 403, a stranger 404', async () => {
    const state = `/api/maps/${map.id}/subdivisions/US-NY`;
    expect((await owner.agent.put(state).send({ status: 'VISITED' })).status).toBe(200);
    expect((await viewer.agent.delete(state)).status).toBe(403);
    expect((await stranger.agent.delete(state)).status).toBe(404);
    expect(await prisma.subdivisionVisit.count({ where: { mapId: map.id } })).toBe(1);
  });

  it('a landmark suggestion confirmed: only by an editor, only with confirmed: true, only one suggested', async () => {
    const res = await uploadPhoto(owner.agent, map.id, { latitude: 48.8575, longitude: 2.2952, countryCode: 'FR' });
    expect(res.status).toBe(201);
    const photo = data(res).photo;
    const eiffelId = photo.landmarks[0].id;
    const confirm = (who, landmarkId = eiffelId, body = { confirmed: true }) =>
      who.agent.patch(`/api/photos/${photo.id}/landmarks/${landmarkId}`).send(body);

    expect((await confirm(viewer)).status).toBe(403);
    expect((await confirm(stranger)).status).toBe(404);
    for (const body of [{}, { confirmed: 'yes' }, { confirmed: false }]) expect((await confirm(owner, eiffelId, body)).status).toBe(400);
    expect((await confirm(owner, NEVER_A_UUID)).status).toBe(404);
    expect((await prisma.photoLandmark.findFirstOrThrow({ where: { photoId: photo.id, landmarkId: eiffelId } })).confirmed).toBe(false);
    expect((await confirm(owner)).status).toBe(200);
  });

  it("a share link's country lists: an unknown code is a 404", async () => {
    expect((await anon().get('/api/shared/K7QX-M2PA-9RTW/country-lists?photos=FR')).status).toBe(404);
    expect((await anon().get('/api/shared/not-a-code/country-lists?photos=FR')).status).toBe(404);
  });
});

describe('declining a travel copy', () => {
  it('is for the family map’s owner: the asker gets 403, a stranger 404, a second answer 409', async () => {
    const [mum, mia, stranger] = await Promise.all([signUp('Declining mum'), signUp('Asking mia'), signUp('Copy stranger')]);
    const [familyMap, miaMap] = await Promise.all([defaultMapOf(mum.agent), defaultMapOf(mia.agent)]);
    const traveller = await prisma.traveller.findFirstOrThrow({ where: { mapId: familyMap.id } });
    // As POST /maps/:mapId/travel-copies leaves it (tested in travelCopies.test.js)
    const request = await prisma.travelCopyRequest.create({
      data: { fromMapId: familyMap.id, toMapId: miaMap.id, travellerId: traveller.id, requestedById: mia.user.id, tripIds: [], momentIds: [], photoIds: [] },
    });
    const decline = (who, id = request.id) => who.agent.post(`/api/travel-copies/${id}/decline`);

    expect((await decline(mia)).status).toBe(403);
    expect((await decline(stranger)).status).toBe(404);
    expect((await decline(mum, NEVER_A_UUID)).status).toBe(404);
    expect((await decline(mum, 'not-an-id')).status).toBe(404);
    expect((await decline(mum)).status).toBe(200);
    const again = await decline(mum);
    expect(again.status).toBe(409);
    expect(again.body.message).toBe('That request has already been answered.');
    expect((await mum.agent.post(`/api/travel-copies/${request.id}/approve`)).status).toBe(409);
  });
});
