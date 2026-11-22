import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectivePlan, extraMapsPaid, subscriptionOf } from '@/dev/mock/plans';
import { ALEX, HOME_MAP, JO, SAM, SAM_MAP, USER, db, freshStore, get, patch, post, put, registerAllRoutes, signOut, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const noSubscription = () => {
  db().subscriptions = db().subscriptions.filter((s) => s.userId !== USER);
};

describe('GET /api/billing', () => {
  it('answers the test user’s plan, and 401 signed out', async () => {
    expect((await get('/api/billing')).data).toMatchObject({ plan: 'REGULAR', extraMapsPaid: 1, paymentsEnabled: true });
    signOut();
    expect((await get('/api/billing')).status).toBe(401);
  });
});

describe('Checkout', () => {
  it('applies a plan at once and sends the person back to their account', async () => {
    noSubscription();
    const { data } = await post('/api/billing/checkout', { plan: 'PREMIUM', interval: 'YEAR' });
    expect(data).toEqual({ url: '/account?billing=success' });
    expect(subscriptionOf(USER)).toMatchObject({ plan: 'PREMIUM', interval: 'YEAR', status: 'active', extraMaps: 0 });
  });

  it('refuses a second subscription, an unknown plan, a bad quantity or nothing at all', async () => {
    expect((await post('/api/billing/checkout', { plan: 'PREMIUM', interval: 'MONTH' })).status).toBe(409);
    noSubscription();
    expect((await post('/api/billing/checkout', { plan: 'GOLD', interval: 'MONTH' })).status).toBe(400);
    expect((await post('/api/billing/checkout', { plan: 'REGULAR', interval: 'WEEK' })).status).toBe(400);
    expect((await post('/api/billing/checkout', { plan: 'REGULAR', interval: 'MONTH', extraMaps: -1 })).status).toBe(400);
    expect((await post('/api/billing/checkout', { plan: 'FREE', interval: 'MONTH' })).message).toBe('Choose a plan, or at least one extra map.');
  });

  it('starts a promo code’s free month on the first paid Checkout, once', async () => {
    noSubscription();
    testUser().promoCodeId = 'promo-samtravels';
    await post('/api/billing/checkout', { plan: 'REGULAR', interval: 'MONTH' });
    expect(subscriptionOf(USER).status).toBe('trialing');
    expect(testUser().promoTrialUsedAt).not.toBeNull();
  });

  it('gives no free month with extra maps in the same Checkout', async () => {
    noSubscription();
    testUser().promoCodeId = 'promo-samtravels';
    await post('/api/billing/checkout', { plan: 'REGULAR', interval: 'MONTH', extraMaps: 2 });
    expect(subscriptionOf(USER)).toMatchObject({ status: 'active', extraMaps: 2 });
    expect(testUser().promoTrialUsedAt ?? null).toBeNull();
  });

  // handlers/billing.js:137 asks whether the offer is usable after line 134 has already made
  // the new live subscription, so usableInviteOffer always says no and the offer is never
  // marked used (it comes back if that subscription ends within the 7 days)
  it('uses the invite offer on the plan it’s for', async () => {
    noSubscription();
    Object.assign(testUser(), { inviteOfferPlan: 'PREMIUM', inviteOfferEndsAt: new Date(Date.now() + 86400000).toISOString(), inviteOfferUsedAt: null });
    await post('/api/billing/checkout', { plan: 'REGULAR', interval: 'MONTH' });
    expect(testUser().inviteOfferUsedAt).not.toBeNull();
  });
});

describe('changing plan and extra maps', () => {
  it('changes the plan of a live subscription, ending a free month', async () => {
    db().subscriptions[0].status = 'trialing';
    const { data } = await post('/api/billing/change-plan', { plan: 'PREMIUM', interval: 'YEAR' });
    expect(data.billing).toMatchObject({ plan: 'PREMIUM', interval: 'YEAR', status: 'active' });
  });

  it('needs a subscription, and stops paying only in the portal', async () => {
    db().subscriptions[0].extraMaps = 0;
    expect((await post('/api/billing/change-plan', { plan: 'FREE', interval: 'MONTH' })).status).toBe(409);
    noSubscription();
    expect((await post('/api/billing/change-plan', { plan: 'PREMIUM', interval: 'MONTH' })).status).toBe(409);
    expect((await post('/api/billing/change-plan', { plan: 'NOPE', interval: 'MONTH' })).status).toBe(400);
  });

  it('changes the extra maps, or buys them with no subscription', async () => {
    expect((await post('/api/billing/extra-maps', { quantity: 3 })).data.billing.extraMapsPaid).toBe(3);
    noSubscription();
    expect((await post('/api/billing/extra-maps', { quantity: 0 })).status).toBe(400);
    expect((await post('/api/billing/extra-maps', { quantity: 2, interval: 'DAY' })).status).toBe(400);
    expect((await post('/api/billing/extra-maps', { quantity: 2 })).data).toEqual({ url: '/account?billing=success' });
    expect(subscriptionOf(USER)).toMatchObject({ plan: 'FREE', extraMaps: 2 });
    expect((await post('/api/billing/extra-maps', { quantity: 0 })).status).toBe(409);
    expect((await post('/api/billing/extra-maps', { quantity: 1.5 })).status).toBe(400);
  });

  it('waits for a free month to end before adding extra maps', async () => {
    db().subscriptions[0].status = 'trialing';
    expect((await post('/api/billing/extra-maps', { quantity: 2 })).message).toBe('Extra maps can be added once your free month ends.');
    expect((await post('/api/billing/extra-maps', { quantity: 0 })).status).toBe(200);
  });

  it('opens the portal only with a billing account', async () => {
    expect((await post('/api/billing/portal')).data).toEqual({ url: '/account' });
    noSubscription();
    expect((await post('/api/billing/portal')).status).toBe(409);
  });
});

describe('leaving', () => {
  it('lists the maps the person owns with who is on them, and their photos elsewhere', async () => {
    db().photos.push({ id: 'p-elsewhere', mapId: SAM_MAP, uploaderId: USER });
    const { data } = await get('/api/users/leaving-options');
    expect(data.maps).toEqual([
      {
        id: HOME_MAP,
        name: "Charlie & Alex's travels",
        members: [
          { userId: ALEX, name: 'Alex Morgan', role: 'EDITOR', isActive: true },
          { userId: SAM, name: 'Sam Rivers', role: 'VIEWER', isActive: true },
        ],
      },
    ]);
    expect(data.photosOnOtherMaps).toBe(1);
  });

  it('saves a plan naming every owned map once, for an hour', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const { data } = await put('/api/users/leaving-plan', { maps: [{ mapId: HOME_MAP, action: 'TRANSFER', toUserId: ALEX }], leavePhotos: false });
    expect(data.leavingPlan).toEqual({ maps: [{ mapId: HOME_MAP, action: 'TRANSFER', toUserId: ALEX }], leavePhotos: false });
    expect(Date.parse(data.expiresAt) - Date.parse(data.savedAt)).toBe(3600000);
    expect(console.info).toHaveBeenCalledWith('[mock] leaving plan saved', expect.any(String));
  });

  it('refuses a plan that misses a map, names one twice, or hands one to someone not on it', async () => {
    const bad = [
      { maps: [] },
      { maps: [{ mapId: HOME_MAP, action: 'DELETE' }, { mapId: HOME_MAP, action: 'DELETE' }] },
      { maps: [{ mapId: HOME_MAP, action: 'TRANSFER', toUserId: JO }] },
      { maps: [{ mapId: HOME_MAP, action: 'DELETE', toUserId: ALEX }] },
      { maps: [{ mapId: HOME_MAP, action: 'KEEP' }] },
      { maps: [{ mapId: HOME_MAP, action: 'DELETE' }], leavePhotos: 'yes' },
      [],
    ];
    for (const body of bad) expect((await put('/api/users/leaving-plan', body)).status).toBe(400);
  });
});

