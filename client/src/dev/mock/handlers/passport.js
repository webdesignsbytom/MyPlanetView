// Mock mode only: the passport (docs/API.md, "Passport"): reading it (a map's, or through a
// map's share link) and choosing the photo a stamp shows.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, normaliseShareCode } from '../store';
import { higherRole, landmarkById, mapRole } from '../views';
import { buildPassport } from '../passport';

const MAP_NOT_FOUND = "That map doesn't exist, or it hasn't been shared with you.";
const LINK_NOT_FOUND = "That share link doesn't exist or has been turned off.";
const TRAVELLER_NOT_FOUND = "That traveller isn't on this map.";
const STAMP_PHOTO_INVALID = "Pick a photo of this landmark that's confirmed on this map.";

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;

// A map's share code, with the caller's own role, else VIEWER when the link is on. A trip's
// code has no passport (null, so 404).
function sharedMap(code) {
  const normal = normaliseShareCode(code);
  const map = normal ? getDb().maps.find((m) => m.shareCode === normal) : null;
  if (!map) return null;
  const role = higherRole(mapRole(map), map.linkAccess === 'ANYONE_WITH_LINK' ? 'VIEWER' : null);
  return role ? { map, role } : null;
}

export function registerPassportRoutes() {
  // ?traveller=<id>: that traveller's own passport (21 Nov 2026), as the server's
  const answer = (map, role, query) => {
    const passport = buildPassport(map, role, { travellerId: query?.traveller || null });
    return passport ? ok({ passport }) : fail(404, TRAVELLER_NOT_FOUND);
  };

  route('GET', '/api/maps/:mapId/passport', ({ params, query }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', MAP_NOT_FOUND) || answer(map, role, query);
  });

  route('GET', '/api/shared/:code/passport', ({ params, query }) => {
    const shared = sharedMap(params.code);
    return shared ? answer(shared.map, shared.role, query) : fail(404, LINK_NOT_FOUND);
  });

  // `{ photoId }`: one of the landmark's confirmed photos on this map
  route('PUT', '/api/maps/:mapId/passport/stamps/:landmarkId/photo', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MAP_NOT_FOUND);
    if (denied) return denied;
    const { photoId } = body || {};
    const confirmed =
      typeof photoId === 'string' &&
      db.photoLandmarks.some((pl) => {
        if (pl.photoId !== photoId || pl.landmarkId !== params.landmarkId || !pl.confirmed) return false;
        return (pl.mapId ?? db.photos.find((p) => p.id === pl.photoId)?.mapId) === map.id;
      });
    if (!confirmed) return fail(400, STAMP_PHOTO_INVALID);
    const existing = db.landmarkCovers.find((c) => c.mapId === map.id && c.landmarkId === params.landmarkId);
    if (existing) existing.photoId = photoId;
    else db.landmarkCovers.push({ mapId: map.id, landmarkId: params.landmarkId, photoId });
    return ok({ cover: { landmarkId: params.landmarkId, photoId } });
  });

  // Back to the landmark's earliest photo
  route('DELETE', '/api/maps/:mapId/passport/stamps/:landmarkId/photo', ({ params }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MAP_NOT_FOUND);
    if (denied) return denied;
    if (!landmarkById(params.landmarkId)) return fail(404, "That landmark doesn't exist.");
    db.landmarkCovers = db.landmarkCovers.filter((c) => !(c.mapId === map.id && c.landmarkId === params.landmarkId));
    return ok({ message: 'The stamp shows its first photo again.' });
  });
}
