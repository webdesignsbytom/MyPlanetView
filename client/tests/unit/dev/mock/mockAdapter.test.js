import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import {
  MOCK_UPLOAD_ORIGIN,
  RANK,
  VERIFY_EMAIL_FIRST,
  deny,
  fail,
  mockAdapter,
  ok,
  raw,
  storeUpload,
  verifyFirst,
} from '@/dev/mock/mockAdapter';
import { session } from '@/dev/mock/store';
import { HOME_MAP, SAM_MAP, del, freshStore, get, patch, post, put, registerAllRoutes, setVerified, signOut, testUser } from './mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

describe('the response helpers', () => {
  it('wraps data, raw bodies and failures as the server does', () => {
    expect(ok({ a: 1 })).toEqual({ status: 200, body: { status: 'success', data: { a: 1 } } });
    expect(ok({}, 201).status).toBe(201);
    expect(raw({ x: 1 }, 204)).toEqual({ status: 204, body: { x: 1 } });
    expect(fail(400, 'Bad')).toEqual({ status: 400, body: { status: 'fail', message: 'Bad' } });
    expect(fail(503, 'Down').body.status).toBe('error');
  });

  it('ranks the roles viewer < editor < co-owner < owner', () => {
    expect(RANK.VIEWER).toBeLessThan(RANK.EDITOR);
    expect(RANK.EDITOR).toBeLessThan(RANK.CO_OWNER);
    expect(RANK.CO_OWNER).toBeLessThan(RANK.OWNER);
  });

  it('denies no role with a 404 and too little with a 403', () => {
    expect(deny(null, 'VIEWER').status).toBe(404);
    expect(deny(undefined, 'EDITOR', 'Map not found.').body.message).toBe('Map not found.');
    expect(deny('VIEWER', 'EDITOR').status).toBe(403);
    expect(deny('EDITOR', 'EDITOR')).toBeNull();
    expect(deny('OWNER', 'CO_OWNER')).toBeNull();
    expect(deny('CO_OWNER', 'OWNER').status).toBe(403);
  });
});

describe('verifyFirst', () => {
  it('passes a verified user and anyone signed out', () => {
    expect(verifyFirst()).toBeNull();
    setVerified(false);
    expect(verifyFirst().status).toBe(403);
    expect(verifyFirst().body.message).toBe(VERIFY_EMAIL_FIRST);
    signOut();
    expect(verifyFirst()).toBeNull();
  });
});

describe('mockAdapter', () => {
  it('routes a request to its handler and answers like the API', async () => {
    const res = await get('/api/maps');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.data.maps.map((m) => m.id)).toContain(HOME_MAP);
  });

  it('fills route parameters and decodes them', async () => {
    const res = await get(`/api/maps/${encodeURIComponent(HOME_MAP)}`);
    expect(res.status).toBe(200);
    expect(res.data.map.id).toBe(HOME_MAP);
  });

  it('answers a 404 for a route it has no handler for, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await get('/api/no-such-thing');
    expect(res.status).toBe(404);
    expect(res.message).toMatch(/no handler for GET \/api\/no-such-thing/);
    expect(warn).toHaveBeenCalled();
  });

  it('matches the method as well as the path', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await put('/api/maps');
    expect(res.status).toBe(404);
  });

  it('throws an AxiosError carrying the response for a failure', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const promise = mockAdapter({ method: 'get', url: '/api/maps/no-such-map' });
      const caught = promise.catch((err) => err);
      await vi.advanceTimersByTimeAsync(200);
      const err = await caught;
      expect(err).toBeInstanceOf(AxiosError);
      expect(err.response.status).toBe(404);
      expect(err.code).toBe(AxiosError.ERR_BAD_REQUEST);
      expect(err.message).toBe(err.response.data.message);
    } finally {
      vi.useRealTimers();
    }
  });

  it('takes axios params as the query, leaving out undefined and null', async () => {
    const res = await get(`/api/maps/${HOME_MAP}/photos`, { limit: 2, country: undefined, trip: null });
    expect(res.status).toBe(200);
    expect(res.data.photos).toHaveLength(2);
  });

  it('turns a handler that throws into a 500', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // A JSON body of null: the handler reads a property of it and throws
    const res = await post('/api/maps', null);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: 'error', message: 'Internal Server Error.' });
    expect(error).toHaveBeenCalled();
  });

  it('keeps an uploaded file as a session blob URL', async () => {
    const created = vi.fn(() => 'blob:mock/1');
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: created, revokeObjectURL: () => {} }));
    const key = storeUpload(`${MOCK_UPLOAD_ORIGIN}/myplanetview%2Fphotos%2Fa.jpg`, new Blob(['abc']));
    expect(key).toBe('myplanetview/photos/a.jpg');
    expect(session.blobs.get(key)).toBe('blob:mock/1');
    expect(session.blobSizes.get(key)).toBe(3);
  });

  it('saves the store after a write but not after a read', async () => {
    localStorage.clear();
    await get('/api/maps');
    expect(localStorage.getItem('mpvMockStore.v7')).toBeNull();
    await patch(`/api/maps/${HOME_MAP}`, { name: 'Renamed' });
    expect(JSON.parse(localStorage.getItem('mpvMockStore.v7')).maps.find((m) => m.id === HOME_MAP).name).toBe('Renamed');
  });
});