describe('admin memberships', () => {
  const asAdmin = () => (testUser().role = 'ADMIN');

  it('are for admins only', async () => {
    expect((await get(`/api/users/admin/plan-grants/${SAM}`)).status).toBe(403);
    signOut();
    expect((await get(`/api/users/admin/plan-grants/${SAM}`)).status).toBe(401);
  });

  it('gives someone else months of a paid plan, then ends it early', async () => {
    asAdmin();
    const { status, data } = await post(`/api/users/admin/plan-grants/${SAM}`, { plan: 'PREMIUM', months: 24, reason: ' Creator ' });
    expect(status).toBe(201);
    expect(data.grant).toMatchObject({ plan: 'PREMIUM', reason: 'Creator', grantedById: USER, active: true });
    expect(effectivePlan(SAM)).toMatchObject({ plan: 'PREMIUM', source: 'COMPLIMENTARY' });
    expect((await get(`/api/users/admin/plan-grants/${SAM}`)).data).toMatchObject({ plan: 'PREMIUM', source: 'COMPLIMENTARY', grants: [{ id: data.grant.id }] });
    expect((await patch(`/api/users/admin/end-plan-grant/${data.grant.id}`)).data.grant.active).toBe(false);
    expect((await patch(`/api/users/admin/end-plan-grant/${data.grant.id}`)).status).toBe(409);
    expect((await patch('/api/users/admin/end-plan-grant/nope')).status).toBe(404);
  });

  it('refuses a grant to yourself, a free plan, months out of range or no such person', async () => {
    asAdmin();
    expect((await post(`/api/users/admin/plan-grants/${USER}`, { plan: 'PREMIUM', months: 1 })).status).toBe(403);
    expect((await post(`/api/users/admin/plan-grants/${SAM}`, { plan: 'FREE', months: 1 })).status).toBe(400);
    expect((await post(`/api/users/admin/plan-grants/${SAM}`, { plan: 'REGULAR', months: 37 })).status).toBe(400);
    expect((await post('/api/users/admin/plan-grants/nope', { plan: 'REGULAR', months: 1 })).status).toBe(404);
  });
});

