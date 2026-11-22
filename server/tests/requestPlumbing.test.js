// What every request passes through: its context (requestContext.js), the request log
// (requestLog.js: the url token redacted), the reply helpers (responses.js) and the
// work done after the reply (background.js). A tiny Express app stands in for server.js.
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import morgan from 'morgan';
import request from 'supertest';

const vercel = vi.hoisted(() => ({ waitUntil: vi.fn() }));
vi.mock('@vercel/functions', () => ({ waitUntil: vercel.waitUntil }));

const { runAfterResponse } = await import('../src/utils/background.js');
const { requestContextMiddleware, getRequestContext } = await import('../src/utils/requestContext.js');
const { requestLogger } = await import('../src/utils/requestLog.js');
const { sendDataResponse, sendMessageResponse } = await import('../src/utils/responses/responses.js');

afterEach(() => {
  vercel.waitUntil.mockReset();
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SECRET_URL = '/api/shared/K7QX-M2PA-9RTW?token=secret-value&limit=5';
const REDACTED_URL = '/api/shared/:code?token=:redacted&limit=5';

describe('runAfterResponse', () => {
  it("hands the work to Vercel's waitUntil and answers with its result", async () => {
    const work = Promise.resolve('done');
    const guarded = runAfterResponse(work);
    expect(vercel.waitUntil).toHaveBeenCalledTimes(1);
    expect(vercel.waitUntil.mock.calls[0][0]).toBe(guarded);
    expect(await guarded).toBe('done');
  });

  it('swallows a failure, logging it, so background work never crashes the process', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('email down');
    await expect(runAfterResponse(Promise.reject(failure))).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledWith('[background] task failed:', failure);
  });

  it('takes a plain value too', async () => {
    expect(await runAfterResponse(42)).toBe(42);
    expect(await runAfterResponse(undefined)).toBeUndefined();
  });

  it('still runs the work when waitUntil throws', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    vercel.waitUntil.mockImplementationOnce(() => {
      throw new Error('no request context');
    });
    expect(await runAfterResponse(Promise.resolve('ran'))).toBe('ran');
    expect(logged).toHaveBeenCalledWith('[background] waitUntil unavailable:', 'no request context');
  });
});

describe('the request context', () => {
  const app = express();
  app.use(requestContextMiddleware);
  app.get('/api/shared/:code', async (req, res) => {
    // Still there after an await (AsyncLocalStorage)
    await new Promise((resolve) => setTimeout(resolve, 5));
    res.json(getRequestContext());
  });
  app.post('/api/invites/accept', (req, res) => res.json(getRequestContext()));

  it('gives each request an id (also sent as X-Request-Id), its redacted path and its method', async () => {
    const res = await request(app).get(SECRET_URL);
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toMatch(UUID);
    expect(res.body).toEqual({ requestId: res.headers['x-request-id'], path: REDACTED_URL, method: 'GET' });
    expect(JSON.stringify(res.body)).not.toMatch(/K7QX|secret-value/);
  });

  it('gives every request its own id', async () => {
    const [a, b] = await Promise.all([request(app).post('/api/invites/accept'), request(app).post('/api/invites/accept')]);
    expect(a.body.method).toBe('POST');
    expect(a.body.requestId).not.toBe(b.body.requestId);
  });

  it('is empty outside a request', () => {
    expect(getRequestContext()).toEqual({});
  });
});

describe('the request log', () => {
  it("replaces morgan's url token with the redacted address", () => {
    expect(morgan.url({ originalUrl: SECRET_URL, url: '/other' })).toBe(REDACTED_URL);
    // Without originalUrl (outside Express), the plain url
    expect(morgan.url({ url: '/api/invites/abcdefabcdefabcdef' })).not.toMatch(/abcdefabcdefabcdef/);
  });

  it('never writes a share code or a query value in a log line', async () => {
    const lines = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      lines.push(String(chunk));
      return true;
    });
    const app = express();
    app.use(requestLogger);
    app.get('/api/shared/:code', (req, res) => res.status(404).json({}));
    await request(app).get(SECRET_URL);
    await vi.waitFor(() => expect(lines.join('')).toMatch(/GET/));
    const line = lines.join('');
    expect(line).toContain(REDACTED_URL);
    expect(line).not.toMatch(/K7QX|secret-value/);
  });
});

describe('the reply helpers', () => {
  const app = express();
  app.get('/data/:code', (req, res) => sendDataResponse(res, Number(req.params.code), { hello: 'world' }));
  app.get('/message/:code', (req, res) => sendMessageResponse(res, Number(req.params.code), 'A message.'));

  it('send { status, data } with the status word for the code', async () => {
    for (const [code, word] of [[200, 'success'], [201, 'success']]) {
      const res = await request(app).get(`/data/${code}`);
      expect(res.status).toBe(code);
      expect(res.body).toEqual({ status: word, data: { hello: 'world' } });
    }
  });

  it('send { status, message }: fail for a 4xx, error for a 5xx', async () => {
    for (const [code, word] of [[400, 'fail'], [401, 'fail'], [402, 'fail'], [403, 'fail'], [404, 'fail'], [409, 'fail'], [413, 'fail'], [429, 'fail'], [500, 'error'], [503, 'error']]) {
      const res = await request(app).get(`/message/${code}`);
      expect(res.status).toBe(code);
      expect(res.body).toEqual({ status: word, message: 'A message.' });
    }
  });
});
