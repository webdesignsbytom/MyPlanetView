// Postcards (26 Nov 2026, the user's wish: "while you're on a trip you can send a post card ...
// with a message, selection of images, and a selection of styles. Or upload your own photo. Cool
// stamps and address area. You send them with a share link. They are not part of the map. And
// people can download them so they keep them forever"; docs/API.md "Postcards"). A card is its
// sender's, never a map's: a place, a picture (the place's own art, a landmark's, or a photo of
// their own), a style, a message and two names; anyone with its link sees it and can download it.
// The user's decisions (26 Nov 2026): a country's card is free on every plan, a landmark's or one
// from your own photo on a paid plan; the address is only for show (a name, never an address);
// the link lasts for good, until the sender deletes the card or their account. Pure, so tested
// on its own (tests/postcards.test.js); the client's copy is
// client/src/utils/postcards/postcardRules.js.
import { sanitizeText } from './sanitize.js';
import { isCountryCode, isUuid } from './travelValidation.js';
import { UK, isUkNation } from './ukNations.js';
import { regionParent } from './regionPlaces.js';
// Each landmark with a photo big enough to cover a card, and what it's of (images/src/tools/
// postcard-photos.mjs): c a city, w the wilderness, l a landmark
import POSTCARD_PHOTOS from '../data/postcardPhotos.json' with { type: 'json' };

const MB = 1024 * 1024;

// What the picture on its front is: the place's own (its poster), a landmark's (its photo and
// its little 3D model), or a photo the sender uploaded for it
export const POSTCARD_KINDS = Object.freeze(['COUNTRY', 'LANDMARK', 'PHOTO']);
// The kinds that need a paid plan (the user, 26 Nov 2026: "country postcards free")
export const PAID_POSTCARD_KINDS = Object.freeze(['LANDMARK', 'PHOTO']);
// The card's look (its paper, ink and edge): drawn by the client (utils/postcards/drawPostcard.js)
export const POSTCARD_STYLES = Object.freeze(['classic', 'vintage', 'airmail', 'night']);
export const POSTCARD_DEFAULT_STYLE = 'classic';

// The words on its back: the message, who it's to (a name on the address lines, only for show)
// and who it's from
export const POSTCARD_LIMITS = Object.freeze({ message: 400, toName: 40, fromName: 40 });

// A guard against a runaway script, not a plan limit: cards one person keeps at once
export const POSTCARDS_PER_PERSON = 1000;

// A photo of the sender's own: one picture, made again in the browser (no camera details or
// location travel), into the private bucket; saved with its card within the window, as a photo is
export const POSTCARD_PICTURE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
export const POSTCARD_PICTURE_MAX_BYTES = 8 * MB;
export const POSTCARD_PICTURE_SAVE_WINDOW_MINUTES = 50;
// Pictures presigned and never sent, per user over the last day (429 above)
export const POSTCARD_PICTURE_UNSAVED_LIMIT = 10;

// The photos on every plan's cards: a city's and the wilderness's (27 Nov 2026, the user's wish:
// "a cool city photo, or a wilderness photo, or a famous landmark photo"; country postcards free,
// landmark ones on a paid plan)
export const FREE_PHOTO_GROUPS = Object.freeze(['c', 'w']);

/** What a landmark's postcard photo is of (`c`, `w` or `l`), by its Wikidata item; null when it has none. */
export const postcardPhotoGroup = (wikidataId) => POSTCARD_PHOTOS[wikidataId] ?? null;

/** Can a country's card (every plan's) carry this landmark's photo? Only a city's or the wilderness's. */
export const isFreePostcardPhoto = (wikidataId) => FREE_PHOTO_GROUPS.includes(postcardPhotoGroup(wikidataId));

/** Can someone on `plan` (FREE, REGULAR, PREMIUM) send a card of `kind`? */
export const canSendPostcardKind = (plan, kind) => POSTCARD_KINDS.includes(kind) && (!PAID_POSTCARD_KINDS.includes(kind) || (Boolean(plan) && plan !== 'FREE'));

/** Does a landmark in `landmarkCountry` belong on a card from `place` (its country, or a UK nation's or a region's country)? */
export function landmarkFitsPlace(landmarkCountry, place) {
  if (!landmarkCountry || !place) return false;
  if (landmarkCountry === place) return true;
  if (isUkNation(place)) return landmarkCountry === UK;
  return regionParent(place) === landmarkCountry;
}

// One line of a name: no breaks, cut to its limit; null when empty
const nameFrom = (value, max) => (typeof value === 'string' ? sanitizeText(value.replace(/\s+/g, ' '), { maxLength: max }) : null);

/**
 * The message: line breaks kept (as "\n", at most two in a row), tags and control characters
 * taken out. -> the text, `''` when empty, or null when it isn't text or is too long (counted
 * as written, before anything is taken out, as the form counts it)
 */
