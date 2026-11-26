// Shared by the mock-mode tests: a fresh seeded store, every route registered once, and a
// way to drive a request through the real Axios adapter (mockAdapter.js) without waiting
// out its 120 ms of pretend latency. Not a test file itself (the config runs *.test.js).
import { vi } from 'vitest';
import { mockAdapter } from '@/dev/mock/mockAdapter';
import { getDb, loadStore, resetStore, session } from '@/dev/mock/store';
import { registerAccountRoutes } from '@/dev/mock/handlers/account';
import { registerMapRoutes } from '@/dev/mock/handlers/maps';
import { registerTripRoutes } from '@/dev/mock/handlers/trips';
import { registerPhotoRoutes } from '@/dev/mock/handlers/photos';
import { registerVideoRoutes } from '@/dev/mock/handlers/videos';
import { registerDataExportRoutes } from '@/dev/mock/handlers/dataExport';
import { registerMomentRoutes } from '@/dev/mock/handlers/moments';
import { registerCountryMapRoutes } from '@/dev/mock/handlers/countryMaps';
import { registerSharingRoutes } from '@/dev/mock/handlers/sharing';
import { registerAdminRoutes } from '@/dev/mock/handlers/admin';
import { registerBillingRoutes } from '@/dev/mock/handlers/billing';
import { registerPromoCodeRoutes } from '@/dev/mock/handlers/promoCodes';
import { registerOfferAdminRoutes } from '@/dev/mock/handlers/offerAdmin';
import { registerOfferRoutes } from '@/dev/mock/handlers/offers';
import { registerPassportRoutes } from '@/dev/mock/handlers/passport';
import { registerAchievementRoutes } from '@/dev/mock/handlers/achievements';
import { registerThemeRoutes } from '@/dev/mock/handlers/themes';
import { registerChallengeRoutes } from '@/dev/mock/handlers/challenges';
import { registerVsRoutes } from '@/dev/mock/handlers/vs';
import { registerTravelCopyRoutes } from '@/dev/mock/handlers/travelCopies';
import { registerMapDesignRoutes } from '@/dev/mock/handlers/mapDesigns';
import { registerFeedbackRoutes } from '@/dev/mock/handlers/feedback';
import { registerGiftRoutes } from '@/dev/mock/handlers/gifts';
import { registerImportRoutes } from '@/dev/mock/handlers/imports';
import { registerCollectingRoutes } from '@/dev/mock/handlers/collecting';
import { registerMapStringRoutes } from '@/dev/mock/handlers/mapStrings';
import { registerReferralRoutes } from '@/dev/mock/handlers/referrals';
import { registerGuessGameRoutes } from '@/dev/mock/handlers/guessGames';
import { registerFlightRoutes } from '@/dev/mock/handlers/flights';
import { registerOneShotRoutes } from '@/dev/mock/handlers/oneShots';
import { registerPhotoShowRoutes } from '@/dev/mock/handlers/photoShows';
import { registerPostcardRoutes } from '@/dev/mock/handlers/postcards';

// The seeded people and maps (seed.js, seedFirstClass.js)
export const USER = 'mock-user';
export const ALEX = 'mock-alex';
export const SAM = 'mock-sam';
export const JO = 'mock-jo';
export const TOM = 'mock-tom';
export const ADMIN = 'mock-admin';
export const PAUSED = 'mock-paused';
export const FRAN = 'mock-fran';
export const HOME_MAP = 'map-home';
export const SAM_MAP = 'map-sam';
export const JO_MAP = 'map-jo';
export const TOM_MAP = 'map-tom';
export const MORGANS_MAP = 'map-morgans';
export const FRAN_MAP = 'map-fran';

let registered = false;

/** Every handler module's routes, once per test file (the adapter's table is module state). */
export function registerAllRoutes() {
  if (registered) return;
  registered = true;
  registerAccountRoutes();
  registerMapRoutes();
  registerCountryMapRoutes();
  registerTripRoutes();
  registerPhotoRoutes();
  registerVideoRoutes();
  registerDataExportRoutes();
  registerMomentRoutes();
  registerSharingRoutes();
  registerAdminRoutes();
  registerBillingRoutes();
  registerPromoCodeRoutes();
  registerOfferAdminRoutes();
  registerOfferRoutes();
  registerPassportRoutes();
  registerAchievementRoutes();
  registerThemeRoutes();
  registerChallengeRoutes();
  registerVsRoutes();
  registerTravelCopyRoutes();
  registerMapDesignRoutes();
  registerFeedbackRoutes();
  registerGiftRoutes();
  registerImportRoutes();
  registerCollectingRoutes();
  registerMapStringRoutes();
  registerReferralRoutes();
  registerGuessGameRoutes();
  registerFlightRoutes();
  registerOneShotRoutes();
  registerPhotoShowRoutes();
  registerPostcardRoutes();
}

