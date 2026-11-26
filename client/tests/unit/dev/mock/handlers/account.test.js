import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { receiveMockUpload } from '@/dev/mock/uploads';
import { session } from '@/dev/mock/store';
import { effectivePlan } from '@/dev/mock/plans';
import { HOME_MAP, JO_MAP, USER, db, del, freshStore, get, post, put, registerAllRoutes, setVerified, signOut, stubObjectUrls, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => {
  freshStore();
  stubObjectUrls();
});

const GOOD_PASSWORD = 'Travel#2026';
const signIn = (email, password) => post('/api/auth/sign-in/email', { email, password });

describe('signing in and out', () => {
  it('signs the test user in with the seeded password, whatever the address’s case', async () => {
    signOut();
    const { status, body } = await signIn('TEST@MyPlanetView.local', '12345678');
    expect(status).toBe(200);
    expect(body).toMatchObject({ redirect: false, token: 'mock-session', user: { id: USER, email: 'test@myplanetview.local', role: 'USER' } });
    expect(session.signedIn).toBe(true);
  });

  it('answers better-auth’s 401 for any other address or password', async () => {
    expect(await signIn('alex@example.test', '12345678')).toMatchObject({ status: 401, body: { code: 'INVALID_EMAIL_OR_PASSWORD' } });
    expect((await signIn('test@myplanetview.local', 'wrong')).status).toBe(401);
  });

  it('refuses a missing field, a bad address and a deactivated account', async () => {
    expect((await post('/api/auth/sign-in/email', { password: 'x' })).body.code).toBe('VALIDATION_ERROR');
    expect((await post('/api/auth/sign-in/email', { email: 'x@y.z' })).body.code).toBe('VALIDATION_ERROR');
    expect((await signIn('not-an-address', 'x')).body.code).toBe('INVALID_EMAIL');
    testUser().isActive = false;
    expect((await signIn('test@myplanetview.local', '12345678')).status).toBe(403);
  });

  it('signs out, after which the session is null and the user 401', async () => {
    expect((await post('/api/auth/sign-out')).body).toEqual({ success: true });
    expect((await get('/api/auth/get-session')).body).toBeNull();
    expect((await get('/api/users/user/get-logged-in-user')).status).toBe(401);
    expect((await get('/api/users/map-settings')).status).toBe(401);
  });

  it('gives the session with its user’s role', async () => {
    const { body } = await get('/api/auth/get-session');
    expect(body.session).toMatchObject({ userId: USER, token: 'mock-session' });
    expect(body.user).toMatchObject({ id: USER, role: 'USER', isActive: true, emailVerified: true });
    expect((await get('/api/users/user/get-logged-in-user')).data.user.name).toBe('Charlie Reid');
  });
});

describe('signing up', () => {
  it('makes the test user a new, unverified account with its name', async () => {
    const { status, body } = await post('/api/auth/sign-up/email', { name: ' New\u0000 Person ', email: 'new@example.test', password: GOOD_PASSWORD });
    expect(status).toBe(200);
    expect(body.user).toMatchObject({ name: 'New Person', emailVerified: false });
    expect(testUser()).toMatchObject({ promoCodeId: null, inviteOfferPlan: null });
  });

  it('holds a new password to the rules, and refuses a taken address or an empty name', async () => {
    expect((await post('/api/auth/sign-up/email', { email: 'new@example.test', password: '12345678' })).status).toBe(400);
    expect((await post('/api/auth/sign-up/email', { email: 'new@example.test', password: 'x'.repeat(129) })).status).toBe(400);
    expect((await post('/api/auth/sign-up/email', { email: 'Alex@Example.test', password: GOOD_PASSWORD })).status).toBe(422);
    expect((await post('/api/auth/sign-up/email', { name: '   ', email: 'new@example.test', password: GOOD_PASSWORD })).message).toBe('Enter your name.');
  });

  it('records a usable promo code, and refuses one that can’t be used before anything changes', async () => {
    const bad = await post('/api/auth/sign-up/email', { email: 'new@example.test', password: GOOD_PASSWORD, promoCode: 'NOPE' });
    expect(bad.status).toBe(400);
    expect(testUser().emailVerified).toBe(true);
    await post('/api/auth/sign-up/email', { email: 'new@example.test', password: GOOD_PASSWORD, promoCode: 'samtravels' });
    expect(testUser().promoCodeId).toBe('promo-samtravels');
  });

  it('from an invite’s own link, is verified at once and joins the map', async () => {
    const { body } = await post('/api/auth/sign-up/email', { email: 'test@myplanetview.local', password: GOOD_PASSWORD, inviteToken: 'demo-invite' }).catch(() => ({}));
    // The test user's own address is taken, so the invite is tried with a fresh address
    expect(body.code).toBe('USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL');
    db().invites.find((i) => i.token === 'demo-invite').email = 'invited@example.test';
    const joined = await post('/api/auth/sign-up/email', { email: 'invited@example.test', password: GOOD_PASSWORD, inviteToken: 'demo-invite' });
    expect(joined.body.user.emailVerified).toBe(true);
    expect(db().mapMembers.find((m) => m.mapId === JO_MAP && m.userId === USER)?.role).toBe('VIEWER');
  });
});

