// Settings read from the environment when used (streamConfig.js, publicMediaUrl.js), the
// rate limits' numbers (rateLimitConstants.js) and the share-code lookup the /shared
// routes count against their limit (middleware/shareLookup.js, Prisma faked).
import { afterEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ map: vi.fn(), trip: vi.fn() }));
vi.mock('../src/prisma.js', () => ({
  prisma: { travelMap: { findUnique: db.map }, trip: { findUnique: db.trip } },
}));

const { streamConfig, streamEnabled, STREAM_NOT_SET_UP } = await import('../src/services/stream/streamConfig.js');
const { publicMediaUrlFrom } = await import('../src/utils/media/publicMediaUrl.js');
const limits = await import('../src/utils/constants/rateLimitConstants.js');
const { shareCodeMatchesNothing } = await import('../src/middleware/shareLookup.js');

afterEach(() => {
  vi.unstubAllEnvs();
  db.map.mockReset();
  db.trip.mockReset();
});

const STREAM_ENV = {
  CLOUDFLARE_ACCOUNT_ID: 'acc',
  CLOUDFLARE_STREAM_API_TOKEN: 'token',
  CLOUDFLARE_STREAM_CUSTOMER_CODE: 'cust',
  CLOUDFLARE_STREAM_SIGNING_KEY_ID: 'kid',
  CLOUDFLARE_STREAM_SIGNING_KEY_PEM: 'cGVt',
};

describe('streamConfig', () => {
  it('reads each setting when called, empty when unset', () => {
    for (const name of [...Object.keys(STREAM_ENV), 'CLOUDFLARE_STREAM_WEBHOOK_SECRET']) vi.stubEnv(name, '');
    expect(streamConfig()).toEqual({ accountId: '', apiToken: '', customerCode: '', signingKeyId: '', signingKeyPem: '', webhookSecret: '' });
    for (const [name, value] of Object.entries(STREAM_ENV)) vi.stubEnv(name, value);
    vi.stubEnv('CLOUDFLARE_STREAM_WEBHOOK_SECRET', 'hook');
    expect(streamConfig()).toEqual({ accountId: 'acc', apiToken: 'token', customerCode: 'cust', signingKeyId: 'kid', signingKeyPem: 'cGVt', webhookSecret: 'hook' });
  });

  it('turns videos on only with all five upload and playback settings; the webhook secret is optional', () => {
    for (const [name, value] of Object.entries(STREAM_ENV)) vi.stubEnv(name, value);
    vi.stubEnv('CLOUDFLARE_STREAM_WEBHOOK_SECRET', '');
    expect(streamEnabled()).toBe(true);
    for (const name of Object.keys(STREAM_ENV)) {
      vi.stubEnv(name, '');
      expect(streamEnabled(), name).toBe(false);
      vi.stubEnv(name, STREAM_ENV[name]);
    }
  });

  it('has a sentence for when videos are off', () => {
    expect(STREAM_NOT_SET_UP).toBe('Videos aren’t set up yet.');
  });
});

describe('publicMediaUrlFrom', () => {
  it('uses the public host, without a doubled slash', () => {
    vi.stubEnv('STORAGE_PUBLIC_HOST', 'https://media.example.test/');
    expect(publicMediaUrlFrom('myplanetview/avatars/a.png')).toBe('https://media.example.test/myplanetview/avatars/a.png');
    vi.stubEnv('STORAGE_PUBLIC_HOST', 'https://media.example.test');
    expect(publicMediaUrlFrom('myplanetview/avatars/a.png')).toBe('https://media.example.test/myplanetview/avatars/a.png');
  });

  it('falls back to the endpoint and bucket', () => {
    vi.stubEnv('STORAGE_PUBLIC_HOST', '');
    vi.stubEnv('STORAGE_ENDPOINT', 'https://r2.example.test');
    vi.stubEnv('STORAGE_BUCKET', 'pub');
    expect(publicMediaUrlFrom('myplanetview/contact/c.png')).toBe('https://r2.example.test/pub/myplanetview/contact/c.png');
  });

  it('answers an empty string for no key', () => {
    vi.stubEnv('STORAGE_PUBLIC_HOST', 'https://media.example.test');
    expect(publicMediaUrlFrom('')).toBe('');
    expect(publicMediaUrlFrom(null)).toBe('');
    expect(publicMediaUrlFrom(undefined)).toBe('');
  });
});

