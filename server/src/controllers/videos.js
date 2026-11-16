// First Class videos, kept in Cloudflare Stream (docs/API.md "Videos"): starting an upload
// (the browser sends the file straight to Stream, resumably), saving it as a video on the
// map, and Stream's notices. Stream converts every video, so every browser plays it.
import crypto from 'node:crypto';
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createPhotoEvent } from '../event/travelUtils.js';
import { canEdit } from '../utils/access.js';
import { CAPTION_MAX, isUuid, parseDateTime } from '../utils/travelValidation.js';
import { sanitizeText } from '../utils/sanitize.js';
import { VIDEO_MAX_SECONDS } from '../utils/constants/plans.js';
import { VIDEO_CONTENT_TYPES, VIDEO_MAX_BYTES } from '../utils/constants/mediaConstants.js';
import { LOCKED_MAP_MESSAGE, VIDEO_MESSAGES, checkVideoAllowed, checkVideoCap } from '../utils/planLimits.js';
import { readUploadTicket, signUploadTicket, verifyStreamWebhook, videoStateFrom } from '../utils/streamTokens.js';
import { STREAM_NOT_SET_UP, streamConfig, streamEnabled } from '../services/stream/streamConfig.js';
import { createDirectUpload, deleteVideo, getVideo, updateVideo } from '../services/stream/streamApi.js';
import { VIDEO_UPLOAD_HOURS, applyStreamNotice } from '../services/stream/videos.js';
import { loadMapPlan } from '../services/travel/plans.js';
import { countPhotosInCountry, createPhotoInDB, findPhotoById, findPhotoDetail } from '../domain/photos.js';
import { countryNameOf, parseOptionalCountry } from './helpers/countries.js';
import { placeOnMap } from '../utils/ukNations.js';
import { badRequest, conflict, denyUnless, forbidden, handler, loadUploadTarget, notFound } from './helpers/travel.js';
import { photoDetailView } from './helpers/views.js';

const D = DOMAINS.photos;
const HOUR_MS = 60 * 60 * 1000;

export const VIDEO_UPLOAD_MESSAGES = Object.freeze({
  invalid: 'Send the video’s size in bytes (up to 500 MB), its type (MP4 or MOV) and its length in seconds (up to 3 minutes).',
  ticket: 'That upload has expired or wasn’t started here. Start it again.',
  notArrived: 'The video hasn’t finished uploading yet.',
  failed: 'Cloudflare couldn’t read that video. Try another file.',
});

const ticketSecret = () => process.env.BETTER_AUTH_SECRET || '';
const isDuration = (value) => Number.isInteger(value) && value >= 1 && value <= VIDEO_MAX_SECONDS;

/** The map (or trip) and the owner's plan, as a photo upload checks them; null when a reply was sent. */
async function videoTarget(req, res, mapId, tripId) {
  if (tripId && !isUuid(tripId)) {
    notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
    return null;
  }
  const { map, role } = await loadUploadTarget(req, mapId, tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return null;
  const mapPlan = await loadMapPlan(map.id);
  if (!mapPlan) {
    notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
    return null;
  }
  if (mapPlan.locked) {
    forbidden(req, res, D, LOCKED_MAP_MESSAGE);
    return null;
  }
  const notAllowed = checkVideoAllowed(mapPlan.plan);
  if (notAllowed) {
    forbidden(req, res, D, notAllowed);
    return null;
  }
  return { map, mapPlan };
}

const videoLimits = async (planId, countryCode) => ({
  planId,
  kind: 'VIDEO',
  countryName: countryCode ? await countryNameOf(countryCode) : null,
});

// POST /maps/:mapId/videos/upload { bytes, contentType, durationS, tripId?, countryCode? }
// -> { photoId, uploadUrl, ticket, expiresAt }: the browser sends the file to `uploadUrl`
// (tus, resumable, no credentials), then saves it with the ticket
export const startVideoUploadHandler = handler(D, 'Start video upload', async (req, res) => {
  if (!streamEnabled()) return sendMessageResponse(res, 503, STREAM_NOT_SET_UP);
  const body = req.body || {};
  const tripId = body.tripId || null;
  const target = await videoTarget(req, res, req.params.mapId, tripId);
  if (!target) return undefined;

  if (
    !Number.isSafeInteger(body.bytes) ||
    body.bytes <= 0 ||
    !VIDEO_CONTENT_TYPES.includes(body.contentType) ||
    !isDuration(body.durationS)
  ) {
    if (Number.isSafeInteger(body.bytes) && body.bytes > VIDEO_MAX_BYTES) return sendMessageResponse(res, 413, EVENT_MESSAGES.photoTooLarge);
    if (body.durationS !== undefined && Number.isInteger(body.durationS) && body.durationS > VIDEO_MAX_SECONDS) {
      return badRequest(req, res, D, VIDEO_MESSAGES.duration);
    }
    return badRequest(req, res, D, VIDEO_UPLOAD_MESSAGES.invalid);
  }
  if (body.bytes > VIDEO_MAX_BYTES) return sendMessageResponse(res, 413, EVENT_MESSAGES.photoTooLarge);

  const hint = await parseOptionalCountry(body.countryCode);
  if (!hint.ok) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);
  if (hint.value) {
    const full = checkVideoCap({
      count: await countPhotosInCountry(target.map.id, placeOnMap(hint.value, target.map.splitUk), undefined, 'VIDEO'),
      ...(await videoLimits(target.mapPlan.plan, hint.value)),
    });
    if (full) return conflict(req, res, D, full);
  }

  const photoId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + VIDEO_UPLOAD_HOURS * HOUR_MS);
  const { uid, uploadUrl } = await createDirectUpload({
    bytes: body.bytes,
    // Stream refuses a longer one itself (the browser's reading of the length is trusted otherwise)
    maxDurationSeconds: VIDEO_MAX_SECONDS + 1,
    name: photoId,
    expiresAt,
  });
  const ticket = signUploadTicket(
    { photoId, uid, mapId: target.map.id, tripId, userId: req.user.id, bytes: body.bytes, durationS: body.durationS },
    { secret: ticketSecret(), expiresAt }
  );
  return sendDataResponse(res, 200, { photoId, uploadUrl, ticket, expiresAt });
});

