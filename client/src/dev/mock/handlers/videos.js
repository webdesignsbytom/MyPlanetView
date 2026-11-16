// Mock mode only: First Class videos (docs/API.md "Videos"), as the server's
// controllers/videos.js: starting an upload to (the mock) Cloudflare Stream, then saving
// it as a video on the map, PROCESSING until the mock has "converted" it (../stream.js).
import { deny, fail, ok, route } from '../mockAdapter';
import { placeOnMap } from '@/utils/map/ukNations';
import { getDb, me, newId } from '../store';
import { atLeast, countryExists, mapRole, markVisited, photoDetail, tripRole } from '../views';
import { LOCKED_MAP_MESSAGE, VIDEO_CONTENT_TYPES, VIDEO_MAX_BYTES, VIDEO_MESSAGES, countryCapProblem, isMapLocked, videoNotAllowed } from '../plans';
import { firstPosition, setShotAt } from '../photoOrder';
import { MOCK_CONVERT_MS, convertMockVideo, createMockStreamUpload, deleteMockStreamVideo, mockStreamVideo } from '../stream';
import { VIDEO_MAX_SECONDS } from '@/utils/constants/plans';

// The server's VIDEO_UPLOAD_MESSAGES and EVENT_MESSAGES
const MESSAGES = {
  invalid: 'Send the video’s size in bytes (up to 500 MB), its type (MP4 or MOV) and its length in seconds (up to 3 minutes).',
  ticket: 'That upload has expired or wasn’t started here. Start it again.',
  notArrived: 'The video hasn’t finished uploading yet.',
  tooLarge: 'That file is too large.',
  country: 'That country isn’t on the map.',
  saved: 'That photo has already been saved.',
  mapNotFound: 'That map doesn’t exist, or it hasn’t been shared with you.',
};
// The server's VIDEO_UPLOAD_HOURS: an upload (and its ticket) lasts 6 hours
const UPLOAD_MS = 6 * 60 * 60 * 1000;
// Tickets handed out this session: ticket -> { photoId, uid, mapId, tripId, userId, bytes, durationS, expiresAt }
const tickets = new Map();

const isDuration = (value) => Number.isInteger(value) && value >= 1 && value <= VIDEO_MAX_SECONDS;
const cleanText = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);

/** The map (or trip) the video goes on, checked as a photo upload is: `{ map, trip }` or `{ reply }`. */
function videoTarget(mapId, tripId) {
  const db = getDb();
  const map = db.maps.find((m) => m.id === mapId) || null;
  const trip = tripId ? db.trips.find((t) => t.id === tripId && t.mapId === map?.id) || null : null;
  if (tripId && !trip) return { reply: fail(404, MESSAGES.mapNotFound) };
  const denied = deny(trip ? tripRole(trip) : mapRole(map), 'EDITOR', MESSAGES.mapNotFound);
  if (denied) return { reply: denied };
  if (isMapLocked(map)) return { reply: fail(403, LOCKED_MAP_MESSAGE) };
  const notAllowed = videoNotAllowed(map);
  if (notAllowed) return { reply: fail(403, notAllowed) };
  return { map, trip };
}

// '' or missing: no country; else a known code, or null (unknown)
const countryOf = (value) => {
  if (value === undefined || value === null || value === '') return { ok: true, value: null };
  const code = String(value).toUpperCase();
  return countryExists(code) ? { ok: true, value: code } : { ok: false };
};

export function registerVideoRoutes() {
  route('POST', '/api/maps/:mapId/videos/upload', ({ params, body = {} }) => {
    const target = videoTarget(params.mapId, body.tripId || null);
    if (target.reply) return target.reply;
    const { bytes, contentType, durationS } = body;
    if (Number.isSafeInteger(bytes) && bytes > VIDEO_MAX_BYTES) return fail(413, MESSAGES.tooLarge);
    if (Number.isInteger(durationS) && durationS > VIDEO_MAX_SECONDS) return fail(400, VIDEO_MESSAGES.duration);
    if (!Number.isSafeInteger(bytes) || bytes <= 0 || !VIDEO_CONTENT_TYPES.includes(contentType) || !isDuration(durationS)) {
      return fail(400, MESSAGES.invalid);
    }
    const hint = countryOf(body.countryCode);
    if (!hint.ok) return fail(400, MESSAGES.country);
    const full = countryCapProblem(target.map, hint.value && placeOnMap(hint.value, target.map.splitUk), 'VIDEO');
    if (full) return fail(409, full);

    const photoId = newId();
    const expiresAt = new Date(Date.now() + UPLOAD_MS).toISOString();
    const { uid, uploadUrl } = createMockStreamUpload({ bytes });
    const ticket = `mock-ticket-${newId()}`;
    tickets.set(ticket, { photoId, uid, mapId: target.map.id, tripId: target.trip?.id || null, userId: me().id, bytes, durationS, expiresAt });
    return ok({ photoId, uploadUrl, ticket, expiresAt });
  });

  route('POST', '/api/maps/:mapId/videos', ({ params, body = {} }) => {
    const db = getDb();
    const ticket = tickets.get(body.ticket);
    if (!ticket || ticket.mapId !== params.mapId || ticket.userId !== me().id || Date.parse(ticket.expiresAt) < Date.now()) {
      return fail(400, MESSAGES.ticket);
    }
    const target = videoTarget(ticket.mapId, ticket.tripId);
    if (target.reply) return target.reply;
    if (db.photos.some((p) => p.id === ticket.photoId)) return fail(409, MESSAGES.saved);
    const country = countryOf(body.countryCode);
    if (!country.ok) return fail(400, MESSAGES.country);
    const video = mockStreamVideo(ticket.uid);
    if (!video?.arrived) return fail(400, MESSAGES.notArrived);
    // The country's videos, with the final country: full -> 409, and the Stream video goes
    const full = countryCapProblem(target.map, country.value, 'VIDEO');
    if (full) {
      deleteMockStreamVideo(ticket.uid);
      tickets.delete(body.ticket);
      return fail(409, full);
    }

    const now = new Date();
    const photo = {
      id: ticket.photoId,
      mapId: target.map.id,
      uploaderId: me().id,
      tripId: ticket.tripId,
      kind: 'VIDEO',
      durationS: ticket.durationS,
      videoState: 'PROCESSING',
      // When the mock's "conversion" is done (views.js videoStateOf)
      readyAt: new Date(now.getTime() + MOCK_CONVERT_MS).toISOString(),
      videoBytes: video.size,
      countryCode: country.value && placeOnMap(country.value, target.map.splitUk),
      caption: cleanText(body.caption, 300),
      takenAt: typeof body.takenAt === 'string' && !Number.isNaN(Date.parse(body.takenAt)) ? body.takenAt : null,
      latitude: null,
      longitude: null,
      width: 1920,
      height: 1080,
      hidden: false,
      image: { kind: 'stream', uid: ticket.uid },
      createdAt: now.toISOString(),
    };
    setShotAt(photo);
    photo.countryPosition = firstPosition(db.photos, 'country', photo);
    photo.tripPosition = photo.tripId ? firstPosition(db.photos, 'trip', photo) : 0;
    db.photos.push(photo);
    tickets.delete(body.ticket);
    convertMockVideo(ticket.uid, { seconds: ticket.durationS });
    markVisited(photo.mapId, photo.countryCode, 'PHOTO');
    const role = ticket.tripId ? tripRole(target.trip) : mapRole(target.map);
    return ok({ photo: photoDetail(photo, atLeast(role, 'EDITOR') ? role : 'EDITOR') }, 201);
  });
}
