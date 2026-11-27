// Postcards (26 Nov 2026, the user's wish; docs/API.md "Postcards"): the server's rules, copied
// (server/src/utils/postcards.js; a test compares them), for the maker and mock mode, and what
// the maker and the page say. A card is its sender's, never a map's: a country's is free on every
// plan, a landmark's or one from your own photo on a paid plan.
import { postcardPath } from '@/utils/constants/routes';
import { serverText } from '@/utils/regex/regex';
import { countryOf } from '@/utils/map/ukNations';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

export const POSTCARD_KINDS = Object.freeze(['COUNTRY', 'LANDMARK', 'PHOTO']);
export const PAID_POSTCARD_KINDS = Object.freeze(['LANDMARK', 'PHOTO']);
export const POSTCARD_STYLES = Object.freeze(['classic', 'vintage', 'airmail', 'night']);
export const POSTCARD_DEFAULT_STYLE = 'classic';
export const POSTCARD_LIMITS = Object.freeze({ message: 400, toName: 40, fromName: 40 });
export const POSTCARDS_PER_PERSON = 1000;

const MB = 1024 * 1024;
export const POSTCARD_PICTURE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
export const POSTCARD_PICTURE_MAX_BYTES = 8 * MB;

// The words the server answers with (its EVENT_MESSAGES), for mock mode
export const POSTCARD_MESSAGES = Object.freeze({
  postcardKindInvalid: 'Choose the picture for the front of your postcard.',
  postcardStyleInvalid: 'Choose one of the postcard styles.',
  postcardMessageRequired: 'Write a message on the back of your postcard.',
  postcardMessageTooLong: 'That message is too long for a postcard: 400 characters at most.',
  postcardNameInvalid: 'Names on a postcard are 40 characters at most.',
  postcardLandmarkInvalid: 'Choose one of this place’s landmarks.',
  postcardNeedsPlan: 'Postcards of landmarks and of your own photos come with Business and First Class. A country’s postcard is free.',
  postcardPictureType: 'The photo must be a JPEG, PNG or WebP picture.',
  postcardPictureInvalid: 'That photo upload isn’t valid. Please add it again.',
  postcardPictureTooLarge: 'That photo is too big. Please choose a smaller one.',
  postcardTooMany: 'You have 1,000 postcards, the most at once. Delete some to send more.',
  postcardNotFound: 'That postcard isn’t there any more. Ask whoever sent it for a new link.',
  countryNotFound: 'That country isn’t on the map.',
});

// The photos on every plan's cards: a city's (c) and the wilderness's (w); a landmark's (l) is a
// paid plan's (27 Nov 2026, the user's wish)
export const FREE_PHOTO_GROUPS = Object.freeze(['c', 'w']);
export const isFreePhotoGroup = (group) => FREE_PHOTO_GROUPS.includes(group);

/** Can someone on `plan` (FREE, REGULAR, PREMIUM) send a card of `kind`? */
export const canSendPostcardKind = (plan, kind) =>
  POSTCARD_KINDS.includes(kind) && (!PAID_POSTCARD_KINDS.includes(kind) || (Boolean(plan) && plan !== 'FREE'));

/** Does a landmark in `landmarkCountry` belong on a card from `place` (its country, or a UK nation's or a region's country)? */
export const landmarkFitsPlace = (landmarkCountry, place) =>
  Boolean(landmarkCountry && place) && (landmarkCountry === place || countryOf(place) === landmarkCountry);

/** The message as the server keeps it: line breaks kept (at most two in a row), tags taken out. '' when empty, null when too long. */
export function messageFrom(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > POSTCARD_LIMITS.message) return null;
  return serverText(value.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')).slice(0, POSTCARD_LIMITS.message);
}

const nameFrom = (value, max) => (typeof value === 'string' ? serverText(value.replace(/\s+/g, ' ')).slice(0, max) || null : null);