describe('passwords, addresses and the account', () => {
  it('resets the password to one that follows the rules, which then signs in', async () => {
    expect((await post('/api/auth/reset-password', { newPassword: 'short' })).status).toBe(400);
    expect((await post('/api/auth/reset-password', { newPassword: GOOD_PASSWORD })).body).toEqual({ status: true });
    expect((await signIn('test@myplanetview.local', '12345678')).status).toBe(401);
    expect((await signIn('test@myplanetview.local', GOOD_PASSWORD)).status).toBe(200);
  });

  it('asks for a reset link with a real address, never saying whether it has an account', async () => {
    expect((await post('/api/auth/request-password-reset', { email: 'nobody@example.test' })).body.status).toBe(true);
    expect((await post('/api/auth/request-password-reset', { email: 'nope' })).status).toBe(400);
    expect((await post('/api/auth/request-password-reset', {})).status).toBe(400);
  });

  it('changes the password only with the current one', async () => {
    expect((await post('/api/auth/change-password', { currentPassword: 'wrong', newPassword: GOOD_PASSWORD })).body.code).toBe('INVALID_PASSWORD');
    expect((await post('/api/auth/change-password', { currentPassword: '12345678', newPassword: 'weak' })).status).toBe(400);
    expect((await post('/api/auth/change-password', { currentPassword: '12345678', newPassword: GOOD_PASSWORD })).status).toBe(200);
    signOut();
    expect((await post('/api/auth/change-password', { currentPassword: GOOD_PASSWORD, newPassword: GOOD_PASSWORD })).status).toBe(401);
  });

  it('gives the same answer for a taken address on change-email, changing nothing', async () => {
    expect((await post('/api/auth/change-email', { newEmail: 'alex@example.test' })).body).toEqual({ status: true });
    expect(testUser().email).toBe('test@myplanetview.local');
    expect((await post('/api/auth/change-email', { newEmail: 'nope' })).status).toBe(400);
  });

  it('renames the account, never to nothing', async () => {
    await post('/api/auth/update-user', { name: 'Charlie R' });
    expect(testUser().name).toBe('Charlie R');
    expect((await post('/api/auth/update-user', { name: '' })).status).toBe(400);
  });

  it('verifies the address, giving a code’s plan for life once', async () => {
    db().promoCodes[0].freePlan = 'PREMIUM';
    testUser().promoCodeId = db().promoCodes[0].id;
    setVerified(false);
    await get('/api/auth/verify-email');
    await get('/api/auth/verify-email');
    expect(testUser().emailVerified).toBe(true);
    expect(db().planGrants.filter((g) => g.userId === USER)).toHaveLength(1);
    expect(effectivePlan(USER).plan).toBe('PREMIUM');
    expect(JSON.parse(localStorage.getItem('mpvMockStore.v7')).users[0].emailVerified).toBe(true);
  });

  it('deletes the account only with its password, starting the demo again', async () => {
    expect((await post('/api/auth/delete-user', {})).status).toBe(400);
    expect((await post('/api/auth/delete-user', { password: 'wrong' })).body.code).toBe('INVALID_PASSWORD');
    db().maps = db().maps.filter((m) => m.id !== HOME_MAP);
    expect((await post('/api/auth/delete-user', { password: '12345678' })).body).toEqual({ success: true });
    expect(session.signedIn).toBe(false);
    expect(db().maps.some((m) => m.id === HOME_MAP)).toBe(true);
  });
});

