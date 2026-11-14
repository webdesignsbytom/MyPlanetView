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
export const PASSWORD = 'integration-test-password-1';

const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let counter = 0;
const createdUserIds = new Set();

/** A unique test address that no real person has. */
export const testEmail = (label) => `it-${RUN}-${++counter}-${label}@example.test`.toLowerCase();

/** An anonymous visitor. */
export const anon = () => request.agent(app).set('Origin', ORIGIN);

/** The payload of a `{ status, data }` reply. */
export const data = (res) => res.body?.data;

/** Sign up a new user; returns their agent (cookies kept) and DB row. */
export async function signUp(label = 'user', { verified = false } = {}) {
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

const fakeR2 = () => globalThis.__fakeR2;
export const sentEmails = () => globalThis.__sentEmails;

const FILES = {
  THUMB: { contentType: 'image/jpeg', bytes: 40_000, width: 400, height: 300 },
  DISPLAY: { contentType: 'image/jpeg', bytes: 400_000, width: 1600, height: 1200 },
  ORIGINAL: { contentType: 'image/jpeg', bytes: 4_000_000, width: 4000, height: 3000 },
};

/**
 * The whole upload as the browser does it: presign, "PUT" each file (into the
 * fake bucket), confirm. `put` can override what lands in the bucket per size.
 * Returns the confirm response.
 */
export async function uploadPhoto(agent, mapId, { tripId, latitude, longitude, countryCode, caption, put = {} } = {}) {
  const sizes = ['THUMB', 'DISPLAY', 'ORIGINAL'];
  const presign = await agent
    .post(`/api/maps/${mapId}/photos/presign`)
    .send({ tripId, files: sizes.map((size) => ({ size, contentType: FILES[size].contentType, bytes: FILES[size].bytes })) });
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
  await prisma.photo.deleteMany({ where: { OR: [{ uploaderId: { in: ids } }, { map: { ownerId: { in: ids } } }] } });
  await prisma.mediaItem.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.appEvent.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetId: { in: ids } }] } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  createdUserIds.clear();
}