/** The server's parsePostcardInput: `{ ok: true, value }`, or `{ ok: false, error }` (a POSTCARD_MESSAGES key). */
export function parsePostcardInput(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  if (!POSTCARD_KINDS.includes(input.kind)) return { ok: false, error: 'postcardKindInvalid' };
  const { kind } = input;
  if (typeof input.countryCode !== 'string' || !/^[A-Z]{2}$/.test(input.countryCode)) return { ok: false, error: 'countryNotFound' };
  const style = input.style ?? POSTCARD_DEFAULT_STYLE;
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
  // A landmark's card names its landmark, a country's may (its photo). The server wants a UUID;
  // the mock's landmarks' ids are `lm-<slug>`, so any id here
  const named = input.landmarkId !== undefined && input.landmarkId !== null && input.landmarkId !== '';
  const landmarkId = kind === 'LANDMARK' || (kind === 'COUNTRY' && named) ? input.landmarkId : null;
  if ((kind === 'LANDMARK' || (kind === 'COUNTRY' && named)) && (typeof landmarkId !== 'string' || !landmarkId)) {
    return { ok: false, error: 'postcardLandmarkInvalid' };
  }
  const pictureKey = kind === 'PHOTO' ? input.pictureKey : null;
  if (kind === 'PHOTO' && (typeof pictureKey !== 'string' || !pictureKey)) return { ok: false, error: 'postcardPictureInvalid' };
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

/** A picture about to be uploaded. -> null when fine, else a POSTCARD_MESSAGES key */
export function checkPostcardPicture({ contentType, bytes }) {
  if (!POSTCARD_PICTURE_TYPES.includes(contentType)) return 'postcardPictureType';
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return 'postcardPictureInvalid';
  if (bytes > POSTCARD_PICTURE_MAX_BYTES) return 'postcardPictureTooLarge';
  return null;
}

/** What a card shows, as it stands: a landmark's whose landmark has gone, or a photo card whose picture has, shows the place's own. */
export function shownKind({ kind, landmark, hasPicture }) {
  if (kind === 'LANDMARK' && !landmark) return 'COUNTRY';
  if (kind === 'PHOTO' && !hasPicture) return 'COUNTRY';
  return kind;
}

/** The card's link on this site (wherever it's running, as the share links are); `code` as the server shows it. */
export const postcardLink = (origin, code) => `${origin}${postcardPath(code)}`;

// What the maker offers, in its order: the front's picture, and the card's look
// The photos to choose from, by what they're of: a city and the wilderness on every plan, a
// landmark and your own photo on a paid one
export const POSTCARD_PHOTO_TABS = Object.freeze([
  { value: 'c', label: 'City', free: true },
  { value: 'w', label: 'Wilderness', free: true },
  { value: 'l', label: 'Landmarks', free: false },
  { value: 'own', label: 'Your photo', free: false },
]);
export const POSTCARD_STYLE_CHOICES = Object.freeze([
  { value: 'classic', label: 'Classic', hint: 'Cream card, red lettering' },
  { value: 'vintage', label: 'Vintage', hint: 'Old linen, sepia ink' },
  { value: 'airmail', label: 'Airmail', hint: 'Red and blue striped edge' },
  { value: 'night', label: 'Night', hint: 'Navy card, gold lettering' },
]);

/** "A postcard from France" (a landmark's: "A postcard from the Eiffel Tower"). */
export const postcardTitle = (placeName, landmarkName = null) => `A postcard from ${landmarkName || placeName || 'somewhere'}`;

/** "26 November 2026", as the postmark and the list say it. */
export const sentOnWords = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** A card's place's name ("France"), and its landmark's when it's a landmark's card. */
export const placeNameOf = (card) => COUNTRY_BY_CODE[card.countryCode]?.name ?? card.countryCode;
export const landmarkNameOf = (card) => (card.kind === 'LANDMARK' ? card.landmark?.name || null : null);

/** A file name from the card's place: "a-postcard-from-france-front.png". */
export const postcardFileName = (card, side) =>
  `${postcardTitle(placeNameOf(card), landmarkNameOf(card))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${side}.png`;
