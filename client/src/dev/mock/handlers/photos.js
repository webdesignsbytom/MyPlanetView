// Mock mode only: one photo (open, edit, delete) and its landmark matches.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb } from '../store';
import { atLeast, canSeePhoto, countryExists, landmarkById, mapRole, markVisited, photoDetail, photoRole } from '../views';
import { POSITION_FIELD, firstPosition, movePhotoAfter } from '../photoOrder';

const NOT_FOUND = 'This photo could not be found.';

// Viewers can't see hidden photos, so for them a hidden photo doesn't exist
function loadPhoto(photoId, needed) {
  const photo = getDb().photos.find((p) => p.id === photoId) || null;
  const role = photo ? photoRole(photo) : null;
  if (photo && role && !canSeePhoto(photo, role)) return { reply: fail(404, NOT_FOUND) };
  const reply = deny(role, needed, NOT_FOUND);
  return reply ? { reply } : { photo, role };
}

export function registerPhotoRoutes() {
  route('GET', '/api/photos/:photoId', ({ params }) => {
    const { photo, role, reply } = loadPhoto(params.photoId, 'VIEWER');
    return reply || ok({ photo: photoDetail(photo, role) });
  });

  route('PATCH', '/api/photos/:photoId', ({ params, body }) => {
    const db = getDb();
    const { photo, role, reply } = loadPhoto(params.photoId, 'EDITOR');
    if (reply) return reply;
    if (body.caption !== undefined) photo.caption = typeof body.caption === 'string' && body.caption.trim() ? body.caption.trim().slice(0, 300) : null;
    if (body.takenAt !== undefined) photo.takenAt = body.takenAt || null;
    if (body.hidden !== undefined) photo.hidden = Boolean(body.hidden);
    if (body.countryCode !== undefined) {
      const code = body.countryCode ? String(body.countryCode).toUpperCase() : null;
      if (code && !countryExists(code)) return fail(400, 'Unknown country.');
      // A new gallery (another country, or none): it goes first there, as on the server
      if (code !== (photo.countryCode || null)) {
        photo.countryCode = code;
        photo.countryPosition = firstPosition(db.photos, 'country', photo);
      }
      markVisited(photo.mapId, code, 'PHOTO');
    }
    if (body.tripId !== undefined) {
      // Moving a photo between trips needs editor on the map, not just the trip
      if (!atLeast(mapRole(db.maps.find((m) => m.id === photo.mapId)), 'EDITOR')) return fail(403, 'Only the map’s editors can move photos between trips.');
      if (body.tripId && !db.trips.some((t) => t.id === body.tripId && t.mapId === photo.mapId)) return fail(400, 'That trip is not on this map.');
      const moved = (body.tripId || null) !== (photo.tripId || null);
      photo.tripId = body.tripId || null;
      if (moved && photo.tripId) photo.tripPosition = firstPosition(db.photos, 'trip', photo);
    }
    return ok({ photo: photoDetail(photo, role) });
  });

  // Rearranging a gallery, as the server: the country's gallery needs editor on the map,
  // the trip's an editor of the trip (a trip-only editor too)
  route('POST', '/api/photos/:photoId/move', ({ params, body }) => {
    const db = getDb();
    const { photo, role, reply } = loadPhoto(params.photoId, 'VIEWER');
    if (reply) return reply;
    const { gallery } = body || {};
    if (!POSITION_FIELD[gallery] || (gallery === 'trip' && !photo.tripId)) {
      return fail(400, 'Say which gallery to rearrange: "country", or "trip" for a photo on a trip.');
    }
    const galleryRole = gallery === 'trip' ? role : mapRole(db.maps.find((m) => m.id === photo.mapId));
    if (!atLeast(galleryRole, 'EDITOR')) return fail(403, 'You don’t have permission to do that.');
    const afterId = body.afterId ?? null;
    if (afterId !== null && (typeof afterId !== 'string' || afterId === photo.id)) return fail(400, 'Malformed data.');
    if (!movePhotoAfter(db.photos, gallery, photo, afterId)) {
      return fail(409, 'The photo it was dropped next to has moved or gone. Reload and try again.');
    }
    return ok({ message: 'Photo moved.' });
  });

  route('DELETE', '/api/photos/:photoId', ({ params }) => {
    const db = getDb();
    const { photo, reply } = loadPhoto(params.photoId, 'EDITOR');
    if (reply) return reply;
    db.photos = db.photos.filter((p) => p.id !== photo.id);
    db.photoLandmarks = db.photoLandmarks.filter((pl) => pl.photoId !== photo.id);
    db.trips.forEach((t) => {
      if (t.coverPhotoId === photo.id) t.coverPhotoId = null;
    });
    return ok({ message: 'Photo deleted.' });
  });

  route('POST', '/api/photos/:photoId/landmarks', ({ params, body }) => {
    const db = getDb();
    const { photo, role, reply } = loadPhoto(params.photoId, 'EDITOR');
    if (reply) return reply;
    if (!landmarkById(body.landmarkId)) return fail(400, 'Unknown landmark.');
    const existing = db.photoLandmarks.find((pl) => pl.photoId === photo.id && pl.landmarkId === body.landmarkId);
    if (existing) existing.confirmed = true;
    else db.photoLandmarks.push({ photoId: photo.id, landmarkId: body.landmarkId, source: 'MANUAL', distanceM: null, confirmed: true });
    return ok({ photo: photoDetail(photo, role) }, 201);
  });

  // Like the server: both answer with the whole photo, and 404 when there's no such match
  route('PATCH', '/api/photos/:photoId/landmarks/:landmarkId', ({ params, body }) => {
    const { photo, role, reply } = loadPhoto(params.photoId, 'EDITOR');
    if (reply) return reply;
    if (body.confirmed !== true) return fail(400, 'Malformed data.');
    const match = getDb().photoLandmarks.find((pl) => pl.photoId === photo.id && pl.landmarkId === params.landmarkId);
    if (!match) return fail(404, 'That landmark match could not be found.');
    match.confirmed = true;
    return ok({ photo: photoDetail(photo, role) });
  });

  route('DELETE', '/api/photos/:photoId/landmarks/:landmarkId', ({ params }) => {
    const db = getDb();
    const { photo, role, reply } = loadPhoto(params.photoId, 'EDITOR');
    if (reply) return reply;
    const matches = (pl) => pl.photoId === photo.id && pl.landmarkId === params.landmarkId;
    if (!db.photoLandmarks.some(matches)) return fail(404, 'That landmark match could not be found.');
    db.photoLandmarks = db.photoLandmarks.filter((pl) => !matches(pl));
    return ok({ photo: photoDetail(photo, role) });
  });
}
