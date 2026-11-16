// The rate limits, counted in Postgres, with the limiters turned on for this file
// only (they're off under test otherwise): better-auth's own, the contact form,
// generic uploads, share-code lookups, map creation, and the counter itself.
// Each run uses its own made-up client addresses (X-Forwarded-For, which Vercel
// sets and `trust proxy` 1 reads), so runs don't share counts.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

// Before the app is imported: auth.js reads it when it builds better-auth
process.env.RATE_LIMITS_IN_TESTS = 'true';

const { ORIGIN, PASSWORD, cleanUp, data, givePlan, prisma, testEmail, trackUser } = await import('./helpers.js');
const { default: app } = await import('../../src/server.js');
const { rateLimitShared } = await import('../../src/middleware/dbRateLimit.js');
const { generateShareCode } = await import('../../src/utils/shareCodes.js');

// Per-run addresses: IPv4 in 10.a.b.0/24, IPv6 in 2001:db8:<a>:<b>::/64 and its neighbour
const a = Math.floor(Math.random() * 250) + 1;
const b = Math.floor(Math.random() * 250) + 1;
const ipv4 = (n) => `10.${a}.${b}.${n}`;
const hex = (n) => n.toString(16);
const ipv6 = (host, subnet = b) => `2001:db8:${hex(a)}:${hex(subnet)}::${hex(host)}`;
// How better-auth writes the /64 in its keys
const pad = (n) => n.toString(16).padStart(4, '0');
const authIpv6Key = (subnet = b) => `2001:0db8:${pad(a)}:${pad(subnet)}:0000:0000:0000:0000`;

const from = (ip) => ({
  get: (path) => request(app).get(path).set('Origin', ORIGIN).set('X-Forwarded-For', ip),
  post: (path) => request(app).post(path).set('Origin', ORIGIN).set('X-Forwarded-For', ip),
});

const testKeys = [];
const usedKey = (key) => {
  testKeys.push(key);
  return key;
};

/** A user signed up from their own address, with their own agent. */
async function signUpFrom(ip, label) {
  const email = testEmail(label);
  const agent = request.agent(app).set('Origin', ORIGIN).set('X-Forwarded-For', ip);
  const res = await agent.post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name: label });
  if (res.status !== 200) throw new Error(`Sign-up failed (${res.status}): ${JSON.stringify(res.body)}`);
  // Verified, as adding content (new maps) needs it
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  trackUser(user.id);
  return { agent, user, email };
}

beforeAll(() => {
  expect(process.env.NODE_ENV).toBe('test');
});

afterAll(async () => {
  delete process.env.RATE_LIMITS_IN_TESTS;
  const patterns = [`10.${a}.${b}.`, `2001:db8:${hex(a)}:`, `2001:0db8:${pad(a)}:`];
  await prisma.rateLimit.deleteMany({
    where: { OR: [{ key: { in: testKeys } }, ...patterns.map((p) => ({ key: { contains: p } }))] },
  });
  await prisma.authRateLimit.deleteMany({ where: { OR: patterns.map((p) => ({ key: { contains: p } })) } });
  await cleanUp();
});

describe("better-auth's limiter", () => {
  it('counts sign-in attempts per address in the database (3 per 10 s)', async () => {
    const attempt = (ip) =>
      from(ip).post('/api/auth/sign-in/email').send({ email: testEmail('nobody'), password: 'Wrong-Password-1' });

    for (let i = 0; i < 3; i++) expect((await attempt(ipv4(1))).status).toBe(401);
    const blocked = await attempt(ipv4(1));
    expect(blocked.status).toBe(429);

    const row = await prisma.authRateLimit.findUnique({ where: { key: `${ipv4(1)}|/sign-in/email` } });
    expect(row).toMatchObject({ count: 3 });
    expect(Number(row.lastRequest)).toBeGreaterThan(Date.now() - 60_000);

    // Another address has its own count
    expect((await attempt(ipv4(2))).status).toBe(401);
  });

  it('counts an IPv6 visitor by its /64', async () => {
    const attempt = (ip) =>
      from(ip).post('/api/auth/sign-in/email').send({ email: testEmail('nobody6'), password: 'Wrong-Password-1' });

    for (let host = 1; host <= 3; host++) expect((await attempt(ipv6(host))).status).toBe(401);
    // Another address in the same /64: already used up
    expect((await attempt(ipv6(0xbeef))).status).toBe(429);
    expect(await prisma.authRateLimit.findUnique({ where: { key: `${authIpv6Key()}|/sign-in/email` } })).toMatchObject({
      count: 3,
    });
    // The next /64 is someone else
    expect((await attempt(ipv6(1, b + 1))).status).toBe(401);
  });
});

