// Postcards: the client's copy of the server's rules (utils/postcards/postcardRules.js), and the
// words the maker and the page use
import { describe, expect, it } from 'vitest';
import {
  PAID_POSTCARD_KINDS,
  POSTCARDS_PER_PERSON,
  POSTCARD_DEFAULT_STYLE,
  POSTCARD_KINDS,
  POSTCARD_KIND_CHOICES,
  POSTCARD_LIMITS,
  POSTCARD_MESSAGES,
  POSTCARD_PICTURE_MAX_BYTES,
  POSTCARD_PICTURE_TYPES,
  POSTCARD_STYLES,
  POSTCARD_STYLE_CHOICES,
  canSendPostcardKind,
  checkPostcardPicture,
  landmarkFitsPlace,
  messageFrom,
  parsePostcardInput,
  postcardLink,
  postcardTitle,
  sentOnWords,
  shownKind,
} from '@/utils/postcards/postcardRules';
import * as server from '../../../../../server/src/utils/postcards.js';
import { EVENT_MESSAGES } from '../../../../../server/src/utils/responses/responses.js';

// The server's words use a plain apostrophe; the client's a curly one
const plain = (text) => text.replace(/’/g, "'");

describe('the server’s rules, copied', () => {
  it('has the same kinds, styles, limits and caps', () => {
    expect([...POSTCARD_KINDS]).toEqual([...server.POSTCARD_KINDS]);
    expect([...PAID_POSTCARD_KINDS]).toEqual([...server.PAID_POSTCARD_KINDS]);
    expect([...POSTCARD_STYLES]).toEqual([...server.POSTCARD_STYLES]);
    expect(POSTCARD_DEFAULT_STYLE).toBe(server.POSTCARD_DEFAULT_STYLE);
    expect({ ...POSTCARD_LIMITS }).toEqual({ ...server.POSTCARD_LIMITS });
    expect(POSTCARDS_PER_PERSON).toBe(server.POSTCARDS_PER_PERSON);
    expect([...POSTCARD_PICTURE_TYPES]).toEqual([...server.POSTCARD_PICTURE_TYPES]);
    expect(POSTCARD_PICTURE_MAX_BYTES).toBe(server.POSTCARD_PICTURE_MAX_BYTES);
  });

  it('words its refusals as the server does', () => {
    for (const [key, words] of Object.entries(POSTCARD_MESSAGES)) expect(plain(words), key).toBe(EVENT_MESSAGES[key]);
  });

  it('decides plans, landmarks, messages and kinds alike', () => {
    for (const plan of ['FREE', 'REGULAR', 'PREMIUM', null]) {
      for (const kind of [...POSTCARD_KINDS, 'POSTER']) expect(canSendPostcardKind(plan, kind)).toBe(server.canSendPostcardKind(plan, kind));
    }
    for (const [landmark, place] of [['FR', 'FR'], ['GB', 'XE'], ['ID', 'XB'], ['IT', 'FR'], ['FR', 'XE'], [null, 'FR']]) {
      expect(landmarkFitsPlace(landmark, place)).toBe(server.landmarkFitsPlace(landmark, place));
    }
    for (const message of ['Hi\r\n\r\n\r\nthere  \nGran', '<b>Bold</b>', '', '   ', undefined, 7, 'x'.repeat(401)]) {
      expect(messageFrom(message)).toBe(server.messageFrom(message));
    }
    for (const sides of [{ kind: 'LANDMARK', landmark: null, hasPicture: false }, { kind: 'PHOTO', landmark: null, hasPicture: true }, { kind: 'PHOTO', hasPicture: false }]) {
      expect(shownKind(sides)).toBe(server.shownKind(sides));
    }
  });

  it('parses the same cards (a UUID landmark, as the server’s) and refuses the same ones', () => {
    const landmarkId = '00000000-0000-4000-8000-000000000001';
    const bodies = [
      { kind: 'COUNTRY', countryCode: 'FR', message: 'Hi!', toName: ' Gran\n', fromName: 'Sam' },
      { kind: 'LANDMARK', countryCode: 'FR', landmarkId, message: 'Hi', style: 'night' },
      { kind: 'PHOTO', countryCode: 'FR', pictureKey: 'k', message: 'Hi', style: 'airmail' },
      { kind: 'PHOTO', countryCode: 'FR', message: 'Hi' },
      { kind: 'POSTER', countryCode: 'FR', message: 'Hi' },
      { kind: 'COUNTRY', countryCode: 'fr', message: 'Hi' },
      { kind: 'COUNTRY', countryCode: 'FR', message: 'Hi', style: 'neon' },
      { kind: 'COUNTRY', countryCode: 'FR', message: '' },
      { kind: 'COUNTRY', countryCode: 'FR', message: 'x'.repeat(401) },
      { kind: 'COUNTRY', countryCode: 'FR', message: 'Hi', toName: 'x'.repeat(41) },
      { kind: 'LANDMARK', countryCode: 'FR', message: 'Hi' },
      null,
    ];
    for (const body of bodies) {
      const mine = parsePostcardInput(body);
      const theirs = server.parsePostcardInput(body);
      expect(mine.ok).toBe(theirs.ok);
      if (theirs.ok) expect(mine.value).toEqual(theirs.value);
      else expect(mine.error).toBe(theirs.error);
    }
  });

  it('checks a picture as the server does', () => {
    for (const picture of [
      { contentType: 'image/jpeg', bytes: 10 },
      { contentType: 'image/gif', bytes: 10 },
      { contentType: 'image/png', bytes: 0 },
      { contentType: 'image/webp', bytes: POSTCARD_PICTURE_MAX_BYTES + 1 },
    ]) {
      expect(checkPostcardPicture(picture)).toBe(server.checkPostcardPicture(picture));
    }
  });
});

describe('the mock’s landmarks', () => {
  it('take any id, as the mock’s are `lm-<slug>`', () => {
    expect(parsePostcardInput({ kind: 'LANDMARK', countryCode: 'FR', landmarkId: 'lm-eiffel-tower', message: 'Hi' }).value.landmarkId).toBe('lm-eiffel-tower');
  });
});

describe('the words', () => {
  it('links a card on this site, and names it by its place or landmark', () => {
    expect(postcardLink('https://myplanetview.com', 'PST2-CRD8-FRNC')).toBe('https://myplanetview.com/postcard/PST2-CRD8-FRNC');
    expect(postcardTitle('France')).toBe('A postcard from France');
    expect(postcardTitle('France', 'Eiffel Tower')).toBe('A postcard from Eiffel Tower');
    expect(postcardTitle(null)).toBe('A postcard from somewhere');
    expect(sentOnWords('2026-11-26T22:30:00.000Z')).toBe('26 November 2026');
  });

  it('offers the three kinds and four styles, in order', () => {
    expect(POSTCARD_KIND_CHOICES.map((c) => c.value)).toEqual([...POSTCARD_KINDS]);
    expect(POSTCARD_STYLE_CHOICES.map((c) => c.value)).toEqual([...POSTCARD_STYLES]);
    expect(POSTCARD_KIND_CHOICES[0].hint).toContain('Free on every plan');
  });
});
