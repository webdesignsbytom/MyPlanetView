// Mock mode only: sign-in and account (better-auth's raw JSON replies), the current
// user, avatars, the generic media service, map settings and the reference data.
import { fail, ok, raw, route, verifyFirst } from '../mockAdapter';
import { getDb, me, newId, resetStore, saveStore, session } from '../store';
import { MOCK_PASSWORD } from '../seed';
import { PROMO_MESSAGES, usablePromoCode } from '../promoCodes';
import { acceptInviteFor } from './sharing';
import { mapPlanId, recordInviteOffer } from '../plans';
import {
  GENERIC_MAX_BYTES,
  UPLOAD_IMAGE_EXTENSIONS,
  confirmMockUpload,
  declaredSizeProblem,
  mockUpload,
  presignMockUpload,
} from '../uploads';
import { COUNTRIES } from '@/utils/map/countries';
import { PASSWORD_REGEX } from '@/utils/regex/regex';
import { LANDMARK_ROWS } from '../views';

const publicUser = () => {
  const u = me();
  return { id: u.id, name: u.name, email: u.email, role: u.role, emailVerified: u.emailVerified, isActive: u.isActive, image: u.image, createdAt: u.createdAt, updatedAt: u.updatedAt };
};
const signedOut = () => fail(401, 'No valid session. Please sign in.');

// As the server's utils/displayName.js (a better-auth hook): one line, no control
// characters, at most 80; '' when nothing is left
const cleanName = (value) =>
  typeof value === 'string'
    ? Array.from(value.replace(/[\p{Cc}\u{2028}\u{2029}\u{202A}-\u{202E}\u{2066}-\u{2069}]/gu, ' ').replace(/\s+/g, ' ').trim())
        .slice(0, 80)
        .join('')
        .trim()
    : '';
const NAME_REQUIRED = 'Enter your name.';

const MAP_SETTING_KEYS = {
  style: ['animated', 'mono', 'old-map', 'starry'],
  mapType: ['regular', 'detailed'],
  // The landmark pins (the server's LANDMARK_PIN_MODES)
  landmarkPins: ['zoomed', 'always', 'stamped', 'off'],
};
// `showMoments`: the marks beside countries with moments; `showGoalTag`: the goal's luggage
// tag under the map's title; `showTips`: the tips
// the map opens with (the server's MAP_SETTING_FLAGS need each of them too)
const MAP_SETTING_BOOLEANS = ['showGrid', 'showGridLabels', 'animatedSea', 'sunAndMoon', 'showCountryNames', 'hoverPreview', 'showVisited', 'showUnvisited', 'showUserBanner', 'showAntarctica', 'showMoments', 'showGoalTag', 'showTips', 'showCelebrations', 'countriesAsked', 'showStrings'];

// The test user's password: the seeded one until changed or reset here. Sign-in isn't
// held to the rules below (the seeded one doesn't meet them, as on the server).
const passwordOf = (user) => user.password || MOCK_PASSWORD;
const MIN_PASSWORD = 8;
// As the server's utils/passwordRules.js (a better-auth hook): a new password (sign-up,
// reset, change) follows the client's rules, 8 to 128 characters
const MAX_PASSWORD = 128;
const PASSWORD_RULES_MESSAGE =
  'Use 8 to 128 characters, with an uppercase letter, a number and a special character, and none of / \\ " \'.';
const breaksRules = (password) =>
  typeof password === 'string' && (password.length > MAX_PASSWORD || password.length < MIN_PASSWORD || !PASSWORD_REGEX.test(password));
const rulesError = () => raw({ message: PASSWORD_RULES_MESSAGE }, 400);

// better-auth's error replies: { code, message }, with its own wording
const authError = (status, code, message) => raw({ code, message }, status);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const notAString = (field) => authError(400, 'VALIDATION_ERROR', `[body.${field}] Invalid input: expected string, received undefined`);

