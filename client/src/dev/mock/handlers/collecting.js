// Mock mode only: collecting landmarks and the emails people can stop (docs/API.md
// "Collecting", "Emails"), as the server's controllers/landmarkVisits.js and emails.js. A
// landmark ticked "been here" marks its place visited; the account's "On this day" and
// "Welcome home" settings live on the user (`onThisDayEmails`, `tripShareEmails`). The
// unsubscribe link takes any token for a known user (the mock can't sign), with the server's
// lists (`l`: none for "On this day", `trips`); no email is ever sent.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, session } from '../store';
import { landmarkById, mapRole, markVisited } from '../views';
import { landmarkPlace } from '@/utils/map/ukNations';

const NOT_FOUND = 'This map could not be found.';
// Both on unless switched off, as an account with no profile row on the server
const preferencesOf = (user) => ({ onThisDay: user.onThisDayEmails !== false, tripShare: user.tripShareEmails !== false });
const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;

function load(params) {
  const map = findMap(params.mapId);
  const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
  if (denied) return { reply: denied };
  const landmark = landmarkById(params.landmarkId);
  if (!landmark) return { reply: fail(404, 'That landmark doesn’t exist.') };
  return { map, landmark };
}

export function registerCollectingRoutes() {
  route('PUT', '/api/maps/:mapId/landmarks/:landmarkId/been', ({ params }) => {
    const { map, landmark, reply } = load(params);
    if (reply) return reply;
    const db = getDb();
    // Who ticked it: their own traveller's passport carries the stamp (23 Nov 2026)
    if (!db.landmarkVisits.some((v) => v.mapId === map.id && v.landmarkId === landmark.id)) {
      db.landmarkVisits.push({ mapId: map.id, landmarkId: landmark.id, createdById: me()?.id ?? null, createdAt: new Date().toISOString() });
    }
    const place = landmarkPlace(landmark, Boolean(map.splitUk));
    markVisited(map.id, place, 'MANUAL');
    return ok({ landmarkId: landmark.id, been: true, countryCode: place });
  });

  route('DELETE', '/api/maps/:mapId/landmarks/:landmarkId/been', ({ params }) => {
    const { map, landmark, reply } = load(params);
    if (reply) return reply;
    const db = getDb();
    db.landmarkVisits = db.landmarkVisits.filter((v) => !(v.mapId === map.id && v.landmarkId === landmark.id));
    return ok({ landmarkId: landmark.id, been: false });
  });

  route('GET', '/api/users/email-preferences', () => {
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    return ok(preferencesOf(me()));
  });

  route('PUT', '/api/users/email-preferences', ({ body }) => {
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    const { onThisDay, tripShare } = body || {};
    const fine = (value) => value === undefined || typeof value === 'boolean';
    if (!fine(onThisDay) || !fine(tripShare) || (onThisDay === undefined && tripShare === undefined)) {
      return fail(400, 'Say whether you want "On this day" or "Welcome home" emails (true or false).');
    }
    if (onThisDay !== undefined) me().onThisDayEmails = onThisDay;
    if (tripShare !== undefined) me().tripShareEmails = tripShare;
    return ok(preferencesOf(me()));
  });

  route('POST', '/api/emails/unsubscribe', ({ body, query }) => {
    const u = query?.u ?? body?.u;
    const t = query?.t ?? body?.t;
    const list = query?.l ?? body?.l ?? 'on-this-day';
    const user = getDb().users.find((x) => x.id === u);
    if (!user || !t || !['on-this-day', 'trips'].includes(list)) {
      return fail(400, 'That unsubscribe link doesn’t work. Change your emails on your account page instead.');
    }
    if (list === 'trips') {
      user.tripShareEmails = false;
      return ok({ tripShare: false });
    }
    user.onThisDayEmails = false;
    return ok({ onThisDay: false });
  });
}
