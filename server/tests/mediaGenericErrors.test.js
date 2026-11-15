// The /api/media-services handlers pass on 4xx messages, but never a raw exception's.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const failWith = vi.hoisted(() => ({ error: null }));
const thrower = async () => {
  throw failWith.error;
};

vi.mock('../src/services/s3/mediaService.js', () => ({
  mintUploadUrl: thrower,
  signDownloadUrl: thrower,
  hardDeleteObject: thrower,
  confirmUpload: thrower,
  deleteOrphanUploads: thrower,
}));
// Swallows like the real one: the event write itself fails here (no database)
vi.mock('../src/utils/events/logEvent.js', () => ({
  logEvent: vi.fn((promise) => {
    Promise.resolve(promise).catch(() => {});
  }),
}));
vi.mock('../src/middleware/dbRateLimit.js', () => ({ deleteExpiredRateLimits: vi.fn() }));

const {
  presignUploadHandler,
  confirmUploadHandler,
  signViewHandler,
  deleteMediaHandler,
} = await import('../src/controllers/mediaGeneric.js');

function fakeRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  res.sendStatus = (code) => res.status(code);
  return res;
}

const requests = [
  ['presign', presignUploadHandler, { body: { resource: 'contact', contentType: 'image/png', bytes: 10 } }],
  ['confirm', confirmUploadHandler, { body: { key: 'myplanetview/contact/x.png' } }],
  ['view', signViewHandler, { query: { key: 'myplanetview/contact/x.png' } }],
  ['delete', deleteMediaHandler, { query: { key: 'myplanetview/contact/x.png' } }],
];

describe('media-services error replies', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

  for (const [name, handle, req] of requests) {
    it(`${name}: a 4xx keeps its message`, async () => {
      failWith.error = Object.assign(new Error('That file type can’t be uploaded here.'), { status: 400 });
      const res = fakeRes();
      await handle(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('That file type can’t be uploaded here.');
    });

    it(`${name}: anything else is a generic 500`, async () => {
      failWith.error = new Error('connect ECONNREFUSED 10.0.0.5:5432 (secret detail)');
      const res = fakeRes();
      await handle(req, res);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Internal Server Error.');
      expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|secret/);
    });
  }

  it('presign needs a declared size', async () => {
    const res = fakeRes();
    await presignUploadHandler({ body: { resource: 'contact', contentType: 'image/png' } }, res);
    expect(res.statusCode).toBe(400);
  });
});