export function registerAccountRoutes() {
  // Sign in and out. Mock mode is always the test user, so only that user signs in, with
  // the seeded password (seed.js MOCK_PASSWORD); anything else gets better-auth's 401.
  route('POST', '/api/auth/sign-in/email', ({ body }) => {
    if (typeof body.email !== 'string') return notAString('email');
    if (typeof body.password !== 'string') return notAString('password');
    if (!EMAIL_PATTERN.test(body.email)) return authError(400, 'INVALID_EMAIL', 'Invalid email');
    if (body.email.trim().toLowerCase() !== me().email.toLowerCase() || body.password !== passwordOf(me())) {
      return authError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password');
    }
    if (me().isActive === false) return authError(403, 'FORBIDDEN', 'This account has been deactivated. Please contact support.');
    session.signedIn = true;
    return raw({ redirect: false, token: 'mock-session', user: publicUser() });
  });
  // Signing up makes you the test user (renamed), with an address still to verify, as a new
  // account is (unless from an invite's link to that address: verified, and the invite accepted); an address a mock user has is taken (422). An optional promo code
  // (docs/API.md, "Promo codes") that can't be used is refused before anything changes;
  // a good one is recorded (its free month waits for the first paid Checkout).
  route('POST', '/api/auth/sign-up/email', ({ body }) => {
    if (breaksRules(body.password)) return rulesError();
    const promoCode = typeof body.promoCode === 'string' && body.promoCode.trim() ? body.promoCode : null;
    const promo = promoCode ? usablePromoCode(promoCode) : null;
    if (promoCode && !promo) return raw({ message: PROMO_MESSAGES.invalid }, 400);
    let name = null;
    if ('name' in body) {
      name = cleanName(body.name);
      if (!name) return fail(400, NAME_REQUIRED);
    }
    if (typeof body.email !== 'string') return notAString('email');
    if (typeof body.password !== 'string') return notAString('password');
    const email = body.email.trim().toLowerCase();
    if (getDb().users.some((u) => u.email.toLowerCase() === email)) {
      return authError(422, 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 'User already exists. Use another email.');
    }
    if (name) me().name = name;
    // From an invite's link to this address (19 Nov 2026, as the server): verified at once,
    // and the invite accepted, so the new account lands on the map it was invited to
    const invite =
      typeof body.inviteToken === 'string'
        ? getDb().invites.find((i) => i.token === body.inviteToken && !i.acceptedAt && i.expiresAt > new Date().toISOString())
        : null;
    const fromInvite = Boolean(invite) && invite.email.toLowerCase() === email;
    me().emailVerified = fromInvite;
    me().promoCodeId = promo ? promo.id : null;
    me().promoTrialUsedAt = null;
    // A new account: no invite offer until its invite gives one
    me().inviteOfferPlan = null;
    me().inviteOfferEndsAt = null;
    me().inviteOfferUsedAt = null;
    if (fromInvite) {
      acceptInviteFor(invite, me().id);
      // A paid map's invite offer, unless a promo code came with the sign-up (the server's rule)
      const map = getDb().maps.find((m) => m.id === (invite.mapId || getDb().trips.find((t) => t.id === invite.tripId)?.mapId));
      if (map) recordInviteOffer(me(), mapPlanId(map));
    }
    session.signedIn = true;
    return raw({ token: 'mock-session', user: publicUser() });
  });
  route('POST', '/api/auth/sign-out', () => {
    session.signedIn = false;
    return raw({ success: true });
  });
  // As better-auth: the address must be one (400 otherwise); the reply never says whether it has an account
  route('POST', '/api/auth/request-password-reset', ({ body }) => {
    if (typeof body.email !== 'string') return notAString('email');
    if (!EMAIL_PATTERN.test(body.email)) return authError(400, 'VALIDATION_ERROR', '[body.email] Invalid email address');
    return raw({ status: true, message: 'If this email exists in our system, check your email for the reset link' });
  });
  // Any token works here; the new password then signs you in
  route('POST', '/api/auth/reset-password', ({ body }) => {
    if (breaksRules(body.newPassword)) return rulesError();
    if (typeof body.newPassword !== 'string') return notAString('newPassword');
    if (body.newPassword.length < MIN_PASSWORD) return authError(400, 'PASSWORD_TOO_SHORT', 'Password too short');
    me().password = body.newPassword;
    return raw({ status: true });
  });
  // A GET, which the adapter doesn't save after, so it saves itself. A promo code's plan for
  // life comes with the verified address (the server's giveLifetimePlan, 17 Nov 2026), once.
  function giveLifetimePlan(user) {
    const db = getDb();
    const promo = (db.promoCodes || []).find((p) => p.id === user.promoCodeId);
    if (!promo?.freePlan) return;
    const reason = `Promo code ${promo.code}, for life`;
    db.planGrants = db.planGrants || [];
    if (db.planGrants.some((g) => g.userId === user.id && g.reason === reason)) return;
    db.planGrants.push({
      id: `grant-${Date.now().toString(36)}`,
      userId: user.id,
      plan: promo.freePlan,
      startsAt: new Date().toISOString(),
      endsAt: '9999-12-31T00:00:00.000Z',
      reason,
      grantedById: promo.createdById ?? null,
      createdAt: new Date().toISOString(),
    });
  }
  route('GET', '/api/auth/verify-email', () => {
    me().emailVerified = true;
    giveLifetimePlan(me());
    saveStore();
    return raw({ status: true });
  });
  route('POST', '/api/auth/send-verification-email', () => raw({ status: true }));
  route('POST', '/api/auth/change-password', ({ body }) => {
    if (!session.signedIn) return signedOut();
    if (breaksRules(body.newPassword)) return rulesError();
    if (typeof body.currentPassword !== 'string') return notAString('currentPassword');
    if (typeof body.newPassword !== 'string') return notAString('newPassword');
    if (body.newPassword.length < MIN_PASSWORD) return authError(400, 'PASSWORD_TOO_SHORT', 'Password too short');
    if (body.currentPassword !== passwordOf(me())) return authError(400, 'INVALID_PASSWORD', 'Invalid password');
    me().password = body.newPassword;
    return raw({ token: null });
  });
  // As the server: the same 200 whether or not another account has the new address (it
  // never says), and nothing changes until the emailed links are followed, so nothing does here
  route('POST', '/api/auth/change-email', ({ body }) => {
    if (!session.signedIn) return signedOut();
    if (typeof body.newEmail !== 'string') return notAString('newEmail');
    if (!EMAIL_PATTERN.test(body.newEmail)) return authError(400, 'VALIDATION_ERROR', '[body.newEmail] Invalid email address');
    return raw({ status: true });
  });
  route('POST', '/api/auth/update-user', ({ body }) => {
    if ('name' in body) {
      const name = cleanName(body.name);
      if (!name) return fail(400, NAME_REQUIRED);
      me().name = name;
    }
    return raw({ status: true });
  });
  route('POST', '/api/auth/revoke-other-sessions', () => raw({ status: true }));
  // As the server: a password is required, and better-auth checks it
  route('POST', '/api/auth/delete-user', ({ body }) => {
    if (typeof body.password !== 'string' || !body.password) {
      return fail(400, 'Enter your password to delete your account.');
    }
    if (body.password !== passwordOf(me())) return authError(400, 'INVALID_PASSWORD', 'Invalid password');
    resetStore();
    session.signedIn = false;
    return raw({ success: true });
  });

  // better-auth's session (null when signed out); its user carries role and isActive, as on the server
  route('GET', '/api/auth/get-session', () => {
    if (!session.signedIn) return raw(null);
    const now = new Date();
    return raw({
      session: { id: 'mock-session', token: 'mock-session', userId: me().id, createdAt: now.toISOString(), updatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString() },
      user: publicUser(),
    });
  });

  // Current user and avatar
  route('GET', '/api/users/user/get-logged-in-user', () => (session.signedIn ? ok({ user: publicUser() }) : signedOut()));
  route('POST', '/api/users/user/upload-or-change-avatar', ({ body }) => {
    if (!session.signedIn) return signedOut();
    // As the server: the user's own confirmed avatar upload, of an allowed image type
    const upload = mockUpload(body.key);
    if (!upload?.confirmed || upload.resource !== 'avatar' || upload.ownerId !== me().id || !UPLOAD_IMAGE_EXTENSIONS[upload.contentType]) {
      return fail(400, 'Upload an avatar image first, then save it.');
    }
    me().image = session.blobs.get(body.key) || null;
    return ok({ avatar: { userId: me().id, alt: null, focalX: null, focalY: null, media: { id: newId(), key: body.key, contentType: upload.contentType } } });
  });
  route('DELETE', '/api/users/user/remove-avatar', () => {
    me().image = null;
    return ok({ message: 'Avatar removed.' });
  });

  // Map settings (the viewer's own)
  route('GET', '/api/users/map-settings', () => (session.signedIn ? ok({ mapSettings: getDb().mapSettings }) : signedOut()));
  route('PUT', '/api/users/map-settings', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const input = body.mapSettings && typeof body.mapSettings === 'object' ? body.mapSettings : {};
    const clean = {};
    for (const [key, allowed] of Object.entries(MAP_SETTING_KEYS)) {
      if (input[key] === undefined) continue;
      if (!allowed.includes(input[key])) return fail(400, `Unknown value for ${key}.`);
      clean[key] = input[key];
    }
    for (const key of MAP_SETTING_BOOLEANS) {
      if (input[key] === undefined) continue;
      if (typeof input[key] !== 'boolean') return fail(400, `${key} must be true or false.`);
      clean[key] = input[key];
    }
    getDb().mapSettings = clean;
    return ok({ mapSettings: clean });
  });

  // The generic media service (avatars, contact screenshots): raw JSON, like the server
  // As the server (docs/API.md, "Generic uploads"): an allowed image type and its size in
  // bytes; the extension comes from the type; the URL is signed for both (../uploads.js)
  const MEDIA_FOLDERS = { avatar: 'avatars', contact: 'contact' };
  const mediaError = (status, message) => raw({ error: message, message }, status);
  route('POST', '/api/media-services/presign-url', ({ body }) => {
    // As the server: a signed-in account needs a verified email for anything but a contact image
    const unverified = body.resource === 'contact' ? null : verifyFirst();
    if (unverified) return unverified;
    const folder = MEDIA_FOLDERS[body.resource];
    if (!folder) return mediaError(400, 'Unknown media resource.');
    if (body.resource === 'avatar' && !session.signedIn) return mediaError(401, 'Sign in to upload this file.');
    const contentType = body.contentType;
    const ext = UPLOAD_IMAGE_EXTENSIONS[contentType];
    if (!ext) return mediaError(400, 'That file type can’t be uploaded here.');
    const sizeProblem = declaredSizeProblem(body.bytes, GENERIC_MAX_BYTES);
    if (sizeProblem) return mediaError(...sizeProblem);
    const ownerId = session.signedIn ? me().id : null;
    const key = `myplanetview/${folder}/${ownerId || 'anon'}/${newId()}.${ext}`;
    const url = presignMockUpload(key, { resource: body.resource, contentType, bytes: body.bytes, ownerId });
    return raw({ url, key, expiresIn: 600, contentType, bytes: body.bytes, visibility: 'public', maxBytes: GENERIC_MAX_BYTES, publicUrl: null, method: 'PUT', headers: { 'Content-Type': contentType } });
  });
  route('POST', '/api/media-services/confirm-upload', ({ body }) => {
    const upload = mockUpload(body.key);
    const ownerId = session.signedIn ? me().id : null;
    if (!upload || (upload.ownerId && upload.ownerId !== ownerId)) return mediaError(404, 'Unknown media key.');
    if (!confirmMockUpload(body.key, session.blobs.has(body.key))) return mediaError(400, 'The upload didn’t arrive. Please try again.');
    return raw({ key: body.key, bytes: upload.bytes });
  });
  route('GET', '/api/media-services/get-url', ({ query }) => raw({ url: session.blobs.get(query.key) || null }));
  route('DELETE', '/api/media-services/delete-object', () => raw({ ok: true }));

  // Reference data
  // As the server: every row has its kind (COUNTRY, or SPECIAL for Antarctica and the
  // poles); the North Pole and the magnetic poles have no continent
  route('GET', '/api/countries', () =>
    ok({
      countries: COUNTRIES.map(({ code, name, slug, kind, continent, pinX, pinY }) => ({
        code,
        name,
        slug,
        kind: kind || 'COUNTRY',
        continent,
        pinX,
        pinY,
      })),
    }),
  );
  route('GET', '/api/landmarks', ({ query }) =>
    ok({ landmarks: query.country ? LANDMARK_ROWS.filter((l) => l.countryCode === query.country) : LANDMARK_ROWS }),
  );
}
