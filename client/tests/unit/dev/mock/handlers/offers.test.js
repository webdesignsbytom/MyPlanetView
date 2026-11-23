import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exampleOfferId } from '@/dev/mock/seed';
import { db, freshStore, get, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

describe('GET /api/offers', () => {
  it('lists the live offers to anyone, never their links or keys', async () => {
    signOut();
    const { status, data } = await get('/api/offers');
    expect(status).toBe(200);
    expect(data.offers.length).toBeGreaterThan(20);
    for (const offer of data.offers) {
      expect('url' in offer).toBe(false);
      expect('key' in offer).toBe(false);
    }
  });

  it('leaves out an offer turned off', async () => {
    const all = (await get('/api/offers')).data.offers.length;
    db().offers.find((o) => o.id === exampleOfferId(0)).active = false;
    const list = (await get('/api/offers')).data.offers;
    expect(list).toHaveLength(all - 1);
    expect(list.some((o) => o.id === exampleOfferId(0))).toBe(false);
  });
});