describe('the rate limits', () => {
  const dbLimits = Object.entries(limits).filter(([, value]) => value && typeof value === 'object' && 'name' in value);

  it('give every database-backed limit a unique name, a window and a positive whole cap', () => {
    expect(dbLimits.length).toBeGreaterThan(15);
    const names = dbLimits.map(([, value]) => value.name);
    expect(new Set(names).size).toBe(names.length);
    for (const [key, { name, windowMs, max }] of dbLimits) {
      expect(name, key).toMatch(/^[a-z][a-z-]+$/);
      expect(Number.isInteger(windowMs) && windowMs >= 60_000 && windowMs <= 24 * 60 * 60 * 1000, key).toBe(true);
      expect(Number.isInteger(max) && max > 0, key).toBe(true);
    }
  });

  it('keep the numbers CLAUDE.md promises', () => {
    const fifteen = 15 * 60 * 1000;
    expect(limits.GLOBAL_RATE_LIMIT).toEqual({ windowMs: fifteen, max: 1000 });
    expect(limits.CONTACT_FORM_RATE_LIMIT).toMatchObject({ windowMs: fifteen, max: 5 });
    expect(limits.MEDIA_UPLOAD_RATE_LIMIT).toMatchObject({ windowMs: fifteen, max: 20 });
    expect(limits.SHARE_LOOKUP_RATE_LIMIT).toMatchObject({ windowMs: fifteen, max: 30 });
    expect(limits.SHARE_BROWSE_RATE_LIMIT).toMatchObject({ windowMs: fifteen, max: 300 });
    expect(limits.PHOTO_PRESIGN_RATE_LIMIT).toMatchObject({ windowMs: fifteen, max: 120 });
    expect(limits.IMPORT_PHOTO_PRESIGN_RATE_LIMIT).toMatchObject({ windowMs: fifteen, max: 600 });
    expect(limits.MEMBER_INVITE_RATE_LIMIT).toMatchObject({ windowMs: 60 * 60 * 1000, max: 20 });
    expect(limits.MEMBER_INVITE_DAILY_USER_LIMIT).toMatchObject({ windowMs: 24 * 60 * 60 * 1000, max: 25 });
    expect(limits.MAP_CREATE_DAILY_USER_LIMIT).toMatchObject({ windowMs: 24 * 60 * 60 * 1000, max: 20 });
    // An import may upload many more photos than a person does by hand
    expect(limits.IMPORT_PHOTO_PRESIGN_RATE_LIMIT.max).toBeGreaterThan(limits.PHOTO_PRESIGN_RATE_LIMIT.max);
    // Browsing a link that exists is looser than guessing codes
    expect(limits.SHARE_BROWSE_RATE_LIMIT.max).toBeGreaterThan(limits.SHARE_LOOKUP_RATE_LIMIT.max);
  });

  it("count IPv6 per /64, and give better-auth's limits in seconds", () => {
    expect(limits.IPV6_SUBNET).toBe(64);
    for (const value of [limits.BETTER_AUTH_RATE_LIMIT, limits.AUTH_EMAIL_RATE_LIMIT]) {
      expect(Number.isInteger(value.windowSeconds) && value.windowSeconds > 0 && value.windowSeconds < 24 * 60 * 60).toBe(true);
      expect(Number.isInteger(value.max) && value.max > 0).toBe(true);
    }
    // Sending email is the tighter one
    expect(limits.AUTH_EMAIL_RATE_LIMIT.max).toBeLessThan(limits.BETTER_AUTH_RATE_LIMIT.max);
  });
});

describe('shareCodeMatchesNothing', () => {
  it('answers true for anything that cannot be a share code, without asking the database', async () => {
    for (const code of [undefined, '', 'nope', 'K7QX-M2PA-9RT', 'K7QX-M2PA-9RTWX', 'K7QX-M2PA-9RT0', 'K7QX-M2PA-9RTI']) {
      expect(await shareCodeMatchesNothing(code), String(code)).toBe(true);
    }
    expect(db.map).not.toHaveBeenCalled();
    expect(db.trip).not.toHaveBeenCalled();
  });

  it("answers false for a map's code, in any case and spacing, without looking at trips", async () => {
    db.map.mockResolvedValue({ id: 'map-1' });
    expect(await shareCodeMatchesNothing(' k7qx m2pa-9rtw ')).toBe(false);
    expect(db.map).toHaveBeenCalledWith({ where: { shareCode: 'K7QXM2PA9RTW' }, select: { id: true } });
    expect(db.trip).not.toHaveBeenCalled();
  });

  it("answers false for a trip's code, and true when neither has it", async () => {
    db.map.mockResolvedValue(null);
    db.trip.mockResolvedValueOnce({ id: 'trip-1' });
    expect(await shareCodeMatchesNothing('K7QX-M2PA-9RTW')).toBe(false);
    expect(db.trip).toHaveBeenCalledWith({ where: { shareCode: 'K7QXM2PA9RTW' }, select: { id: true } });
    db.trip.mockResolvedValueOnce(null);
    expect(await shareCodeMatchesNothing('K7QX-M2PA-9RTW')).toBe(true);
  });
});
