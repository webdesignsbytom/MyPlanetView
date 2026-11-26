// Postcards (26 Nov 2026, the user's wish; docs/API.md "Postcards"): sent by a link of their own
// from a place on someone's map, never part of the map. The sender's own: they send them, list
// them, give one a new link or delete it; anyone with the link sees the card and downloads it.
// A country's card is free; a landmark's or one from your own photo needs a paid plan, the
// sender's own account's (a card isn't a map's). Events hold ids, kinds and places, never words.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createPostcardEvent } from '../event/travelUtils.js';
import { isUuid } from '../utils/travelValidation.js';
import { formatShareCode, normaliseShareCode } from '../utils/shareCodes.js';
import {
  POSTCARDS_PER_PERSON,
  POSTCARD_PICTURE_MAX_BYTES,
  POSTCARD_PICTURE_SAVE_WINDOW_MINUTES,
  POSTCARD_PICTURE_TYPES,
  POSTCARD_PICTURE_UNSAVED_LIMIT,
  canSendPostcardKind,
  checkPostcardPicture,
  landmarkFitsPlace,
  parsePostcardInput,
  postcardListItem,
  postcardView,
} from '../utils/postcards.js';
import {
  createPostcardInDB,
  deletePostcardInDB,
  findPostcardByCode,
  findPostcardById,
  findPostcardPictureUpload,
  findPostcardsSentBy,
  resetPostcardCodeInDB,
} from '../domain/postcards.js';
import { findCountryByCode, findLandmarkById } from '../domain/places.js';
import { loadUserPlan } from '../services/travel/plans.js';
import {
  buildPostcardPictureKey,
  deleteStoredObjects,
  headPrivateObject,
  postcardPictureFolder,
  presignPostcardPicture,
  signPhotoUrl,
} from '../services/s3/mediaService.js';
import { badRequest, conflict, forbidden, handler, notFound } from './helpers/travel.js';

const D = DOMAINS.postcards;

const log = (req, action, id, extra = {}) => logEvent(createPostcardEvent({ user: req.user, action, id, ...extra }));

// Does the caller's plan (their account's, a card being theirs) give landmark and photo cards?
const paidCardsFor = async (userId) => canSendPostcardKind((await loadUserPlan(userId)).plan, 'PHOTO');

// The picture's signed link (an hour or two, as a photo's), or null when it has none
const pictureUrlOf = async (row) => (row.picture?.key ? signPhotoUrl(row.picture.key) : null);
const viewOf = async (row) => postcardView(row, { code: formatShareCode(row.code), pictureUrl: await pictureUrlOf(row) });
const listItemOf = async (row) => postcardListItem(row, { code: formatShareCode(row.code), pictureUrl: await pictureUrlOf(row) });

// The caller's own card by its id; any other (or none) is a 404, so ids can't be probed
async function ownCard(req) {
  const row = isUuid(req.params.postcardId) ? await findPostcardById(req.params.postcardId) : null;
  return row && row.senderId === req.user.id ? row : null;
}

// GET /api/postcards -> `{ postcards, paidCards }`: the caller's cards, newest first, and whether
// their plan gives landmark and photo cards
export const getMyPostcardsHandler = handler(D, 'Get postcards', async (req, res) => {
  const [rows, paidCards] = await Promise.all([findPostcardsSentBy(req.user.id), paidCardsFor(req.user.id)]);
  return sendDataResponse(res, 200, { postcards: await Promise.all(rows.map(listItemOf)), paidCards });
});

// POST /api/postcards/picture/presign `{ contentType, bytes }` (verified, a paid plan) -> a PUT
// into the private bucket, signing both. The browser makes the picture again first (no camera
// details or location travel).
export const presignPostcardPictureHandler = handler(D, 'Presign postcard picture', async (req, res) => {
  if (!(await paidCardsFor(req.user.id))) return forbidden(req, res, D, EVENT_MESSAGES.postcardNeedsPlan);
  const { contentType, bytes } = req.body || {};
  const problem = checkPostcardPicture({ contentType, bytes });
  if (problem === 'postcardPictureTooLarge') return sendMessageResponse(res, 413, EVENT_MESSAGES[problem]);
  if (problem) return badRequest(req, res, D, EVENT_MESSAGES[problem]);

  const key = buildPostcardPictureKey({ userId: req.user.id, contentType });
  const { url, expiresIn } = await presignPostcardPicture({ key, contentType, bytes, userId: req.user.id, limit: POSTCARD_PICTURE_UNSAVED_LIMIT });
  return sendDataResponse(res, 200, {
    key,
    upload: { url, method: 'PUT', headers: { 'Content-Type': contentType }, bytes, expiresIn },
  });
});

