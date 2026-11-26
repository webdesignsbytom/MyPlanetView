// Mock mode only. An Axios adapter that answers every API call in the browser, from
// the routes the handler modules register. Nothing it handles ever reaches the network.
import { AxiosError } from 'axios';
import { me, saveStore, session } from './store';

export const MOCK_MARKER = 'MPV_MOCK_MODE_ACTIVE';
// Presigned upload URLs in mock mode point here; the adapter and the XHR patch keep the files
export const MOCK_UPLOAD_ORIGIN = 'https://mock-uploads.myplanetview.local';
const LATENCY_MS = 120;

// Responses
export const ok = (data, status = 200) => ({ status, body: { status: 'success', data } });
export const raw = (body, status = 200) => ({ status, body });
export const fail = (status, message) => ({ status, body: { status: status >= 500 ? 'error' : 'fail', message } });

// No role at all is a 404 (nothing to probe); a role that isn't enough is a 403
// A co-owner (19 Nov 2026) sits between an editor and the owner, as on the server
export const RANK = { VIEWER: 1, EDITOR: 2, CO_OWNER: 3, OWNER: 4 };
export function deny(role, needed, notFoundMessage = 'Not found.') {
  if (!role) return fail(404, notFoundMessage);
  if (RANK[role] < RANK[needed]) return fail(403, 'You do not have permission to do that.');
  return null;
}

// As the server's requireVerifiedEmail (docs/API.md, "Access"): these writes need a
// verified email address, checked before anything is looked up, so the 403 is the same
// for every id. Not on the list: reads, setting a map up (PATCH /maps/:mapId and its
// travellers), map settings, the account (the leaving plan too) and the contact form. The generic presign
// checks it itself (anything but a contact image), in handlers/account.js.
export const VERIFY_EMAIL_FIRST =
  'Verify your email address to add to your map or share it. Use the link we emailed you, or send a new one from your account page.';
const kinds = (path) => ['maps', 'trips'].map((kind) => path.replace('{kind}', kind));
const NEEDS_VERIFIED_EMAIL = new Set([
  // "Guess where I was": making and deleting a game (docs/API.md)
  'POST /api/maps/:mapId/guess-games',
  'DELETE /api/guess-games/:gameId',
  'POST /api/maps/:mapId/photo-shows',
  'PATCH /api/maps/:mapId/travellers/:travellerId/passport',
  'PATCH /api/photo-shows/:showId',
  'POST /api/photo-shows/:showId/reset-link',
  'DELETE /api/photo-shows/:showId',
  // Postcards (docs/API.md "Postcards"): sending one, its photo, a new link and deleting
  'POST /api/postcards/picture/presign',
  'POST /api/postcards',
  'POST /api/postcards/:postcardId/reset-link',
  'DELETE /api/postcards/:postcardId',
  // The flight log (docs/API.md "Flights")
  'POST /api/maps/:mapId/flights',
  'DELETE /api/flights/:flightId',
  // Give a month, get a month: making a member's invite code
  'POST /api/users/referral',
  'POST /api/maps',
  'DELETE /api/maps/:mapId',
  'POST /api/maps/:mapId/main',
  'POST /api/maps/:mapId/upgrade',
  'DELETE /api/maps/:mapId/upgrade',
  'POST /api/maps/:mapId/transfer',
  'POST /api/billing/checkout',
  'POST /api/billing/change-plan',
  'POST /api/billing/extra-maps',
  'POST /api/billing/portal',
  'PUT /api/maps/:mapId/visits/:countryCode',
  'DELETE /api/maps/:mapId/visits/:countryCode',
  'POST /api/maps/:mapId/trips',
  'POST /api/maps/:mapId/photos/presign',
  'POST /api/maps/:mapId/photos',
  'POST /api/maps/:mapId/videos/upload',
  'POST /api/maps/:mapId/videos',
  'PATCH /api/trips/:tripId',
  'DELETE /api/trips/:tripId',
  'PUT /api/trips/:tripId/travellers',
  'POST /api/trips/:tripId/stops',
  'PUT /api/trips/:tripId/stops/order',
  'PATCH /api/trips/:tripId/stops/:stopId',
  'DELETE /api/trips/:tripId/stops/:stopId',
  'POST /api/trips/:tripId/maps',
  'DELETE /api/trips/:tripId/maps/:mapId',
  'POST /api/maps/:mapId/moments',
  'PATCH /api/moments/:momentId',
  'DELETE /api/moments/:momentId',
  'PUT /api/maps/:mapId/subdivisions/:code',
  'DELETE /api/maps/:mapId/subdivisions/:code',
  'POST /api/maps/:mapId/pins',
  'PATCH /api/pins/:pinId',
  'DELETE /api/pins/:pinId',
  'POST /api/pins/:pinId/visits',
  'PATCH /api/pins/:pinId/visits/:visitId',
  'DELETE /api/pins/:pinId/visits/:visitId',
  'POST /api/maps/:mapId/goals',
  'PATCH /api/goals/:goalId',
  'DELETE /api/goals/:goalId',
  'PATCH /api/photos/:photoId',
  'POST /api/photos/:photoId/move',
  'DELETE /api/photos/:photoId',
  'POST /api/photos/:photoId/landmarks',
  'PATCH /api/photos/:photoId/landmarks/:landmarkId',
  'DELETE /api/photos/:photoId/landmarks/:landmarkId',
  'PUT /api/photos/:photoId/themes/:themeId',
  'DELETE /api/photos/:photoId/themes/:themeId',
  'POST /api/challenges',
  'POST /api/challenges/join/:code',
  'PATCH /api/challenges/:challengeId',
  'DELETE /api/challenges/:challengeId',
  'POST /api/challenges/:challengeId/reset-link',
  'PATCH /api/challenges/:challengeId/me',
  // Vs mode (26 Nov 2026)
  'POST /api/vs',
  'POST /api/vs/join/:code',
  'PATCH /api/vs/:groupId',
  'DELETE /api/vs/:groupId',
  'POST /api/vs/:groupId/reset-link',
  'PATCH /api/vs/:groupId/me',
  'PUT /api/maps/:mapId/passport/stamps/:landmarkId/photo',
  'DELETE /api/maps/:mapId/passport/stamps/:landmarkId/photo',
  // Taking your travels with you (docs/API.md "Travel copies")
  // Collecting (docs/API.md "Collecting")
  'PUT /api/maps/:mapId/landmarks/:landmarkId/been',
  'DELETE /api/maps/:mapId/landmarks/:landmarkId/been',
  // Life's One Shots (docs/API.md "Life's One Shots")
  'PUT /api/maps/:mapId/one-shots/:itemKey',
  'DELETE /api/maps/:mapId/one-shots/:itemKey',
  // Strings between places (docs/API.md "Strings")
  'POST /api/maps/:mapId/strings',
  'POST /api/maps/:mapId/strings/auto',
  'DELETE /api/maps/:mapId/strings/:stringId',
  'DELETE /api/maps/:mapId/strings',
  // Importing from Polarsteps (docs/API.md "Importing from Polarsteps")
  'POST /api/maps/:mapId/imports/polarsteps',
  // Gifts (docs/API.md "Gifts"): buying and redeeming
  'POST /api/billing/gift-checkout',
  'POST /api/gifts/redeem',
  // A map design's picture (docs/API.md "Map designs"); its colours and removing it need none
  'POST /api/maps/:mapId/design/picture/presign',
  'PUT /api/maps/:mapId/design/picture',
  'POST /api/maps/:mapId/travel-copies/preview',
  'POST /api/maps/:mapId/travel-copies',
  'POST /api/travel-copies/:id/approve',
  'POST /api/travel-copies/:id/decline',
  'POST /api/travel-copies/:id/continue',
  'DELETE /api/travel-copies/:id',
  ...kinds('PATCH /api/{kind}/:id/sharing'),
  ...kinds('POST /api/{kind}/:id/sharing/reset-link'),
  ...kinds('POST /api/{kind}/:id/members'),
  ...kinds('PATCH /api/{kind}/:id/members/:userId'),
  ...kinds('DELETE /api/{kind}/:id/members/:userId'),
  ...kinds('DELETE /api/{kind}/:id/invites/:inviteId'),
  'POST /api/users/user/upload-or-change-avatar',
]);
/** The 403 for a signed-in user whose email address isn't verified, else null. */
export const verifyFirst = () => (session.signedIn && me().emailVerified !== true ? fail(403, VERIFY_EMAIL_FIRST) : null);

