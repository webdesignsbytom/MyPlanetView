// Mock mode only: sign-in and account (better-auth's raw JSON replies), the current
// user, avatars, the generic media service, map settings and the reference data.
import { MOCK_UPLOAD_ORIGIN, fail, ok, raw, route } from '../mockAdapter';
import { getDb, me, newId, resetStore, session } from '../store';
import { COUNTRIES } from '@/utils/map/countries';
import { LANDMARK_ROWS } from '../views';

const publicUser = () => {
  const u = me();
  return { id: u.id, name: u.name, email: u.email, role: u.role, emailVerified: u.emailVerified, isActive: u.isActive, image: u.image, createdAt: u.createdAt, updatedAt: u.updatedAt };
};
const signedOut = () => fail(401, 'No valid session. Please sign in.');

const MAP_SETTING_KEYS = {
  style: ['animated', 'old-map', 'jupiter', 'galaxy'],
  mapType: ['regular', 'detailed'],
};
const MAP_SETTING_BOOLEANS = ['showGrid', 'showGridLabels', 'animatedSea', 'sunAndMoon', 'showCountryNames', 'hoverPreview', 'showVisited', 'showUnvisited', 'showUserBanner'];

export function registerAccountRoutes() {
  // Sign in and out: any email and password work, and you're always the test user
  route('POST', '/api/auth/sign-in/email', () => {
    session.signedIn = true;
    return raw({ redirect: false, token: 'mock-session', user: publicUser() });
  });
  route('POST', '/api/auth/sign-up/email', ({ body }) => {
    session.signedIn = true;
    if (body.name) me().name = String(body.name).slice(0, 80);
    return raw({ token: 'mock-session', user: publicUser() });
  });
  route('POST', '/api/auth/sign-out', () => {
    session.signedIn = false;
    return raw({ success: true });
  });
  route('POST', '/api/auth/request-password-reset', () => raw({ status: true }));
  route('POST', '/api/auth/reset-password', () => raw({ status: true }));
  route('GET', '/api/auth/verify-email', () => {
    me().emailVerified = true;
    return raw({ status: true });
  });
  route('POST', '/api/auth/send-verification-email', () => raw({ status: true }));
  route('POST', '/api/auth/change-password', () => raw({ token: null }));
  route('POST', '/api/auth/change-email', () => raw({ status: true }));
  route('POST', '/api/auth/update-user', ({ body }) => {
    if (body.name) me().name = String(body.name).slice(0, 80);
    return raw({ status: true });
  });
  route('POST', '/api/auth/revoke-other-sessions', () => raw({ status: true }));
  route('POST', '/api/auth/delete-user', () => {
    resetStore();
    session.signedIn = false;
    return raw({ success: true });
  });

  // Current user and avatar
  route('GET', '/api/users/user/get-logged-in-user', () => (session.signedIn ? ok({ user: publicUser() }) : signedOut()));
  route('POST', '/api/users/user/upload-or-change-avatar', ({ body }) => {
    if (!session.signedIn) return signedOut();
    me().image = session.blobs.get(body.key) || null;
    return ok({ avatar: { userId: me().id, alt: null, focalX: null, focalY: null, media: { id: newId(), key: body.key, contentType: 'image/jpeg' } } });
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
  route('POST', '/api/media-services/presign-url', ({ body }) => {
    const resource = String(body.resource || 'file');
    const name = String(body.filename || 'upload.bin').replace(/[^A-Za-z0-9._-]/g, '_');
    const key = `myplanetview/${resource}/${me().id}/${newId()}-${name}`;
    const contentType = body.contentType || 'application/octet-stream';
    return raw({ url: `${MOCK_UPLOAD_ORIGIN}/${encodeURIComponent(key)}`, key, contentType, maxBytes: 5 * 1024 * 1024, publicUrl: null, method: 'PUT', headers: { 'Content-Type': contentType } });
  });
  route('POST', '/api/media-services/confirm-upload', ({ body }) => raw({ key: body.key, bytes: session.blobSizes?.get(body.key) ?? 0 }));
  route('GET', '/api/media-services/get-url', ({ query }) => raw({ url: session.blobs.get(query.key) || null }));
  route('DELETE', '/api/media-services/delete-object', () => raw({ ok: true }));

  // Reference data
  route('GET', '/api/countries', () => ok({ countries: COUNTRIES }));
  route('GET', '/api/landmarks', ({ query }) =>
    ok({ landmarks: query.country ? LANDMARK_ROWS.filter((l) => l.countryCode === query.country) : LANDMARK_ROWS }),
  );
}