describe('writes that need a verified email', () => {
  // A sample of NEEDS_VERIFIED_EMAIL: each answers the same 403 before any lookup, so an id
  // that doesn't exist gets it too
  const writes = [
    ['POST', '/api/maps', {}],
    ['DELETE', '/api/maps/no-such-map'],
    ['PUT', `/api/maps/${HOME_MAP}/visits/FR`, { status: 'VISITED' }],
    ['PUT', '/api/maps/no-such-map/visits/FR', { status: 'VISITED' }],
    ['POST', '/api/maps/no-such-map/trips', { title: 'x' }],
    ['POST', `/api/maps/${HOME_MAP}/photos/presign`, {}],
    ['PATCH', '/api/trips/no-such-trip', {}],
    ['DELETE', '/api/photos/no-such-photo'],
    ['POST', '/api/maps/no-such-map/moments', {}],
    ['POST', '/api/challenges', {}],
    ['PATCH', '/api/maps/no-such-map/sharing', {}],
    ['PATCH', '/api/trips/no-such-trip/sharing', {}],
    ['POST', '/api/trips/no-such-trip/members', {}],
    ['POST', '/api/billing/checkout', {}],
    ['POST', '/api/gifts/redeem', {}],
    ['POST', '/api/users/referral', {}],
    ['PUT', '/api/maps/no-such-map/landmarks/lm-x/been', {}],
    ['POST', '/api/maps/no-such-map/imports/polarsteps', {}],
    ['POST', '/api/maps/no-such-map/travel-copies', {}],
    ['POST', '/api/users/user/upload-or-change-avatar', {}],
  ];

  it.each(writes)('%s %s answers 403 for an unverified user', async (method, url, body) => {
    setVerified(false);
    const { status, message } = await (method === 'POST' ? post : method === 'PUT' ? put : method === 'PATCH' ? patch : del)(url, body);
    expect(status).toBe(403);
    expect(message).toBe(VERIFY_EMAIL_FIRST);
  });

  it('leaves reads, setting a map up and quick-fill open', async () => {
    setVerified(false);
    expect((await get(`/api/maps/${HOME_MAP}`)).status).toBe(200);
    expect((await patch(`/api/maps/${HOME_MAP}`, { name: 'Ours' })).status).toBe(200);
    expect((await post(`/api/maps/${HOME_MAP}/visits/quick-fill`, { countryCodes: ['DE'] })).status).toBe(200);
  });

  it('lets the same write through once verified', async () => {
    setVerified(false);
    expect((await put(`/api/maps/${HOME_MAP}/visits/DE`, { status: 'VISITED' })).status).toBe(403);
    setVerified(true);
    expect((await put(`/api/maps/${HOME_MAP}/visits/DE`, { status: 'VISITED' })).status).toBe(200);
    expect(testUser().emailVerified).toBe(true);
  });

  it('gives a 404, not the verify 403, to someone signed out reading a map they have no role on', async () => {
    signOut();
    expect((await get(`/api/maps/${SAM_MAP}`)).status).toBe(404);
  });
});