/** A freshly seeded store, signed in as the test user (verified), nothing uploaded. */
export function freshStore() {
  localStorage.clear();
  session.signedIn = true;
  session.blobs.clear();
  session.presigned.clear();
  if (session.blobSizes) session.blobSizes.clear();
  // loadStore alone keeps the store already in memory when nothing is saved (a page loads
  // the module once), so the seed is saved first and loaded back, as a fresh page would
  resetStore();
  loadStore();
  return getDb();
}

export const db = () => getDb();
export const testUser = () => getDb().users[0];

/** Signs the test user out (anonymous requests), or back in. */
export const signOut = () => {
  session.signedIn = false;
};
export const signIn = () => {
  session.signedIn = true;
};
/** The test user's email address unverified (or verified again). */
export const setVerified = (verified) => {
  getDb().users[0].emailVerified = verified;
};

/**
 * One request through the adapter, as the API client makes it: `{ status, body }` whether
 * it succeeded or not (body is `{ status, data }` or `{ status, message }`), and `data`
 * (body.data) for short. The adapter's latency runs on fake timers; Date stays real.
 */
export async function api(method, url, { body, params } = {}) {
  const ownTimers = !vi.isFakeTimers();
  if (ownTimers) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    let settled = false;
    const promise = mockAdapter({ method, url, data: body === undefined ? undefined : JSON.stringify(body), params }).then(
      (res) => ({ status: res.status, body: res.data }),
      (err) => {
        if (!err.response) throw err;
        return { status: err.response.status, body: err.response.data };
      },
    );
    promise.then(
      () => (settled = true),
      () => (settled = true),
    );
    // A handler may wait on real work first (the GPS lookup loads its shapes): let that run
    // between ticks of the fake clock, until the reply is in
    while (!settled) {
      await vi.advanceTimersByTimeAsync(130);
      if (!settled) await new Promise((resolve) => setImmediate(resolve));
    }
    const result = await promise;
    return { ...result, data: result.body?.data, message: result.body?.message };
  } finally {
    if (ownTimers) vi.useRealTimers();
  }
}

export const get = (url, params) => api('GET', url, { params });
export const post = (url, body) => api('POST', url, { body });
export const put = (url, body) => api('PUT', url, { body });
export const patch = (url, body) => api('PATCH', url, { body });
export const del = (url, body) => api('DELETE', url, { body });

// MP4 boxes for the video tests: `box('moov', bytes)` is a size, a type and the bytes
export function box(type, ...parts) {
  const payload = parts.flatMap((part) => (typeof part === 'string' ? [...part].map((c) => c.charCodeAt(0)) : [...part]));
  const out = new Uint8Array(8 + payload.length);
  new DataView(out.buffer).setUint32(0, out.length);
  [...type].forEach((c, i) => (out[4 + i] = c.charCodeAt(0)));
  out.set(payload, 8);
  return out;
}
/** A video file of `boxes`, as a Blob. */
export const videoBlob = (...boxes) => new Blob(boxes, { type: 'video/mp4' });
/** URL.createObjectURL, which jsdom lacks: each call answers blob:mock/<n>, and the calls are kept. */
export function stubObjectUrls() {
  const made = [];
  URL.createObjectURL = (blob) => {
    made.push(blob);
    return `blob:mock/${made.length}`;
  };
  URL.revokeObjectURL = () => {};
  return made;
}

// jsdom's Blob has no arrayBuffer() or text(): read them with FileReader, as a browser would
export function polyfillBlobReads() {
  const read = (blob, how) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader[how](blob);
    });
  if (!Blob.prototype.arrayBuffer) Blob.prototype.arrayBuffer = function arrayBuffer() { return read(this, 'readAsArrayBuffer'); };
  if (!Blob.prototype.text) Blob.prototype.text = function text() { return read(this, 'readAsText'); };
}