describe('an admin’s map transfer', () => {
  const transfer = (body) => post('/api/users/admin/transfer-map', body);

  it('moves a map to an active, verified account by address', async () => {
    testUser().role = 'ADMIN';
    const { data } = await transfer({ mapId: SAM_MAP, toEmail: ' JO@example.test ' });
    expect(data.map).toMatchObject({ id: SAM_MAP, ownerId: JO, previousOwnerId: SAM });
    expect(db().maps.find((m) => m.ownerId === SAM && m.isDefault).name).toBe('My map');
  });

  it('refuses no admin, no map, no account, the owner, the admin and an unverified owner-to-be', async () => {
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'jo@example.test' })).status).toBe(403);
    testUser().role = 'ADMIN';
    expect((await transfer({ mapId: 'nope', toEmail: 'jo@example.test' })).status).toBe(404);
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'nope' })).status).toBe(400);
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'paused@example.test' })).status).toBe(400);
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'sam@example.test' })).message).toBe('You already own this map.');
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'test@myplanetview.local' })).status).toBe(403);
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'jo@example.test', keepOldOwnerAsEditor: 'yes' })).status).toBe(400);
    db().users.find((u) => u.id === JO).emailVerified = false;
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'jo@example.test' })).status).toBe(400);
    db().users.find((u) => u.id === SAM).role = 'DEVELOPER';
    expect((await transfer({ mapId: SAM_MAP, toEmail: 'tom@example.test' })).status).toBe(403);
    expect(extraMapsPaid(USER)).toBe(1);
  });
});
