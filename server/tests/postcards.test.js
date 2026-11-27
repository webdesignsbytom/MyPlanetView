// Postcards (26 Nov 2026; docs/API.md "Postcards"): the rules (src/utils/postcards.js), pure,
// and their codes kept out of the logs.
import { describe, expect, it } from 'vitest';
import {
  FREE_PHOTO_GROUPS,
  PAID_POSTCARD_KINDS,
  POSTCARD_DEFAULT_STYLE,
  POSTCARD_KINDS,
  POSTCARD_LIMITS,
  POSTCARD_PICTURE_MAX_BYTES,
  POSTCARD_STYLES,
  canSendPostcardKind,
  checkPostcardPicture,
  isFreePostcardPhoto,
  landmarkFitsPlace,
  messageFrom,
  parsePostcardInput,
  postcardExportItem,
  postcardListItem,
  postcardPhotoGroup,
  postcardView,
  shownKind,
} from '../src/utils/postcards.js';
import { redactUrl } from '../src/utils/redactUrl.js';
import POSTCARD_PHOTOS from '../src/data/postcardPhotos.json' with { type: 'json' };

const LANDMARK_ID = '00000000-0000-4000-8000-000000000001';
const card = (over = {}) => ({ kind: 'COUNTRY', countryCode: 'FR', message: 'Wish you were here!', ...over });

describe('the kinds and the plans', () => {
  it('has three kinds, two of them paid', () => {
    expect([...POSTCARD_KINDS]).toEqual(['COUNTRY', 'LANDMARK', 'PHOTO']);
    expect([...PAID_POSTCARD_KINDS]).toEqual(['LANDMARK', 'PHOTO']);
    expect(POSTCARD_STYLES).toContain(POSTCARD_DEFAULT_STYLE);
  });

  it('gives a country’s card to everyone, a landmark’s and a photo card to paid plans (the user, 26 Nov 2026)', () => {
    for (const plan of ['FREE', 'REGULAR', 'PREMIUM']) expect(canSendPostcardKind(plan, 'COUNTRY')).toBe(true);
    expect(canSendPostcardKind('FREE', 'LANDMARK')).toBe(false);
    expect(canSendPostcardKind('FREE', 'PHOTO')).toBe(false);
    expect(canSendPostcardKind('REGULAR', 'LANDMARK')).toBe(true);
    expect(canSendPostcardKind('PREMIUM', 'PHOTO')).toBe(true);
    expect(canSendPostcardKind(null, 'PHOTO')).toBe(false);
    expect(canSendPostcardKind('PREMIUM', 'POSTER')).toBe(false);
  });
});

describe('the photos on a card’s front', () => {
  it('knows each landmark’s photo by its Wikidata item: a city, the wilderness or a landmark', () => {
    const groups = Object.values(POSTCARD_PHOTOS);
    expect(groups.length).toBeGreaterThan(1000);
    expect(new Set(groups)).toEqual(new Set(['c', 'w', 'l']));
    expect(postcardPhotoGroup('Q243')).toBe('l'); // the Eiffel Tower
    expect(postcardPhotoGroup('Q39231')).toBe('w'); // Mount Fuji
    expect(postcardPhotoGroup('Q0')).toBeNull();
  });

  it('puts a city’s and the wilderness’s on every plan’s cards, never a landmark’s (the user, 26 Nov 2026)', () => {
    expect([...FREE_PHOTO_GROUPS]).toEqual(['c', 'w']);
    expect(isFreePostcardPhoto('Q39231')).toBe(true);
    expect(isFreePostcardPhoto('Q243')).toBe(false);
    expect(isFreePostcardPhoto('Q0')).toBe(false);
  });
});

describe('landmarkFitsPlace', () => {
  it('takes the place’s own landmarks, a UK nation’s from the UK and a region’s from its country', () => {
    expect(landmarkFitsPlace('FR', 'FR')).toBe(true);
    expect(landmarkFitsPlace('GB', 'XE')).toBe(true);
    expect(landmarkFitsPlace('ID', 'XB')).toBe(true);
    expect(landmarkFitsPlace('IT', 'FR')).toBe(false);
    expect(landmarkFitsPlace('FR', 'XE')).toBe(false);
    expect(landmarkFitsPlace(null, 'FR')).toBe(false);
  });
});

