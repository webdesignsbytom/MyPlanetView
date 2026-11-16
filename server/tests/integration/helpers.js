// Shared by the integration tests: signed-in agents, photo uploads, clean-up.
import request from 'supertest';

// Every integration test imports this file, so the guard holds whichever config
// runs them: they create and delete real rows, so never against a real database.
const databaseName = (() => {
  try {
    return new URL(process.env.DATABASE_URL || '').pathname.replace(/^\//, '');
  } catch {
    return '';
  }
})();
if (!/_test$/.test(databaseName)) {
  throw new Error(
    `Integration tests only run against a database whose name ends in "_test" (got "${databaseName || 'nothing'}"). ` +
      'Use npm run test:integration with DATABASE_URL pointing at a migrated test database.'
  );
}

const { default: app } = await import('../../src/server.js');
const { prisma } = await import('../../src/prisma.js');

export { prisma };

// A trusted origin (better-auth checks it on cookie requests; CORS allows it)
export const ORIGIN = 'http://localhost:5173';
// Meets the password rules (src/utils/passwordRules.js)
export const PASSWORD = 'Integration-Test-Password-1';

const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let counter = 0;
const createdUserIds = new Set();

/** A unique test address that no real person has. */
export const testEmail = (label) =>
  `it-${RUN}-${++counter}-${String(label).replace(/[^a-z0-9]+/gi, '-')}@example.test`.toLowerCase();

/** An anonymous visitor. */
export const anon = () => request.agent(app).set('Origin', ORIGIN);

/** The payload of a `{ status, data }` reply. */
export const data = (res) => res.body?.data;

/**
 * Sign up a new user; returns their agent (cookies kept) and DB row. Verified by default,
 * as adding content needs a verified email; pass `{ verified: false }` for the other case.
 */
export async function signUp(label = 'user', { verified = true } = {}) {
  const email = testEmail(label);
  const agent = request.agent(app).set('Origin', ORIGIN);
  const res = await agent.post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name: label });
  if (res.status !== 200) throw new Error(`Sign-up failed (${res.status}): ${JSON.stringify(res.body)}`);
  let user = await prisma.user.findUniqueOrThrow({ where: { email } });
  createdUserIds.add(user.id);
  if (verified) user = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  return { agent, user, email, name: label };
}

/** Remember a user made some other way (e.g. by accepting an invite), for clean-up. */
export const trackUser = (userId) => createdUserIds.add(userId);

/** The user's default map (made by the sign-up hook). */
export async function defaultMapOf(agent) {
  const res = await agent.get('/api/maps');
  if (res.status !== 200) throw new Error(`GET /api/maps failed (${res.status})`);
  return data(res).maps.find((m) => m.isDefault);
}

/**
 * Give a user a plan and extra maps as the Stripe webhook would leave them: a
 * Subscription row with a status that counts (no Stripe involved). Every test user
 * starts on Economy with one map slot.
 */
export async function givePlan(userId, { plan = 'FREE', extraMaps = 0, status = 'active', interval = 'MONTH' } = {}) {
  const fields = { plan, extraMaps, status, interval, stripeSubscriptionId: `sub_it_${userId}` };
  return prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: `cus_it_${userId}`, ...fields },
    update: fields,
  });
}

const fakeR2 = () => globalThis.__fakeR2;
export const sentEmails = () => globalThis.__sentEmails;

const FILES = {
  THUMB: { contentType: 'image/jpeg', bytes: 40_000, width: 400, height: 300 },
  DISPLAY: { contentType: 'image/jpeg', bytes: 400_000, width: 1600, height: 1200 },
  ORIGINAL: { contentType: 'image/jpeg', bytes: 4_000_000, width: 4000, height: 3000 },
  PRINT: { contentType: 'image/jpeg', bytes: 1_000_000, width: 2400, height: 1800 },
};

// The copies a photo keeps follow the map owner's plan: Economy (every test user, unless
// givePlan says otherwise) a print copy, Business and First Class the original
const ECONOMY_SIZES = ['THUMB', 'DISPLAY', 'PRINT'];
export const ORIGINAL_SIZES = ['THUMB', 'DISPLAY', 'ORIGINAL'];

/**
 * The whole upload as the browser does it: presign, "PUT" each file (into the
 * fake bucket), confirm. `put` can override what lands in the bucket per size;
 * `sizes` are the copies sent (an Economy map's by default; ORIGINAL_SIZES for a
 * paid owner's map). Returns the confirm response, or the presign's if it failed.
 */
export async function uploadPhoto(
  agent,
  mapId,
  { tripId, latitude, longitude, countryCode, caption, put = {}, sizes = ECONOMY_SIZES, countryHint } = {}
) {
  const presign = await agent.post(`/api/maps/${mapId}/photos/presign`).send({
    tripId,
    countryCode: countryHint,
    files: sizes.map((size) => ({ size, contentType: FILES[size].contentType, bytes: FILES[size].bytes })),
  });
  if (presign.status !== 200) return presign;
  const { photoId, uploads } = data(presign);

  for (const upload of uploads) {
    const override = put[upload.size];
    if (override === null) continue; // never uploaded
    fakeR2().set(upload.key, override ?? { bytes: FILES[upload.size].bytes, contentType: FILES[upload.size].contentType });
  }

  const res = await agent.post(`/api/maps/${mapId}/photos`).send({
    photoId,
    tripId,
    caption,
    latitude,
    longitude,
    countryCode,
    takenAt: '2026-06-01T12:00:00.000Z',
    width: 4000,
    height: 3000,
    variants: uploads.map((u) => ({ size: u.size, key: u.key, width: FILES[u.size].width, height: FILES[u.size].height })),
  });
  res.uploadedKeys = uploads.map((u) => u.key);
  return res;
}

/** Is this key in the fake bucket? */
export const inBucket = (key) => fakeR2().has(key);

/**
 * Delete every row the tests made, newest data first, then the users (their
 * maps, trips, members and invites cascade). Nothing else in the database is touched.
 */
export async function cleanUp() {
  // Also anyone this run signed up whose test failed before they were recorded
  const byRun = await prisma.user.findMany({ where: { email: { startsWith: `it-${RUN}-`.toLowerCase() } }, select: { id: true } });
  const ids = [...new Set([...createdUserIds, ...byRun.map((u) => u.id)])];
  if (!ids.length) return;
  const photoWhere = { OR: [{ uploaderId: { in: ids } }, { map: { ownerId: { in: ids } } }] };
  // Their files' rows too: a photo a deleted account left behind keeps its file, whose
  // MediaItem lost its owner (SET NULL)
  const photoMedia = await prisma.mediaItem.findMany({ where: { photoVariant: { photo: photoWhere } }, select: { id: true } });
  await prisma.photo.deleteMany({ where: photoWhere });
  await prisma.mediaItem.deleteMany({ where: { OR: [{ ownerId: { in: ids } }, { id: { in: photoMedia.map((m) => m.id) } }] } });
  await prisma.appEvent.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetId: { in: ids } }] } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  createdUserIds.clear();
}
