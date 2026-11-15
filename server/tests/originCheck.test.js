import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
// No DB writes from the app under test
const createAppEvent = vi.fn(async () => ({}));
vi.mock('../src/event/events.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createAppEvent,
}));
const { CROSS_SITE_MESSAGE, createOriginCheck } = await import('../src/middleware/originCheck.js');
// App under test (FRONTEND_ORIGIN=http://localhost:5173 on the command line)
const { default: app } = await import('../src/server.js');

const ALLOWED = 'http://localhost:5173';
const EVIL = 'https://evil.example';

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// A bare request and response for the middleware on its own
const fakeReq = (method, headers = {}) => {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { method, path: '/x', get: (name) => lower[name.toLowerCase()] };
};
const fakeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};
const run = (check, method, headers) => {
  const next = vi.fn();
  const res = fakeRes();
  check(fakeReq(method, headers), res, next);
  return { next, res };
};

describe('createOriginCheck', () => {
  const check = createOriginCheck(['https://app.example']);

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('refuses %s from an origin not on the list', (method) => {
    const { next, res } = run(check, method, { Origin: EVIL });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ status: 'fail', message: CROSS_SITE_MESSAGE });
  });

  it('allows a write from an allowed origin', () => {
    expect(run(check, 'POST', { Origin: 'https://app.example' }).next).toHaveBeenCalledOnce();
  });

  it('refuses the opaque "null" origin and near misses', () => {
    for (const origin of ['null', 'https://app.example.evil.example', 'http://app.example', 'https://app.example:8443']) {
      expect(run(check, 'POST', { Origin: origin }).res.statusCode).toBe(403);
    }
  });

  it('without an Origin, refuses only Sec-Fetch-Site: cross-site', () => {
    expect(run(check, 'POST', { 'Sec-Fetch-Site': 'cross-site' }).res.statusCode).toBe(403);
    for (const site of ['same-origin', 'same-site', 'none']) {
      expect(run(check, 'POST', { 'Sec-Fetch-Site': site }).next).toHaveBeenCalledOnce();
    }
  });

  it('allows a write with neither header (curl, server-to-server tools, tests)', () => {
    expect(run(check, 'DELETE', {}).next).toHaveBeenCalledOnce();
  });

  it('never refuses a read', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      expect(run(check, method, { Origin: EVIL, 'Sec-Fetch-Site': 'cross-site' }).next).toHaveBeenCalledOnce();
    }
  });
});

describe('the app refuses cross-site writes before any route runs', () => {
  it('answers a write from another site with 403 and a message', async () => {
    const res = await request(app)
      .post('/api/no-such-route')
      .set('Origin', EVIL)
      .set('Accept', 'application/json')
      .send({ email: 'x@example.test', role: 'EDITOR' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ status: 'fail', message: CROSS_SITE_MESSAGE });
  });

  it('guards better-auth too', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up/email')
      .set('Origin', EVIL)
      .send({ email: 'x@example.test', password: 'whatever-123', name: 'X' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(CROSS_SITE_MESSAGE);
  });

  it('refuses a write with Sec-Fetch-Site: cross-site and no Origin', async () => {
    const res = await request(app).delete('/api/no-such-route').set('Sec-Fetch-Site', 'cross-site');
    expect(res.status).toBe(403);
  });

  it('lets the client origin, origin-less tools and reads through (to the 404 here)', async () => {
    const fromClient = await request(app).post('/api/no-such-route').set('Origin', ALLOWED).set('Accept', 'application/json');
    expect(fromClient.status).toBe(404);
    const noOrigin = await request(app).patch('/api/no-such-route').set('Accept', 'application/json');
    expect(noOrigin.status).toBe(404);
    const read = await request(app).get('/api/no-such-route').set('Origin', EVIL).set('Accept', 'application/json');
    expect(read.status).toBe(404);
  });

  it('runs before the body parser, and there is no urlencoded parser (a cross-site form could send one)', () => {
    const names = app.router.stack.map((layer) => layer.name);
    expect(names).toContain('originCheck');
    expect(names).toContain('jsonParser');
    expect(names).not.toContain('urlencodedParser');
    expect(names.indexOf('originCheck')).toBeLessThan(names.indexOf('jsonParser'));
  });
});