describe('the contact form', () => {
  it('allows 5 forms per 15 minutes per address, counted in the database', async () => {
    const send = (ip) => from(ip).post('/api/contact/create-new-contact-form').send({});
    for (let i = 0; i < 5; i++) expect((await send(ipv4(10))).status).not.toBe(429);
    const blocked = await send(ipv4(10));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect(blocked.body.message).toMatch(/too many requests/i);
    expect(await prisma.rateLimit.findUnique({ where: { key: usedKey(`contact-form:${ipv4(10)}`) } })).toMatchObject({
      count: 6,
    });
  });

  it('counts an IPv6 visitor by its /64', async () => {
    const send = (ip) => from(ip).post('/api/contact/create-new-contact-form').send({});
    for (let host = 1; host <= 5; host++) expect((await send(ipv6(0x100 + host, b + 2))).status).not.toBe(429);
    expect((await send(ipv6(0xffff, b + 2))).status).toBe(429);
    expect(
      await prisma.rateLimit.findUnique({ where: { key: usedKey(`contact-form:2001:db8:${hex(a)}:${hex(b + 2)}::/64`) } })
    ).toMatchObject({ count: 6 });
  });
});

describe('generic uploads', () => {
  it('share one count of 20 per 15 minutes for presign and confirm', async () => {
    const ip = ipv4(20);
    for (let i = 0; i < 10; i++) {
      expect((await from(ip).post('/api/media-services/presign-url').send({})).status).not.toBe(429);
      expect((await from(ip).post('/api/media-services/confirm-upload').send({})).status).not.toBe(429);
    }
    expect((await from(ip).post('/api/media-services/presign-url').send({})).status).toBe(429);
    expect((await from(ip).post('/api/media-services/confirm-upload').send({})).status).toBe(429);
    usedKey(`media-upload:${ip}`);
  });
});

describe('share-code lookups', () => {
  it('count a photo request whose code matches nothing, in the same count as opening a link', async () => {
    const ip = ipv4(30);
    for (let i = 0; i < 30; i++) {
      const code = generateShareCode();
      const path = i % 2 ? `/api/shared/${code}/photos` : `/api/shared/${code}/photos/${crypto.randomUUID()}`;
      expect((await from(ip).get(path)).status).toBe(404);
    }
    expect((await from(ip).get(`/api/shared/${generateShareCode()}/photos`)).status).toBe(429);
    // Opening a link from there is blocked too: it's one count
    expect((await from(ip).get(`/api/shared/${generateShareCode()}`)).status).toBe(429);
    expect(await prisma.rateLimit.findUnique({ where: { key: usedKey(`share-lookup:${ip}`) } })).toMatchObject({ count: 32 });
  });

  it('leave browsing a real link to the looser browsing count', async () => {
    const { agent } = await signUpFrom(ipv4(40), 'LinkOwner');
    const map = data(await agent.get('/api/maps')).maps.find((m) => m.isDefault);
    const { shareCode } = await prisma.travelMap.update({
      where: { id: map.id },
      data: { linkAccess: 'ANYONE_WITH_LINK' },
      select: { shareCode: true },
    });

    const ip = ipv4(41);
    for (let i = 0; i < 35; i++) expect((await from(ip).get(`/api/shared/${shareCode}/photos`)).status).toBe(200);
    expect(await prisma.rateLimit.findUnique({ where: { key: usedKey(`share-lookup:${ip}`) } })).toBeNull();
    expect(await prisma.rateLimit.findUnique({ where: { key: usedKey(`share-browse:${ip}`) } })).toMatchObject({
      count: 35,
    });

    // Opening the link counts as a lookup
    expect((await from(ip).get(`/api/shared/${shareCode}`)).status).toBe(200);
    expect(await prisma.rateLimit.findUnique({ where: { key: `share-lookup:${ip}` } })).toMatchObject({ count: 1 });
  });
});