// POST /maps/:mapId/videos { ticket, countryCode?, caption?, takenAt? } -> 201 { photo }:
// the upload, checked with Stream, saved as a video (PROCESSING until Stream has converted it)
export const saveVideoHandler = handler(D, 'Save video', async (req, res) => {
  if (!streamEnabled()) return sendMessageResponse(res, 503, STREAM_NOT_SET_UP);
  const body = req.body || {};
  const ticket = readUploadTicket(body.ticket, { secret: ticketSecret() });
  if (!ticket || ticket.mapId !== req.params.mapId || ticket.userId !== req.user.id) {
    return badRequest(req, res, D, VIDEO_UPLOAD_MESSAGES.ticket);
  }
  const target = await videoTarget(req, res, ticket.mapId, ticket.tripId);
  if (!target) return undefined;
  if (await findPhotoById(ticket.photoId)) return conflict(req, res, D, EVENT_MESSAGES.photoAlreadySaved);

  const country = await parseOptionalCountry(body.countryCode);
  if (!country.ok) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);
  const takenAt = parseDateTime(body.takenAt);
  if (!takenAt.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);

  const video = await getVideo(ticket.uid);
  if (!video || video.status?.state === 'pendingupload') return badRequest(req, res, D, VIDEO_UPLOAD_MESSAGES.notArrived);
  if (videoStateFrom(video) === 'FAILED') {
    await deleteVideo(ticket.uid).catch(() => {});
    return badRequest(req, res, D, VIDEO_UPLOAD_MESSAGES.failed);
  }

  // As the map keeps places: a UK nation is the UK on a map that doesn't split it
  const countryCode = country.value ? placeOnMap(country.value, target.map.splitUk) : null;
  const videoBytes = Number.isSafeInteger(video.size) && video.size > 0 ? video.size : ticket.bytes;
  const saved = await createPhotoInDB({
    photo: {
      id: ticket.photoId,
      mapId: target.map.id,
      uploaderId: req.user.id,
      tripId: ticket.tripId ?? null,
      kind: 'VIDEO',
      durationS: Number(video.duration) > 0 ? Math.min(600, Math.ceil(Number(video.duration))) : ticket.durationS,
      streamUid: ticket.uid,
      videoState: videoStateFrom(video),
      videoBytes,
      countryCode,
      caption: sanitizeText(body.caption, { maxLength: CAPTION_MAX }),
      takenAt: takenAt.value ?? null,
      latitude: null,
      longitude: null,
      width: Number(video.input?.width) > 0 ? video.input.width : 1920,
      height: Number(video.input?.height) > 0 ? video.input.height : 1080,
    },
    variants: [],
    landmarkMatches: [],
    // The country's 20 videos and the storage safety net, inside the save's transaction
    limits: await videoLimits(target.mapPlan.plan, countryCode),
  });
  if (saved.refused) {
    await deleteVideo(ticket.uid).catch(() => {});
    return conflict(req, res, D, saved.refused);
  }
  // Stream's own record names the row, for anyone looking at the account
  await updateVideo(ticket.uid, { meta: { photoId: ticket.photoId, mapId: target.map.id } }).catch((err) =>
    console.error('[stream] meta not set:', err.message)
  );
  logEvent(createPhotoEvent({ user: req.user, action: 'Create Success', id: ticket.photoId, detail: `map=${target.map.id} kind=VIDEO`, statusCode: 201 }));
  return sendDataResponse(res, 201, { photo: await photoDetailView(await findPhotoDetail(ticket.photoId), 'OWNER') });
});

// POST /api/videos/stream-webhook (raw body, mounted before the JSON parser): Stream's
// notice that a video is ready, or failed. Checked with the webhook secret.
export const streamWebhookHandler = async (req, res) => {
  const { webhookSecret } = streamConfig();
  if (!webhookSecret) return res.status(503).json({ status: 'error', message: STREAM_NOT_SET_UP });
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!verifyStreamWebhook({ header: req.get('Webhook-Signature'), body: raw, secret: webhookSecret })) {
    return res.status(400).json({ status: 'fail', message: 'Bad signature.' });
  }
  try {
    const result = await applyStreamNotice(JSON.parse(raw));
    return res.json({ received: true, updated: result.count });
  } catch (err) {
    console.error('[stream] webhook failed:', err.message);
    return res.status(500).json({ status: 'error', message: 'Webhook failed.' });
  }
};