describe('avatars and generic uploads', () => {
  async function presign(body) {
    return post('/api/media-services/presign-url', body);
  }

  it('saves the user’s own confirmed avatar, and removes it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { body } = await presign({ resource: 'avatar', contentType: 'image/png', bytes: 3 });
    expect(body.key).toMatch(new RegExp(`^myplanetview/avatars/${USER}/.+\\.png$`));
    expect((await post('/api/users/user/upload-or-change-avatar', { key: body.key })).status).toBe(400);
    await receiveMockUpload(body.url, new Blob(['abc']), 'image/png');
    expect((await post('/api/media-services/confirm-upload', { key: body.key })).body).toEqual({ key: body.key, bytes: 3 });
    const saved = await post('/api/users/user/upload-or-change-avatar', { key: body.key });
    expect(saved.data.avatar.media).toMatchObject({ key: body.key, contentType: 'image/png' });
    expect(testUser().image).toMatch(/^blob:/);
    await del('/api/users/user/remove-avatar');
    expect(testUser().image).toBeNull();
  });

  it('refuses an unknown resource, an image type it doesn’t take, a bad size and an unverified avatar', async () => {
    expect((await presign({ resource: 'photo', contentType: 'image/png', bytes: 3 })).status).toBe(400);
    expect((await presign({ resource: 'avatar', contentType: 'image/svg+xml', bytes: 3 })).status).toBe(400);
    expect((await presign({ resource: 'avatar', contentType: 'image/png', bytes: 6 * 1024 * 1024 })).status).toBe(413);
    setVerified(false);
    expect((await presign({ resource: 'avatar', contentType: 'image/png', bytes: 3 })).status).toBe(403);
    expect((await presign({ resource: 'contact', contentType: 'image/png', bytes: 3 })).status).toBe(200);
  });

  it('takes a contact image signed out, but not an avatar', async () => {
    signOut();
    expect((await presign({ resource: 'avatar', contentType: 'image/png', bytes: 3 })).status).toBe(401);
    const contact = await presign({ resource: 'contact', contentType: 'image/gif', bytes: 3 });
    expect(contact.body.key).toMatch(/^myplanetview\/contact\/anon\/.+\.gif$/);
    expect((await post('/api/media-services/confirm-upload', { key: contact.body.key })).status).toBe(400);
    expect((await post('/api/media-services/confirm-upload', { key: 'unknown' })).status).toBe(404);
  });
});

describe('map settings', () => {
  it('keeps the viewer’s known settings, refusing an unknown value', async () => {
    const { data } = await put('/api/users/map-settings', { mapSettings: { style: 'starry', showGrid: false, countriesAsked: true, extra: 1 } });
    expect(data.mapSettings).toEqual({ style: 'starry', showGrid: false, countriesAsked: true });
    expect((await get('/api/users/map-settings')).data.mapSettings).toEqual(data.mapSettings);
    expect((await put('/api/users/map-settings', { mapSettings: { style: 'jupiter' } })).status).toBe(400);
    // The engraved ocean (25 Nov 2026)
    expect((await put('/api/users/map-settings', { mapSettings: { style: 'engraved' } })).data.mapSettings).toEqual({ style: 'engraved' });
    expect((await put('/api/users/map-settings', { mapSettings: { showGrid: 'yes' } })).status).toBe(400);
    expect((await put('/api/users/map-settings', { mapSettings: { landmarkPins: 'stamped' } })).data.mapSettings).toEqual({ landmarkPins: 'stamped' });
    // The celebration screen's switch (24 Nov 2026)
    expect((await put('/api/users/map-settings', { mapSettings: { showCelebrations: false } })).data.mapSettings).toEqual({ showCelebrations: false });
    expect((await put('/api/users/map-settings', { mapSettings: { showCelebrations: 'off' } })).status).toBe(400);
    // The supporter badge's switch (24 Nov 2026)
    expect((await put('/api/users/map-settings', { mapSettings: { showSupporterBadge: false } })).data.mapSettings).toEqual({ showSupporterBadge: false });
    expect((await put('/api/users/map-settings', { mapSettings: { showSupporterBadge: 'off' } })).status).toBe(400);
    // The distances' unit (24 Nov 2026)
    expect((await put('/api/users/map-settings', { mapSettings: { distanceUnit: 'miles' } })).data.mapSettings).toEqual({ distanceUnit: 'miles' });
    expect((await put('/api/users/map-settings', { mapSettings: { distanceUnit: 'furlongs' } })).status).toBe(400);
  });
});

describe('reference data', () => {
  it('lists every place with its kind, and the landmarks by country', async () => {
    const { data } = await get('/api/countries');
    expect(data.countries.find((c) => c.code === 'AQ').kind).toBe('SPECIAL');
    expect(data.countries.find((c) => c.code === 'FR').kind).toBe('COUNTRY');
    expect((await get('/api/landmarks')).data.landmarks).toHaveLength(1366);
    const french = (await get('/api/landmarks', { country: 'FR' })).data.landmarks;
    expect(french.every((l) => l.countryCode === 'FR')).toBe(true);
    // Each with its Wikidata item, as the server's (the celebration finds a model by it)
    expect(french.find((l) => l.name === 'Eiffel Tower').wikidataId).toBe('Q243');
  });
});