describe('messageFrom', () => {
  it('keeps line breaks, at most two in a row, and takes tags out', () => {
    expect(messageFrom('Hi Gran,\r\n\r\n\r\n\r\nThe sun is out!  \nLove')).toBe('Hi Gran,\n\nThe sun is out!\nLove');
    expect(messageFrom('<b>Hello</b> there')).toBe('Hello there');
  });

  it('is empty for nothing, and null for what isn’t text or is too long', () => {
    expect(messageFrom(undefined)).toBe('');
    expect(messageFrom('   ')).toBe('');
    expect(messageFrom(42)).toBeNull();
    expect(messageFrom('x'.repeat(POSTCARD_LIMITS.message + 1))).toBeNull();
    expect(messageFrom('x'.repeat(POSTCARD_LIMITS.message))).toHaveLength(POSTCARD_LIMITS.message);
  });
});

describe('parsePostcardInput', () => {
  it('takes a country’s card, in the classic style unless one is chosen', () => {
    expect(parsePostcardInput(card({ toName: '  Gran\nand Grandad ', fromName: 'Charlie' }))).toEqual({
      ok: true,
      value: {
        kind: 'COUNTRY',
        countryCode: 'FR',
        landmarkId: null,
        pictureKey: null,
        style: 'classic',
        message: 'Wish you were here!',
        toName: 'Gran and Grandad',
        fromName: 'Charlie',
      },
    });
    expect(parsePostcardInput(card({ style: 'airmail' })).value.style).toBe('airmail');
  });

  it('takes a landmark’s with its landmark, and a photo card with its picture’s key, nothing else', () => {
    expect(parsePostcardInput(card({ kind: 'LANDMARK', landmarkId: LANDMARK_ID, pictureKey: 'x' })).value).toMatchObject({
      kind: 'LANDMARK',
      landmarkId: LANDMARK_ID,
      pictureKey: null,
    });
    expect(parsePostcardInput(card({ kind: 'PHOTO', pictureKey: 'myplanetview/postcards/u/card-a.jpg', landmarkId: LANDMARK_ID })).value).toMatchObject({
      kind: 'PHOTO',
      landmarkId: null,
      pictureKey: 'myplanetview/postcards/u/card-a.jpg',
    });
    // A country's card may name its photo's landmark (a city or the wilderness)
    expect(parsePostcardInput(card({ kind: 'COUNTRY', landmarkId: LANDMARK_ID })).value.landmarkId).toBe(LANDMARK_ID);
    expect(parsePostcardInput(card({ kind: 'COUNTRY', landmarkId: null })).value.landmarkId).toBeNull();
    expect(parsePostcardInput(card({ kind: 'COUNTRY', landmarkId: 'paris' })).error).toBe('postcardLandmarkInvalid');
  });

  it('refuses what isn’t right, naming why', () => {
    const error = (body) => parsePostcardInput(body).error;
    expect(error(null)).toBe('postcardKindInvalid');
    expect(error(card({ kind: 'POSTER' }))).toBe('postcardKindInvalid');
    expect(error(card({ countryCode: 'france' }))).toBe('countryNotFound');
    expect(error(card({ style: 'neon' }))).toBe('postcardStyleInvalid');
    expect(error(card({ message: '' }))).toBe('postcardMessageRequired');
    expect(error(card({ message: '<br>' }))).toBe('postcardMessageRequired');
    expect(error(card({ message: 'x'.repeat(401) }))).toBe('postcardMessageTooLong');
    expect(error(card({ toName: 'x'.repeat(41) }))).toBe('postcardNameInvalid');
    expect(error(card({ fromName: 7 }))).toBe('postcardNameInvalid');
    expect(error(card({ kind: 'LANDMARK', landmarkId: 'eiffel' }))).toBe('postcardLandmarkInvalid');
    expect(error(card({ kind: 'PHOTO' }))).toBe('postcardPictureInvalid');
  });
});

