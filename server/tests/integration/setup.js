// Mocks for the integration tests: only the private bucket's network calls, email
// sending and Cloudflare Stream's API. Presigned URLs and Stream's playback tokens are
// still signed for real (that's local maths).
import crypto from 'node:crypto';
import { vi } from 'vitest';

// Stream's settings: placeholders, and a signing key made for this run (tokens are signed
// locally with it, as in production)
if (!process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM) {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.CLOUDFLARE_ACCOUNT_ID = 'it-account';
  process.env.CLOUDFLARE_STREAM_API_TOKEN = 'it-token';
  process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE = 'itcustomer';
  process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID = 'it-signing-key';
  process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM = Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64');
  process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET = 'it-stream-webhook-secret';
}

// What the "browser" has put in the private bucket: key -> { bytes, contentType }
// and every email "sent". Shared through globalThis so the tests can read them.
// `__fakeR2Calls` lists each bucket request by command name (to count round trips);
// setting `__fakeR2FailDeletes` makes every delete request fail, as if R2 were down.
vi.hoisted(() => {
  globalThis.__fakeR2 ??= new Map();
  globalThis.__sentEmails ??= [];
  globalThis.__fakeR2Calls ??= [];
  globalThis.__fakeR2FailDeletes ??= false;

  const unreachable = () => Object.assign(new Error('connect ETIMEDOUT (fake bucket)'), { name: 'TimeoutError' });

  // One fake bucket client for both buckets (keys never overlap: different prefixes).
  // media.test.js uses it for the public bucket too.
  globalThis.__fakeBucketSend ??= async (command) => {
    const name = command?.constructor?.name;
    const input = command?.input ?? {};
    globalThis.__fakeR2Calls.push(name);
    if (name === 'HeadObjectCommand') {
      const stored = globalThis.__fakeR2.get(input.Key);
      if (!stored) {
        const err = new Error('NotFound');
        err.name = 'NotFound';
        err.$metadata = { httpStatusCode: 404 };
        throw err;
      }
      return { ContentLength: stored.bytes, ContentType: stored.contentType };
    }
    // The server's own uploads (only the seed's demo photos; people's photos go from the browser)
    if (name === 'PutObjectCommand') {
      globalThis.__fakeR2.set(input.Key, { bytes: input.ContentLength ?? input.Body?.length, contentType: input.ContentType });
      return {};
    }
    if (name === 'DeleteObjectCommand') {
      if (globalThis.__fakeR2FailDeletes) throw unreachable();
      globalThis.__fakeR2.delete(input.Key);
      return {};
    }
    if (name === 'DeleteObjectsCommand') {
      if (globalThis.__fakeR2FailDeletes) throw unreachable();
      const objects = input.Delete?.Objects ?? [];
      // S3 and R2 take at most 1,000 keys per request
      if (objects.length < 1 || objects.length > 1000) throw new Error(`DeleteObjects with ${objects.length} keys`);
      for (const { Key } of objects) globalThis.__fakeR2.delete(Key);
      // Quiet mode lists errors only
      return input.Delete?.Quiet ? { Errors: [] } : { Deleted: objects.map(({ Key }) => ({ Key })), Errors: [] };
    }
    throw new Error(`Unexpected bucket command in a test: ${name}`);
  };
});

vi.mock('../../src/services/s3/s3private.js', async (importOriginal) => {
  const actual = await importOriginal();
  const client = { send: (command) => globalThis.__fakeBucketSend(command) };
  return { ...actual, default: client, s3Private: client };
});

vi.mock('../../src/services/email/emailHandler.js', () => {
  const record = (kind) => async (to, subject, template, context) => {
    globalThis.__sentEmails.push({ kind, to, subject, template, context });
    return true;
  };
  return {
    sendUserEmail: record('user'),
    sendUserVerificationEmail: record('verify'),
    sendUserPasswordResetEmail: record('reset'),
    sendUserChangeEmailConfirmation: record('change-email'),
    sendContactEmail: record('contact'),
  };
});

// Cloudflare Stream: an in-memory account. `__fakeStream` is uid -> the video as Stream
// describes it; a test "finishes the upload" with `__fakeStreamUploaded(uid)` and "finishes
// converting" with `__fakeStreamReady(uid)`.
vi.hoisted(() => {
  globalThis.__fakeStream ??= new Map();
  globalThis.__fakeStreamUploaded = (uid, { duration = -1 } = {}) => {
    const video = globalThis.__fakeStream.get(uid);
    Object.assign(video, { size: video.uploadLength, duration, status: { state: 'queued' } });
  };
  globalThis.__fakeStreamReady = (uid, { duration = 42 } = {}) => {
    const video = globalThis.__fakeStream.get(uid);
    Object.assign(video, { duration, readyToStream: true, status: { state: 'ready' }, input: { width: 1920, height: 1080 } });
  };
});

vi.mock('../../src/services/stream/streamApi.js', () => {
  const store = () => globalThis.__fakeStream;
  const make = (fields) => {
    const uid = crypto.randomBytes(16).toString('hex');
    const video = { uid, readyToStream: false, status: { state: 'pendingupload' }, size: 0, duration: -1, meta: {}, created: new Date().toISOString(), input: {}, ...fields };
    store().set(uid, video);
    return video;
  };
  return {
    createDirectUpload: async ({ bytes, maxDurationSeconds, name }) => {
      const video = make({ uploadLength: bytes, maxDurationSeconds, meta: { name } });
      return { uid: video.uid, uploadUrl: `https://upload.fake-stream.test/${video.uid}` };
    },
    getVideo: async (uid) => (store().has(uid) ? structuredClone(store().get(uid)) : null),
    updateVideo: async (uid, { meta }) => {
      const video = store().get(uid);
      if (!video) return null;
      video.meta = { ...video.meta, ...meta };
      return structuredClone(video);
    },
    deleteVideo: async (uid) => store().delete(uid) || true,
    listVideos: async ({ before }) =>
      [...store().values()].filter((v) => new Date(v.created) < before).sort((a, b) => b.created.localeCompare(a.created)),
    uploadFile: async ({ buffer, name }) => structuredClone(make({ size: buffer.length, uploadLength: buffer.length, meta: { name }, status: { state: 'queued' } })),
  };
});
