// Mock mode only: collecting landmarks and the emails people can stop (docs/API.md
// "Collecting", "Emails"), as the server's controllers/landmarkVisits.js and emails.js. A
// landmark ticked "been here" marks its place visited; the account's "On this day" setting
// lives on the user (`onThisDayEmails`). The unsubscribe link takes any token for a known user
// (the mock can't sign); no email is ever sent.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, session } from '../store';
import { landmarkById, mapRole, markVisited } from '../views';
import { landmarkPlace } from '@/utils/map/ukNations';

const NOT_FOUND = 'This map could not be found.';
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
    if (!db.landmarkVisits.some((v) => v.mapId === map.id && v.landmarkId === landmark.id)) {
      db.landmarkVisits.push({ mapId: map.id, landmarkId: landmark.id, createdAt: new Date().toISOString() });
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
    return ok({ onThisDay: me().onThisDayEmails !== false });
  });

  route('PUT', '/api/users/email-preferences', ({ body }) => {
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    if (typeof body?.onThisDay !== 'boolean') return fail(400, 'Say whether you want "On this day" emails.');
    me().onThisDayEmails = body.onThisDay;
    return ok({ onThisDay: body.onThisDay });
  });

  route('POST', '/api/emails/unsubscribe', ({ body, query }) => {
    const u = query?.u ?? body?.u;
    const t = query?.t ?? body?.t;
    const user = getDb().users.find((x) => x.id === u);
    if (!user || !t) return fail(400, 'That unsubscribe link doesn’t work. Change your emails on your account page instead.');
    user.onThisDayEmails = false;
    return ok({ onThisDay: false });
  });
}
