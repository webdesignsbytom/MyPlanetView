// Presigned PUTs sign Content-Type and Content-Length (services/s3/signedUpload.js).
// Offline: dummy credentials and an R2-shaped endpoint; signing is local maths.
import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Set before the modules load, so their `dotenv/config` (which never overrides) and
// any real STORAGE_* values in the environment play no part
const DUMMY_ENV = {
  STORAGE_REGION: 'auto',
  STORAGE_ENDPOINT: 'https://0123456789abcdef.eu.r2.cloudflarestorage.com',
  STORAGE_ACCESS_KEY: 'test-access-key',
  STORAGE_SECRET_KEY: 'test-secret-key',
  STORAGE_BUCKET: 'test-public',
  STORAGE_PRIVATE_BUCKET: 'test-private',
  STORAGE_PRIVATE_REGION: 'auto',
  STORAGE_PRIVATE_ENDPOINT: 'https://0123456789abcdef.eu.r2.cloudflarestorage.com',
  STORAGE_PRIVATE_ACCESS_KEY: 'test-access-key',
  STORAGE_PRIVATE_SECRET_KEY: 'test-secret-key',
};

let s3PresignPut;
let signPrivatePutObject;
let signedPutInput;

beforeAll(async () => {
  for (const [name, value] of Object.entries(DUMMY_ENV)) vi.stubEnv(name, value);
  ({ s3PresignPut } = await import('../src/services/s3/s3public.js'));
  ({ signPrivatePutObject } = await import('../src/services/s3/s3private.js'));
  ({ signedPutInput } = await import('../src/services/s3/signedUpload.js'));
});

afterAll(() => vi.unstubAllEnvs());

// ── A minimal SigV4 query-signature check, as the bucket does it ────────────
const rfc3986 = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const sha256Hex = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hmac = (key, s) => crypto.createHmac('sha256', key).update(s).digest();

/** True when `url`'s signature is valid for a PUT that sends `headers` (lower-case names). */
function signatureMatches(url, headers, secret = DUMMY_ENV.STORAGE_SECRET_KEY) {
  const params = [...url.searchParams.entries()].filter(([k]) => k !== 'X-Amz-Signature');
  const query = params
    .map(([k, v]) => [rfc3986(k), rfc3986(v)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const signed = url.searchParams.get('X-Amz-SignedHeaders').split(';');
  const sent = { ...headers, host: url.host };
  const canonicalHeaders = signed.map((h) => `${h}:${String(sent[h] ?? '').trim()}\n`).join('');
  const canonicalRequest = ['PUT', url.pathname, query, canonicalHeaders, signed.join(';'), 'UNSIGNED-PAYLOAD'].join('\n');

  const amzDate = url.searchParams.get('X-Amz-Date');
  const scope = url.searchParams.get('X-Amz-Credential').split('/').slice(1).join('/');
  const [date, region, service] = scope.split('/');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  let key = hmac(`AWS4${secret}`, date);
  for (const part of [region, service, 'aws4_request']) key = hmac(key, part);
  return crypto.createHmac('sha256', key).update(stringToSign).digest('hex') === url.searchParams.get('X-Amz-Signature');
}

const KEY = 'myplanetview/avatars/user-1/2026/11/me_abc123.png';

describe('presigned uploads', () => {
  it('public bucket: signs content-length, content-type and host, and nothing else', async () => {
    const { url } = await s3PresignPut({ bucket: 'test-public', key: KEY, contentType: 'image/png', contentLength: 1234 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(parsed.searchParams.get('X-Amz-Content-Sha256')).toBe('UNSIGNED-PAYLOAD');
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('600');
    // No empty-body checksum (requestChecksumCalculation: 'WHEN_REQUIRED')
    expect(url).not.toMatch(/x-amz-checksum|x-amz-sdk-checksum/i);
  });

  it('private bucket: the same signed headers', async () => {
    const url = await signPrivatePutObject({
      bucket: 'test-private',
      key: 'myplanetview/photos/m/p/thumb-abc.jpg',
      contentType: 'image/jpeg',
      contentLength: 40_000,
      expiresIn: 600,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(url).not.toMatch(/x-amz-checksum|x-amz-sdk-checksum/i);
  });

  it('a PUT of another size or type no longer matches the signature', async () => {
    const { url } = await s3PresignPut({ bucket: 'test-public', key: KEY, contentType: 'image/png', contentLength: 1234 });
    const parsed = new URL(url);
    expect(signatureMatches(parsed, { 'content-length': '1234', 'content-type': 'image/png' })).toBe(true);
    expect(signatureMatches(parsed, { 'content-length': '1235', 'content-type': 'image/png' })).toBe(false);
    expect(signatureMatches(parsed, { 'content-length': '1234', 'content-type': 'text/html' })).toBe(false);
  });

  it('refuses to presign without a type or a whole, positive size', () => {
    const base = { bucket: 'b', key: 'k' };
    expect(() => signedPutInput({ ...base, contentLength: 10 })).toThrow(/contentType/);
    expect(() => signedPutInput({ ...base, contentType: 'image/png' })).toThrow(/contentLength/);
    expect(() => signedPutInput({ ...base, contentType: 'image/png', contentLength: 0 })).toThrow(/contentLength/);
    expect(() => signedPutInput({ ...base, contentType: 'image/png', contentLength: 1.5 })).toThrow(/contentLength/);
    expect(() => signedPutInput({ ...base, contentType: 'image/png', contentLength: '10' })).toThrow(/contentLength/);
    expect(signedPutInput({ ...base, contentType: 'image/png', contentLength: 10 })).toEqual({
      Bucket: 'b',
      Key: 'k',
      ContentType: 'image/png',
      ContentLength: 10,
    });
  });
});
