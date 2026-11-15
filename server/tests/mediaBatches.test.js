// Deleting stored files in bulk (utils/media/batches.js), and what the real S3 client
// sends for DeleteObjects with this project's settings (offline: a fake request handler).
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { DELETE_BATCH_MAX, chunk, deleteResult, distinctKeys, settleWithLimit } from '../src/utils/media/batches.js';

describe('chunk', () => {
  it('splits into pieces of at most 1,000 by default', () => {
    const keys = Array.from({ length: 2501 }, (_, i) => `k${i}`);
    const parts = chunk(keys);
    expect(DELETE_BATCH_MAX).toBe(1000);
    expect(parts.map((p) => p.length)).toEqual([1000, 1000, 501]);
    expect(parts.flat()).toEqual(keys);
    expect(chunk([], 10)).toEqual([]);
    expect(() => chunk([1], 0)).toThrow(RangeError);
  });
});

describe('distinctKeys', () => {
  it('keeps each non-empty string once, in order', () => {
    expect(distinctKeys(['a', 'b', 'a', '', null, 3, 'c'])).toEqual(['a', 'b', 'c']);
    expect(distinctKeys(undefined)).toEqual([]);
  });
});

describe('deleteResult', () => {
  it('counts every key not listed under Errors as deleted', () => {
    expect(deleteResult(['a', 'b', 'c'], { Errors: [{ Key: 'b', Code: 'InternalError' }] })).toEqual({
      removed: ['a', 'c'],
      failed: ['b'],
    });
    expect(deleteResult(['a'], {})).toEqual({ removed: ['a'], failed: [] });
  });
});

describe('settleWithLimit', () => {
  it('never runs more than the limit at once and never rejects', async () => {
    let running = 0;
    let most = 0;
    const results = await settleWithLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      running++;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
      if (n === 4) throw new Error('nope');
      return n * 2;
    });
    expect(most).toBe(3);
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false, true, true, true]);
    expect(results[0]).toMatchObject({ item: 1, value: 2 });
    expect(results[3].error.message).toBe('nope');
  });
});

// The real private-bucket client (requestChecksumCalculation WHEN_REQUIRED), with
// dummy settings and a request handler that answers instead of the network
describe('DeleteObjects as the SDK sends it', () => {
  let s3Private;
  let DeleteObjectsCommand;
  beforeAll(async () => {
    for (const [name, value] of Object.entries({
      STORAGE_PRIVATE_REGION: 'auto',
      STORAGE_PRIVATE_ENDPOINT: 'https://0123456789abcdef.eu.r2.cloudflarestorage.com',
      STORAGE_PRIVATE_ACCESS_KEY: 'test-access-key',
      STORAGE_PRIVATE_SECRET_KEY: 'test-secret-key',
      STORAGE_PRIVATE_BUCKET: 'test-private',
    })) {
      vi.stubEnv(name, value);
    }
    ({ s3Private } = await import('../src/services/s3/s3private.js'));
    ({ DeleteObjectsCommand } = await import('@aws-sdk/client-s3'));
  });
  afterAll(() => vi.unstubAllEnvs());

  it('is one POST ?delete with a CRC32 body checksum (R2 must accept it: test once on real R2)', async () => {
    let sent;
    const { Readable } = await import('node:stream');
    const original = s3Private.config.requestHandler;
    s3Private.config.requestHandler = {
      handle: async (request) => {
        sent = request;
        const xml = '<?xml version="1.0" encoding="UTF-8"?><DeleteResult><Error><Key>b</Key><Code>InternalError</Code></Error></DeleteResult>';
        return { response: { statusCode: 200, headers: { 'content-type': 'application/xml' }, body: Readable.from([Buffer.from(xml)]) } };
      },
    };
    try {
      const reply = await s3Private.send(
        new DeleteObjectsCommand({ Bucket: 'test-private', Delete: { Objects: [{ Key: 'a' }, { Key: 'b' }], Quiet: true } })
      );
      expect(sent.method).toBe('POST');
      expect(sent.query).toHaveProperty('delete');
      // DeleteObjects requires a checksum, so the SDK sends one even with WHEN_REQUIRED
      expect(sent.headers['x-amz-checksum-crc32']).toMatch(/^[A-Za-z0-9+/]{6}==$/);
      expect(sent.headers['content-md5']).toBeUndefined();
      expect(deleteResult(['a', 'b'], reply)).toEqual({ removed: ['a'], failed: ['b'] });
    } finally {
      s3Private.config.requestHandler = original;
    }
  });
});