// The picture a card names: the sender's own upload, unused, fresh, and in the bucket as an
// allowed picture. -> `{ picture }` (`{ mediaId, bytes, contentType }`), or `{ reply }` sent
async function checkSentPicture(req, res, key) {
  const invalid = () => ({ reply: badRequest(req, res, D, EVENT_MESSAGES.postcardPictureInvalid) });
  if (!key.startsWith(`${postcardPictureFolder(req.user.id)}card-`)) return invalid();
  const item = await findPostcardPictureUpload(key);
  if (!item || item.resource !== 'postcard' || item.ownerId !== req.user.id || item.usedAsPostcardPicture) return invalid();
  if (Date.now() - new Date(item.createdAt).getTime() > POSTCARD_PICTURE_SAVE_WINDOW_MINUTES * 60 * 1000) {
    return { reply: badRequest(req, res, D, EVENT_MESSAGES.postcardPictureExpired) };
  }
  const stored = await headPrivateObject(key);
  if (!stored) return invalid();
  if (stored.bytes > POSTCARD_PICTURE_MAX_BYTES || !POSTCARD_PICTURE_TYPES.includes(stored.contentType)) {
    await deleteStoredObjects([key]);
    return {
      reply:
        stored.bytes > POSTCARD_PICTURE_MAX_BYTES
          ? sendMessageResponse(res, 413, EVENT_MESSAGES.postcardPictureTooLarge)
          : badRequest(req, res, D, EVENT_MESSAGES.postcardPictureType),
    };
  }
  return { picture: { mediaId: item.id, bytes: stored.bytes, contentType: stored.contentType } };
}

// POST /api/postcards (verified): the card (utils/postcards.js parsePostcardInput) -> 201 `{ postcard }`
export const sendPostcardHandler = handler(D, 'Send postcard', async (req, res) => {
  const parsed = parsePostcardInput(req.body);
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.error]);
  const { pictureKey, ...card } = parsed.value;
  if (!(await findCountryByCode(card.countryCode))) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);
  if (card.kind !== 'COUNTRY' && !(await paidCardsFor(req.user.id))) return forbidden(req, res, D, EVENT_MESSAGES.postcardNeedsPlan);

  if (card.kind === 'LANDMARK') {
    const landmark = await findLandmarkById(card.landmarkId);
    if (!landmark || !landmarkFitsPlace(landmark.countryCode, card.countryCode)) {
      return badRequest(req, res, D, EVENT_MESSAGES.postcardLandmarkInvalid);
    }
  }
  let picture = null;
  if (card.kind === 'PHOTO') {
    const checked = await checkSentPicture(req, res, pictureKey);
    if (checked.reply) return checked.reply;
    ({ picture } = checked);
  }

  const made = await createPostcardInDB({ senderId: req.user.id, card, picture, cap: POSTCARDS_PER_PERSON });
  if (made.tooMany) return conflict(req, res, D, EVENT_MESSAGES.postcardTooMany);
  log(req, 'Send Success', made.postcard.id, { detail: `kind=${card.kind} place=${card.countryCode} style=${card.style}`, statusCode: 201 });
  return sendDataResponse(res, 201, { postcard: await listItemOf(made.postcard) });
});

// POST /api/postcards/:postcardId/reset-link (its sender, verified) -> `{ postcard }` with a new code
export const resetPostcardLinkHandler = handler(D, 'Reset postcard link', async (req, res) => {
  const row = await ownCard(req);
  if (!row) return notFound(req, res, D, EVENT_MESSAGES.postcardNotFound);
  const updated = await resetPostcardCodeInDB(row.id);
  log(req, 'Reset Link Success', row.id);
  return sendDataResponse(res, 200, { postcard: await listItemOf(updated) });
});

// DELETE /api/postcards/:postcardId (its sender, verified): the card, then its picture's file
export const deletePostcardHandler = handler(D, 'Delete postcard', async (req, res) => {
  const row = await ownCard(req);
  if (!row) return notFound(req, res, D, EVENT_MESSAGES.postcardNotFound);
  const key = await deletePostcardInDB(row.id);
  // The row no longer points at the file, so it can go (never throws; a failure is the cron's)
  if (key) await deleteStoredObjects([key]);
  log(req, 'Delete Success', row.id);
  return sendDataResponse(res, 200, { deleted: true });
});

// GET /api/postcard/:code (anyone) -> `{ postcard }`: the card as its link shows it (any code that
// can't be one finds nothing)
export const openPostcardHandler = handler(D, 'Open postcard', async (req, res) => {
  const normal = normaliseShareCode(req.params.code);
  const row = normal ? await findPostcardByCode(normal) : null;
  if (!row) return notFound(req, res, D, EVENT_MESSAGES.postcardNotFound);
  return sendDataResponse(res, 200, { postcard: await viewOf(row) });
});