export function messageFrom(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > POSTCARD_LIMITS.message) return null;
  const tidy = value.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return sanitizeText(tidy, { maxLength: POSTCARD_LIMITS.message }) || '';
}

/**
 * A card as sent: `{ kind, countryCode, landmarkId?, pictureKey?, style?, message, toName?,
 * fromName? }`. A landmark's card names its landmark, a country's may (a city's or the
 * wilderness's photo on its front), a photo card names its picture's key; the place is a code
 * (whether it exists is the database's to say).
 * -> `{ ok: true, value }`, or `{ ok: false, error }` (an EVENT_MESSAGES key)
 */
export function parsePostcardInput(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  if (!POSTCARD_KINDS.includes(input.kind)) return { ok: false, error: 'postcardKindInvalid' };
  const { kind } = input;
  if (!isCountryCode(input.countryCode)) return { ok: false, error: 'countryNotFound' };

  const style = input.style === undefined || input.style === null ? POSTCARD_DEFAULT_STYLE : input.style;
  if (!POSTCARD_STYLES.includes(style)) return { ok: false, error: 'postcardStyleInvalid' };

  const message = messageFrom(input.message);
  if (message === null) return { ok: false, error: 'postcardMessageTooLong' };
  if (!message) return { ok: false, error: 'postcardMessageRequired' };
  for (const field of ['toName', 'fromName']) {
    const value = input[field];
    if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > POSTCARD_LIMITS[field])) {
      return { ok: false, error: 'postcardNameInvalid' };
    }
  }

  let landmarkId = null;
  const named = input.landmarkId !== undefined && input.landmarkId !== null && input.landmarkId !== '';
  if (kind === 'LANDMARK' || (kind === 'COUNTRY' && named)) {
    if (!isUuid(input.landmarkId)) return { ok: false, error: 'postcardLandmarkInvalid' };
    landmarkId = input.landmarkId;
  }
  let pictureKey = null;
  if (kind === 'PHOTO') {
    if (typeof input.pictureKey !== 'string' || !input.pictureKey) return { ok: false, error: 'postcardPictureInvalid' };
    pictureKey = input.pictureKey;
  }

  return {
    ok: true,
    value: {
      kind,
      countryCode: input.countryCode,
      landmarkId,
      pictureKey,
      style,
      message,
      toName: nameFrom(input.toName, POSTCARD_LIMITS.toName),
      fromName: nameFrom(input.fromName, POSTCARD_LIMITS.fromName),
    },
  };
}

/** A picture about to be uploaded. -> null when fine, else an EVENT_MESSAGES key */
export function checkPostcardPicture({ contentType, bytes }) {
  if (!POSTCARD_PICTURE_TYPES.includes(contentType)) return 'postcardPictureType';
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return 'postcardPictureInvalid';
  if (bytes > POSTCARD_PICTURE_MAX_BYTES) return 'postcardPictureTooLarge';
  return null;
}

/**
 * What a card shows, as it stands: a landmark's card whose landmark has gone shows the place's
 * own picture, and so does a photo card whose picture has.
 */
export function shownKind({ kind, landmark, hasPicture }) {
  if (kind === 'LANDMARK' && !landmark) return 'COUNTRY';
  if (kind === 'PHOTO' && !hasPicture) return 'COUNTRY';
  return kind;
}

const landmarkView = (landmark) =>
  landmark ? { id: landmark.id, name: landmark.name, slug: landmark.slug, wikidataId: landmark.wikidataId, countryCode: landmark.countryCode } : null;

/**
 * A card as anyone with its link sees it: the picture's signed link (`pictureUrl`), never its
 * key or the sender's account. `code` is the link's, as shown.
 */
export const postcardView = (row, { code, pictureUrl = null } = {}) => ({
  code,
  kind: shownKind({ kind: row.kind, landmark: row.landmark, hasPicture: Boolean(pictureUrl) }),
  countryCode: row.countryCode,
  landmark: landmarkView(row.landmark),
  pictureUrl,
  style: row.style,
  message: row.message,
  toName: row.toName,
  fromName: row.fromName,
  sentAt: row.createdAt.toISOString(),
});

/** A card in its sender's list: what anyone sees, with its id. */
export const postcardListItem = (row, options) => ({ id: row.id, ...postcardView(row, options) });

/**
 * A card in its sender's "Your data" file: everything written on it, and a link to their own
 * photo on it (`photoUrl`, signed for the export's days), never its key.
 */
export const postcardExportItem = (row, { code, photoUrl = null } = {}) => ({
  code,
  kind: row.kind,
  place: row.countryCode,
  landmark: row.landmark?.name ?? null,
  style: row.style,
  message: row.message,
  toName: row.toName,
  fromName: row.fromName,
  photoUrl,
  sentAt: row.createdAt.toISOString(),
});
