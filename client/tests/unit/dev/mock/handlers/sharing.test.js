import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ALEX, HOME_MAP, JO, JO_MAP, MORGANS_MAP, SAM, SAM_MAP, TOM, TOM_MAP, USER, db, del, freshStore, get, patch, post, registerAllRoutes, setVerified, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const map = (id) => db().maps.find((m) => m.id === id);
const member = (mapId, userId) => db().mapMembers.find((m) => m.mapId === mapId && m.userId === userId);
const addUser = (id, fields = {}) => db().users.push({ id, name: id, email: `${id}@example.test`, role: 'USER', emailVerified: true, isActive: true, ...fields });

describe('a map’s sharing settings', () => {
  it('shows the owner who has access, the link and pending invites', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/sharing`);
    expect(data).toMatchObject({ owner: { userId: USER }, linkAccess: 'RESTRICTED', shareCode: 'K7QX-M2PA-9RTW' });
    expect(data.shareUrl).toMatch(/\/shared\/K7QX-M2PA-9RTW$/);
    expect(data.members.map((m) => [m.userId, m.role])).toEqual([
      [ALEX, 'EDITOR'],
      [SAM, 'VIEWER'],
    ]);
    expect(data.invites.map((i) => i.email)).toEqual(['jo@example.test']);
  });

  it('is the owner’s and co-owners’ only: 403 for anyone else on it, 404 for strangers', async () => {
    expect((await get(`/api/maps/${SAM_MAP}/sharing`)).status).toBe(403);
    expect((await get(`/api/maps/${TOM_MAP}/sharing`)).status).toBe(404);
    member(MORGANS_MAP, USER).role = 'CO_OWNER';
    expect((await get(`/api/maps/${MORGANS_MAP}/sharing`)).status).toBe(200);
  });

  it('turns the link on, and makes a new code', async () => {
    expect((await patch(`/api/maps/${HOME_MAP}/sharing`, { linkAccess: 'ANYONE_WITH_LINK' })).data.linkAccess).toBe('ANYONE_WITH_LINK');
    expect((await patch(`/api/maps/${HOME_MAP}/sharing`, { linkAccess: 'PUBLIC' })).status).toBe(400);
    const { data } = await post(`/api/maps/${HOME_MAP}/sharing/reset-link`);
    expect(data.shareCode).not.toBe('K7QX-M2PA-9RTW');
    expect(map(HOME_MAP).shareCode).toBe(data.shareCode.replaceAll('-', ''));
  });
});

describe('adding people', () => {
  it('adds an active, verified account at once, and invites anyone else', async () => {
    const added = await post(`/api/maps/${HOME_MAP}/members`, { email: ' TOM@example.test ', role: 'VIEWER' });
    expect(added.status).toBe(201);
    expect(added.data.member).toMatchObject({ userId: TOM, role: 'VIEWER' });
    const invited = await post(`/api/maps/${HOME_MAP}/members`, { email: 'new@example.test', role: 'EDITOR' });
    expect(invited.data.invite).toMatchObject({ email: 'new@example.test', role: 'EDITOR' });
    // A deactivated account gets an invite, never access
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'paused@example.test', role: 'VIEWER' })).data.invite).toBeDefined();
    expect(member(HOME_MAP, 'mock-paused')).toBeUndefined();
  });

  it('refuses a bad address or role, the owner and yourself', async () => {
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'nope', role: 'VIEWER' })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'x@example.test', role: 'OWNER' })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'test@myplanetview.local', role: 'VIEWER' })).message).toBe('That is your own address.');
    expect((await post('/api/trips/trip-italy/members', { email: 'x@example.test', role: 'CO_OWNER' })).message).toBe('Role must be VIEWER or EDITOR.');
  });

  it('holds 5 editors a map, pending invites counted', async () => {
    for (let i = 0; i < 4; i++) expect((await post(`/api/maps/${HOME_MAP}/members`, { email: `e${i}@example.test`, role: 'EDITOR' })).status).toBe(201);
    const full = await post(`/api/maps/${HOME_MAP}/members`, { email: 'e5@example.test', role: 'EDITOR' });
    expect(full.status).toBe(409);
    expect(full.message).toBe('A map can have up to 5 editors.');
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'v@example.test', role: 'VIEWER' })).status).toBe(201);
  });

  it('holds 20 people a trip', async () => {
    for (let i = 0; i < 20; i++) db().tripMembers.push({ tripId: 'trip-italy', userId: `t${i}`, role: 'VIEWER' });
    expect((await post('/api/trips/trip-italy/members', { email: 'one-more@example.test', role: 'VIEWER' })).message).toBe('A trip can have up to 20 people.');
  });

  it('makes a co-owner of one of the travellers, one fewer than there are', async () => {
    const { data } = await post(`/api/maps/${HOME_MAP}/members`, { email: 'alex@example.test', role: 'CO_OWNER', travellerId: 'trav-alex' });
    expect(data.member).toMatchObject({ userId: ALEX, role: 'CO_OWNER', travellerId: 'trav-alex', travellerName: 'Alex' });
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'sam@example.test', role: 'CO_OWNER', travellerId: 'trav-test' })).status).toBe(409);
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'sam@example.test', role: 'CO_OWNER' })).status).toBe(400);
  });

  it('needs the sharer’s own address verified', async () => {
    setVerified(false);
    expect((await post(`/api/maps/${HOME_MAP}/members`, { email: 'tom@example.test', role: 'VIEWER' })).status).toBe(403);
  });
});

describe('changing and removing people', () => {
  it('changes a role, and lets only the owner change or remove a co-owner', async () => {
    expect((await patch(`/api/maps/${HOME_MAP}/members/${SAM}`, { role: 'EDITOR' })).data.member.role).toBe('EDITOR');
    expect((await patch(`/api/maps/${HOME_MAP}/members/nope`, { role: 'EDITOR' })).status).toBe(404);
    member(MORGANS_MAP, USER).role = 'CO_OWNER';
    db().mapMembers.push({ mapId: MORGANS_MAP, userId: JO, role: 'CO_OWNER' });
    db().travellers.find((t) => t.id === 'trav-morgan-nora').userId = JO;
    expect((await patch(`/api/maps/${MORGANS_MAP}/members/${JO}`, { role: 'VIEWER' })).status).toBe(403);
    expect((await del(`/api/maps/${MORGANS_MAP}/members/${JO}`)).status).toBe(403);
  });

  it('removes a member, letting go of their traveller, and lets anyone leave', async () => {
    member(HOME_MAP, ALEX).role = 'CO_OWNER';
    expect((await del(`/api/maps/${HOME_MAP}/members/${ALEX}`)).status).toBe(200);
    expect(db().travellers.find((t) => t.id === 'trav-alex').userId).toBeNull();
    expect((await del(`/api/maps/${SAM_MAP}/members/${USER}`)).status).toBe(200);
    expect(member(SAM_MAP, USER)).toBeUndefined();
    expect((await del(`/api/maps/${TOM_MAP}/members/${TOM}`)).status).toBe(404);
  });

  it('takes away the trip links someone added when they leave the trip', async () => {
    db().tripMembers.push({ tripId: 'trip-tom-stag', userId: USER, role: 'EDITOR' });
    db().tripMaps.push({ tripId: 'trip-tom-stag', mapId: 'other-map', addedById: USER });
    await del(`/api/trips/trip-tom-stag/members/${USER}`);
    expect(db().tripMaps.map((l) => l.addedById)).toEqual([ALEX]);
  });

  it('cancels an invite', async () => {
    expect((await del(`/api/maps/${HOME_MAP}/invites/invite-jo`)).status).toBe(200);
    expect(db().invites.some((i) => i.id === 'invite-jo')).toBe(false);
  });
});

describe('invites', () => {
  it('says what an invite is for, with the paid map’s offer', async () => {
    signOut();
    const { data } = await get('/api/invites/demo-invite');
    expect(data.invite).toMatchObject({ email: 'test@myplanetview.local', role: 'VIEWER', kind: 'map', id: JO_MAP, name: "Jo's family trips", invitedBy: 'Jo Patel', offer: null });
    expect((await get('/api/invites/nope')).status).toBe(404);
  });

  it('accepts the demo invite to Jo’s map, once', async () => {
    const { data } = await post('/api/invites/accept', { token: 'demo-invite' });
    expect(data).toEqual({ resource: 'map', id: JO_MAP });
    expect(member(JO_MAP, USER).role).toBe('VIEWER');
    expect((await post('/api/invites/accept', { token: 'demo-invite' })).status).toBe(400);
  });

  it('refuses an invite for another address, unverified, or signed out', async () => {
    db().invites.find((i) => i.id === 'invite-demo').email = 'someone@example.test';
    expect((await post('/api/invites/accept', { token: 'demo-invite' })).status).toBe(403);
    signOut();
    expect((await post('/api/invites/accept', { token: 'demo-invite' })).status).toBe(401);
  });

  it('never lowers a role the person has already', async () => {
    db().mapMembers.push({ mapId: JO_MAP, userId: USER, role: 'EDITOR' });
    await post('/api/invites/accept', { token: 'demo-invite' });
    expect(member(JO_MAP, USER).role).toBe('EDITOR');
  });
});

describe('share links', () => {
  it('opens a map with link access on, signed in or not, whatever the code’s case and dashes', async () => {
    signOut();
    const { data } = await get('/api/shared/samg-4pye-ar22');
    expect(data).toMatchObject({ resource: 'map', id: SAM_MAP, role: 'VIEWER', map: { ads: { every: 12 } } });
    expect('countryCodes' in data.trips[0]).toBe(false);
    expect('uploadRules' in data.map).toBe(false);
  });

  it('answers 404 for a restricted link with no role, and anything that isn’t a code', async () => {
    signOut();
    for (const code of ['K7QXM2PA9RTW', 'not-a-code', 'K7QXM2PA9RT0', '']) expect((await get(`/api/shared/${code}`)).status).toBe(404);
  });

  it('opens a restricted map for someone with a role on it', async () => {
    expect((await get('/api/shared/K7QXM2PA9RTW')).data.role).toBe('OWNER');
  });

  it('opens a trip with link access, without its map', async () => {
    const trip = db().trips.find((t) => t.id === 'trip-italy');
    trip.linkAccess = 'ANYONE_WITH_LINK';
    signOut();
    const { data } = await get('/api/shared/TRPT-AK7S-MR42');
    expect(data).toMatchObject({ resource: 'trip', id: 'trip-italy', role: 'VIEWER', trip: { canOpenMap: false, canDelete: false } });
    const photos = (await get('/api/shared/TRPTAK7SMR42/photos')).data.photos;
    expect(photos.map((p) => p.tripId)).toEqual(['trip-italy', 'trip-italy', 'trip-italy']);
    expect((await get('/api/shared/TRPTAK7SMR42/subdivisions', { country: 'IT' })).status).toBe(404);
  });

  it('never shows a link visitor hidden photos, GPS, originals or best copies', async () => {
    map(HOME_MAP).linkAccess = 'ANYONE_WITH_LINK';
    signOut();
    const list = (await get('/api/shared/K7QXM2PA9RTW/photos', { limit: 60 })).data.photos;
    expect(list).toHaveLength(15);
    expect((await get('/api/shared/K7QXM2PA9RTW/photos', { best: 1 })).status).toBe(403);
    expect((await get('/api/shared/K7QXM2PA9RTW/photos/photo-hidden')).status).toBe(404);
    const shown = (await get('/api/shared/K7QXM2PA9RTW/photos/photo-eiffel')).data.photo;
    expect('latitude' in shown || 'originalUrl' in shown).toBe(false);
    expect((await get('/api/shared/K7QXM2PA9RTW/photos/photo-bangkok')).status).toBe(404);
  });

  it('gives a link visitor the moments, states, pins and country lists, never hidden ones', async () => {
    map(HOME_MAP).linkAccess = 'ANYONE_WITH_LINK';
    signOut();
    expect((await get('/api/shared/K7QXM2PA9RTW/moments')).data.moments.some((m) => m.id === 'moment-party')).toBe(false);
    expect((await get('/api/shared/K7QXM2PA9RTW/subdivisions', { country: 'US' })).data.subdivisions).toHaveLength(2);
    expect((await get('/api/shared/K7QXM2PA9RTW/subdivisions', { country: 'AQ' })).status).toBe(400);
    expect((await get('/api/shared/K7QXM2PA9RTW/pins', { country: 'FR' })).data.pins.map((p) => p.id)).toEqual(['pin-paris']);
    expect((await get('/api/shared/K7QXM2PA9RTW/pins/pin-paris')).data.pin.visits).toHaveLength(2);
    db().pins[0].hidden = true;
    expect((await get('/api/shared/K7QXM2PA9RTW/pins/pin-paris')).status).toBe(404);
    expect((await get('/api/shared/K7QXM2PA9RTW/country-lists', { photos: 'PT' })).data.photos.PT.photos).toEqual([]);
  });
});

describe('a trip’s sharing', () => {
  it('is its map owner’s: a trip-only editor can’t manage it', async () => {
    expect((await get('/api/trips/trip-italy/sharing')).status).toBe(200);
    expect((await get('/api/trips/trip-jo-lisbon/sharing')).status).toBe(403);
    expect((await get('/api/trips/trip-tom-stag/sharing')).status).toBe(404);
    addUser('extra');
    expect((await post('/api/trips/trip-italy/members', { email: 'extra@example.test', role: 'EDITOR' })).data.member.role).toBe('EDITOR');
  });
});