describe('checkPostcardPicture', () => {
  it('takes a JPEG, PNG or WebP up to 8 MB', () => {
    expect(checkPostcardPicture({ contentType: 'image/jpeg', bytes: 1000 })).toBeNull();
    expect(checkPostcardPicture({ contentType: 'image/webp', bytes: POSTCARD_PICTURE_MAX_BYTES })).toBeNull();
    expect(checkPostcardPicture({ contentType: 'image/gif', bytes: 1000 })).toBe('postcardPictureType');
    expect(checkPostcardPicture({ contentType: 'image/svg+xml', bytes: 1000 })).toBe('postcardPictureType');
    expect(checkPostcardPicture({ contentType: 'image/png', bytes: 0 })).toBe('postcardPictureInvalid');
    expect(checkPostcardPicture({ contentType: 'image/png', bytes: '12' })).toBe('postcardPictureInvalid');
    expect(checkPostcardPicture({ contentType: 'image/png', bytes: POSTCARD_PICTURE_MAX_BYTES + 1 })).toBe('postcardPictureTooLarge');
  });
});

describe('the views', () => {
  const landmark = { id: LANDMARK_ID, name: 'Eiffel Tower', slug: 'eiffel-tower', wikidataId: 'Q243', countryCode: 'FR' };
  const row = {
    id: 'card-1',
    code: 'ABCDEFGHJKMN',
    senderId: 'u-1',
    kind: 'LANDMARK',
    countryCode: 'FR',
    style: 'vintage',
    message: 'Bonjour!',
    toName: 'Gran',
    fromName: 'Charlie',
    createdAt: new Date('2026-11-26T10:00:00.000Z'),
    landmark,
    picture: null,
  };

  it('shows what a card shows, never its sender or its picture’s key', () => {
    const view = postcardView(row, { code: 'ABCD-EFGH-JKMN' });
    expect(view).toEqual({
      code: 'ABCD-EFGH-JKMN',
      kind: 'LANDMARK',
      countryCode: 'FR',
      landmark,
      pictureUrl: null,
      style: 'vintage',
      message: 'Bonjour!',
      toName: 'Gran',
      fromName: 'Charlie',
      sentAt: '2026-11-26T10:00:00.000Z',
    });
    expect(JSON.stringify(view)).not.toMatch(/u-1|senderId/);
    expect(postcardListItem(row, { code: 'ABCD-EFGH-JKMN' })).toMatchObject({ id: 'card-1', code: 'ABCD-EFGH-JKMN' });
  });

  it('falls back to the place’s own picture when the landmark or the photo has gone', () => {
    expect(shownKind({ kind: 'LANDMARK', landmark: null, hasPicture: false })).toBe('COUNTRY');
    expect(shownKind({ kind: 'PHOTO', landmark: null, hasPicture: false })).toBe('COUNTRY');
    expect(shownKind({ kind: 'PHOTO', landmark: null, hasPicture: true })).toBe('PHOTO');
    expect(postcardView({ ...row, landmark: null }, { code: 'x' }).kind).toBe('COUNTRY');
  });

  it('puts everything written on it in "Your data", and a link to the sender’s own photo', () => {
    expect(postcardExportItem({ ...row, kind: 'PHOTO', landmark: null }, { code: 'ABCD-EFGH-JKMN', photoUrl: 'https://signed' })).toEqual({
      code: 'ABCD-EFGH-JKMN',
      kind: 'PHOTO',
      place: 'FR',
      landmark: null,
      style: 'vintage',
      message: 'Bonjour!',
      toName: 'Gran',
      fromName: 'Charlie',
      photoUrl: 'https://signed',
      sentAt: '2026-11-26T10:00:00.000Z',
    });
  });
});

describe('the logs', () => {
  it('never hold a card’s code, only the sender’s ids', () => {
    expect(redactUrl('/api/postcard/ABCD-EFGH-JKMN')).toBe('/api/postcard/:code');
    expect(redactUrl('/api/postcards/00000000-0000-4000-8000-000000000001/reset-link')).toBe(
      '/api/postcards/00000000-0000-4000-8000-000000000001/reset-link',
    );
  });
});
