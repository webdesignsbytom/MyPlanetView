import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exampleOfferId } from '@/dev/mock/seed';
import { db, del, freshStore, get, patch, post, registerAllRoutes, signOut, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => {
  freshStore();
  testUser().role = 'ADMIN';
});

const offer = (fields = {}) => ({
  key: 'test-tours-pe',
  partner: 'Test Tours',
  kind: 'TOUR',
  title: 'Tours in Peru',
  countryCode: 'PE',
  placements: ['GALLERY', 'TRAVEL_DESK'],
  url: 'https://www.example.com/tours?q={destination}',
  ...fields,
});

describe('the admin’s travel offers', () => {
  it('are for admins only', async () => {
    testUser().role = 'USER';
    expect((await get('/api/users/admin/offers')).status).toBe(403);
    expect((await post('/api/users/admin/offers', offer())).status).toBe(403);
    expect((await post('/api/users/admin/offers/import', { offers: [offer()] })).status).toBe(403);
    signOut();
    expect((await get('/api/users/admin/offers')).status).toBe(401);
  });

  it('lists every offer with 30 days of clicks, by placement and by day', async () => {
    const { data } = await get('/api/users/admin/offers');
    expect(data.offers).toHaveLength(db().offers.length);
    expect(data.clicksSince).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const first = data.offers.find((o) => o.id === exampleOfferId(0));
    expect(first.url.startsWith('https://')).toBe(true);
    expect(first.clicks).toMatchObject({ total: 4, byPlacement: { GALLERY: 3, TRAVEL_DESK: 1 } });
    expect(first.clicks.byDay).toEqual([{ day: expect.any(String), count: 4 }]);
  });

  it('makes an offer, refusing a taken key or a bad field', async () => {
    const { status, data } = await post('/api/users/admin/offers', offer());
    expect(status).toBe(201);
    expect(data.offer).toMatchObject({ key: 'test-tours-pe', active: true, weight: 1 });
    expect((await post('/api/users/admin/offers', offer())).status).toBe(409);
    expect((await post('/api/users/admin/offers', offer({ key: 'other', url: 'http://insecure.example.com' }))).message).toMatch(/\(url\)$/);
    expect((await post('/api/users/admin/offers', offer({ key: 'other', placements: [] }))).status).toBe(400);
  });

  it('changes and deletes an offer, its tallies with it', async () => {
    const id = exampleOfferId(0);
    expect((await patch(`/api/users/admin/offers/${id}`, { active: false, title: 'Off for now' })).data.offer).toMatchObject({ active: false, title: 'Off for now' });
    expect((await patch(`/api/users/admin/offers/${id}`, { weight: 0 })).status).toBe(400);
    expect((await patch('/api/users/admin/offers/nope', { active: false })).status).toBe(404);
    expect((await del(`/api/users/admin/offers/${id}`)).status).toBe(200);
    expect(db().offerClicks.some((r) => r.offerId === id)).toBe(false);
    expect((await del(`/api/users/admin/offers/${id}`)).status).toBe(404);
  });

  it('imports by key, all or nothing', async () => {
    const existingKey = db().offers[0].key;
    const { data } = await post('/api/users/admin/offers/import', { offers: [offer(), { ...offer({ key: existingKey }), title: 'Updated' }] });
    expect(data).toEqual({ created: 1, updated: 1, keys: ['test-tours-pe', existingKey] });
    expect(db().offers.find((o) => o.key === existingKey).title).toBe('Updated');

    const before = db().offers.length;
    const refused = await post('/api/users/admin/offers/import', { offers: [offer({ key: 'new-one' }), offer({ key: 'bad', url: 'ftp://x' }), offer({ key: 'new-one' })] });
    expect(refused.status).toBe(400);
    expect(refused.body.data.problems).toEqual([
      { index: 1, key: 'bad', field: 'url' },
      { index: 2, key: 'new-one', field: 'key' },
    ]);
    expect(db().offers).toHaveLength(before);
    expect((await post('/api/users/admin/offers/import', { offers: [] })).body.data.problems).toEqual([{ index: null, key: null, field: 'offers' }]);
  });
});