// Routes
const routes = [];
export function route(method, pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    `^${pattern.replace(/\//g, '\\/').replace(/:([A-Za-z]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    })}$`,
  );
  routes.push({ method, regex, keys, handler, verified: NEEDS_VERIFIED_EMAIL.has(`${method} ${pattern}`) });
}

// Upload storage: a file PUT to a presigned mock URL becomes a blob URL for the session
export function storeUpload(url, body) {
  const key = decodeURIComponent(new URL(url).pathname.slice(1));
  if (body instanceof Blob) {
    session.blobs.set(key, URL.createObjectURL(body));
    session.blobSizes = session.blobSizes || new Map();
    session.blobSizes.set(key, body.size);
  }
  return key;
}

const parseBody = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockAdapter(config) {
  const method = String(config.method || 'get').toUpperCase();
  const url = new URL(config.url, config.baseURL || window.location.origin);
  let result;

  if (url.origin === MOCK_UPLOAD_ORIGIN) {
    storeUpload(url.href, config.data);
    result = raw({});
  } else {
    const found = routes.find((r) => r.method === method && r.regex.test(url.pathname));
    if (!found) {
      console.warn(`[${MOCK_MARKER}] No mock handler for ${method} ${url.pathname}`);
      result = fail(404, `Mock mode has no handler for ${method} ${url.pathname}.`);
    } else {
      const match = url.pathname.match(found.regex);
      const params = Object.fromEntries(found.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
      // The query string plus axios `params`, which axios adds to the URL itself (an
      // adapter gets them separately); undefined and null are left out, as axios does
      const query = Object.fromEntries(url.searchParams.entries());
      for (const [key, value] of Object.entries(config.params || {})) {
        if (value !== undefined && value !== null) query[key] = String(value);
      }
      try {
        result = (found.verified && verifyFirst()) || (await found.handler({ params, query, body: parseBody(config.data) }));
      } catch (err) {
        console.error(`[${MOCK_MARKER}] Handler failed for ${method} ${url.pathname}`, err);
        result = fail(500, 'Internal Server Error.');
      }
      if (method !== 'GET') saveStore();
    }
  }

  await wait(LATENCY_MS);
  const response = { data: result.body, status: result.status, statusText: String(result.status), headers: {}, config, request: {} };
  if (result.status >= 200 && result.status < 300) return response;
  throw new AxiosError(
    result.body?.message || `Request failed with status code ${result.status}`,
    result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    {},
    response,
  );
}