describe('creating maps', () => {
  it('allows 20 new maps a day per user', async () => {
    const { agent, user } = await signUpFrom(ipv4(50), 'MapMaker');
    // Paid map slots for all of them: the daily limit is what's tested
    await givePlan(user.id, { extraMaps: 25 });
    const body = { name: 'Another map', groupType: 'SOLO', travellers: [{ name: 'Me' }] };
    for (let i = 0; i < 20; i++) expect((await agent.post('/api/maps').send(body)).status).toBe(201);
    const blocked = await agent.post('/api/maps').send(body);
    expect(blocked.status).toBe(429);
    expect(await prisma.travelMap.count({ where: { ownerId: user.id } })).toBe(21); // + the default map
    usedKey(`map-create-user-day:user:${user.id}`);
  });
});

describe('the counter', () => {
  const key = (label) => usedKey(`it-counter:${a}.${b}:${label}:${Math.random().toString(36).slice(2)}`);

  it('counts up, refuses past the cap, and starts a new window once it has passed', async () => {
    const k = key('window');
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimitShared({ key: k, windowMs: 400, max: 3 }));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[3].retryAfterMs).toBeGreaterThan(0);

    await new Promise((resolve) => setTimeout(resolve, 450));
    const fresh = await rateLimitShared({ key: k, windowMs: 400, max: 3 });
    expect(fresh).toMatchObject({ ok: true, remaining: 2 });
    expect((await prisma.rateLimit.findUnique({ where: { key: k } })).count).toBe(1);
  });

  it('loses no count when requests arrive together', async () => {
    const k = key('burst');
    const results = await Promise.all(Array.from({ length: 10 }, () => rateLimitShared({ key: k, windowMs: 60_000, max: 5 })));
    expect(results.filter((r) => r.ok)).toHaveLength(5);
    expect((await prisma.rateLimit.findUnique({ where: { key: k } })).count).toBe(10);
  });

  it('starts exactly one new window when requests arrive together after one has passed', async () => {
    const k = key('reset');
    await rateLimitShared({ key: k, windowMs: 60_000, max: 100 });
    await prisma.rateLimit.update({ where: { key: k }, data: { count: 50, resetAt: new Date(Date.now() - 1000) } });

    const results = await Promise.all(Array.from({ length: 6 }, () => rateLimitShared({ key: k, windowMs: 60_000, max: 100 })));
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results.map((r) => r.remaining).sort((x, y) => y - x)).toEqual([99, 98, 97, 96, 95, 94]);
    const row = await prisma.rateLimit.findUnique({ where: { key: k } });
    expect(row.count).toBe(6);
    expect(row.resetAt.getTime()).toBeGreaterThan(Date.now() + 50_000);
  });

  it("doesn't depend on the connection's time zone", async () => {
    const k = key('tz');
    try {
      // The pool has one connection in these runs (DB_POOL_MAX=1), so this applies to it
      await prisma.$executeRawUnsafe(`SET TIME ZONE 'Pacific/Kiritimati'`);
      expect((await rateLimitShared({ key: k, windowMs: 60_000, max: 1 })).ok).toBe(true);
      expect((await rateLimitShared({ key: k, windowMs: 60_000, max: 1 })).ok).toBe(false);
    } finally {
      await prisma.$executeRawUnsafe('RESET TIME ZONE');
    }
    const row = await prisma.rateLimit.findUnique({ where: { key: k } });
    expect(Math.abs(row.resetAt.getTime() - (Date.now() + 60_000))).toBeLessThan(10_000);
  });
});
