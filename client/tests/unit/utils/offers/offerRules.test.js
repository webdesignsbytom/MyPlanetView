import { describe, expect, it } from 'vitest';
import {
  OFFER_IMAGE_KEY_PATTERN,
  OFFER_IMPORT_DEFAULTS,
  OFFER_KEY_PATTERN,
  OFFER_KINDS,
  OFFER_LIMITS,
  OFFER_PLACEMENTS,
  URL_PLACEHOLDERS,
  checkOfferUrl,
  cleanOfferText,
  fillOfferUrl,
  offerIsLive,
  offersIn,
  parseOfferInput,
} from '@/utils/offers/offerRules';
// The server's rules, which these copy (change both together)
import * as server from '../../../../../server/src/utils/offers.js';
import { sanitizeText } from '../../../../../server/src/utils/sanitize.js';

const known = (code) => ['JP', 'FR', 'GB'].includes(code);
const newOffer = (extra = {}) => ({
  key: 'example-stays-jp',
  partner: 'Example Stays',
  kind: 'HOTEL',
  title: 'Hotels in Kyoto',
  placements: ['GALLERY', 'TRAVEL_DESK'],
  url: 'https://example.com/hotels?q={destination}&in={checkin}&out={checkout}',
  ...extra,
});

describe('the constants', () => {
  it('are the server’s', () => {
    expect(OFFER_KINDS).toEqual(server.OFFER_KINDS);
    expect(OFFER_PLACEMENTS).toEqual(server.OFFER_PLACEMENTS);
    expect(URL_PLACEHOLDERS).toEqual(server.URL_PLACEHOLDERS);
    expect(OFFER_KEY_PATTERN.source).toBe(server.OFFER_KEY_PATTERN.source);
    const { destination, ...serverLimits } = server.OFFER_LIMITS;
    expect(destination).toBe(80);
    expect(OFFER_LIMITS).toEqual(serverLimits);
  });

  it('take a picture key in the public bucket, never SVG or a way out of it', () => {
    for (const key of ['visitCountryPosters/jp-800.avif', 'offers/a_b.c-1.webp', 'x.jpg', 'x.jpeg', 'x.png']) {
      expect(OFFER_IMAGE_KEY_PATTERN.test(key)).toBe(true);
    }
    for (const key of ['logo.svg', '../secret.png', 'a/../b.png', '/root.png', 'no-extension', 'sp ace.png']) {
      expect(OFFER_IMAGE_KEY_PATTERN.test(key)).toBe(false);
    }
  });

  it('give an imported offer’s missing fields their defaults', () => {
    expect(OFFER_IMPORT_DEFAULTS).toEqual({ blurb: null, countryCode: null, imageKey: null, weight: 1, active: true, startsAt: null, endsAt: null });
  });
});

describe('cleanOfferText', () => {
  it('cleans as the server’s sanitizeText does', () => {
    const samples = ['  Hotels <b>in</b> Kyoto ', 'Tab\there\nand line', 'Bell\u0007and\u007fdelete', '<script>x</script>', '   ', 'a'.repeat(100)];
    for (const text of samples) expect(cleanOfferText(text, 60)).toBe(sanitizeText(text, { maxLength: 60 }));
  });

  it('keeps null as null', () => {
    expect(cleanOfferText(null, 10)).toBeNull();
    expect(cleanOfferText(undefined, 10)).toBeNull();
  });
});

describe('checkOfferUrl', () => {
  const samples = [
    'https://example.com/hotels?q={destination}',
    'https://example.com/{country}/stays?from={checkin}&to={checkout}',
    'https://example.com/plain',
    'http://example.com/insecure',
    'https://user:pass@example.com/x',
    'https://example.com/?q={city}',
    'https://example.com{destination}',
    'https://{destination}.example.com/',
    'not a link',
    '',
    `https://example.com/${'a'.repeat(2000)}`,
    'javascript:alert(1)',
    'https://example.com/{}',
  ];

  it('agrees with the server on every link', () => {
    for (const url of samples) expect(checkOfferUrl(url)).toBe(server.checkOfferUrl(url));
    expect(checkOfferUrl(42)).toBe(server.checkOfferUrl(42));
  });

  it('takes an https link with known placeholders anywhere but the host', () => {
    expect(checkOfferUrl(samples[0])).toBe(samples[0]);
    expect(checkOfferUrl(samples[1])).toBe(samples[1]);
  });

  it('refuses http, a user name, an unknown placeholder and one in the host', () => {
    expect(checkOfferUrl('http://example.com/insecure')).toBeNull();
    expect(checkOfferUrl('https://user:pass@example.com/x')).toBeNull();
    expect(checkOfferUrl('https://example.com/?q={city}')).toBeNull();
    expect(checkOfferUrl('https://example.com{destination}')).toBeNull();
    expect(checkOfferUrl('https://{destination}.example.com/')).toBeNull();
  });
});

describe('parseOfferInput', () => {
  // Each input, run through both: the same answer, field for field
  const cases = [
    ['a whole new offer', newOffer(), {}],
    ['a new offer with every field', newOffer({ blurb: ' Stay <i>central</i> ', countryCode: 'JP', imageKey: 'offers/kyoto.webp', weight: 7, active: false, startsAt: '2027-06-01T00:00:00Z', endsAt: '2027-08-31T23:59:59Z' }), {}],
    ['no body', null, {}],
    ['a list', [], {}],
    ['a bad key', newOffer({ key: 'Bad Key' }), {}],
    ['a one-letter key', newOffer({ key: 'a' }), {}],
    ['no partner', newOffer({ partner: undefined }), {}],
    ['a blank partner', newOffer({ partner: ' <b></b> ' }), {}],
    ['a partner that isn’t text', newOffer({ partner: 5 }), {}],
    ['a null title', newOffer({ title: null }), {}],
    ['a null blurb', newOffer({ blurb: null }), {}],
    ['a blurb that isn’t text', newOffer({ blurb: ['x'] }), {}],
    ['an unknown kind', newOffer({ kind: 'SPA' }), {}],
    ['no placements', newOffer({ placements: [] }), {}],
    ['an unknown placement', newOffer({ placements: ['GALLERY', 'BILLBOARD'] }), {}],
    ['placements twice', newOffer({ placements: ['GALLERY', 'GALLERY'] }), {}],
    ['an http link', newOffer({ url: 'http://example.com' }), {}],
    ['an unknown country', newOffer({ countryCode: 'ZZ' }), {}],
    ['a lower-case country', newOffer({ countryCode: 'jp' }), {}],
    ['no country', newOffer({ countryCode: null }), {}],
    ['an SVG picture', newOffer({ imageKey: 'offers/logo.svg' }), {}],
    ['a weight of 0', newOffer({ weight: 0 }), {}],
    ['a weight of 101', newOffer({ weight: 101 }), {}],
    ['a weight of 2.5', newOffer({ weight: 2.5 }), {}],
    ['active as text', newOffer({ active: 'yes' }), {}],
    ['a start that isn’t a date', newOffer({ startsAt: 'soon' }), {}],
    ['a start that isn’t text', newOffer({ startsAt: 12 }), {}],
    ['dates cleared', newOffer({ startsAt: '', endsAt: null }), {}],
    ['an end before the start', newOffer({ startsAt: '2027-06-01T00:00:00Z', endsAt: '2027-05-01T00:00:00Z' }), {}],
    ['a change of title only', { title: 'Stays in Osaka' }, { existing: { key: 'example-stays-jp' } }],
    ['a change of key', { key: 'another-key' }, { existing: { key: 'example-stays-jp' } }],
    ['the same key sent with a change', { key: 'example-stays-jp', weight: 3 }, { existing: { key: 'example-stays-jp' } }],
    ['a change ending before the stored start', { endsAt: '2027-01-01T00:00:00Z' }, { existing: { key: 'k', startsAt: new Date('2027-06-01T00:00:00Z') } }],
    ['a change of start after the stored end', { startsAt: '2028-01-01T00:00:00Z' }, { existing: { key: 'k', endsAt: '2027-12-31T00:00:00Z' } }],
  ];

  it.each(cases)('answers %s as the server does', (_, body, options) => {
    expect(parseOfferInput(body, { isKnownCountry: known, ...options })).toEqual(server.parseOfferInput(body, { isKnownCountry: known, ...options }));
  });

  it('gives a new offer’s fields cleaned, with dates as Dates', () => {
    const result = parseOfferInput(newOffer({ blurb: ' Stay <i>central</i> ', startsAt: '2027-06-01T00:00:00Z', placements: ['GALLERY', 'GALLERY'] }), { isKnownCountry: known });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ key: 'example-stays-jp', blurb: 'Stay central', placements: ['GALLERY'] });
    expect(result.data.startsAt).toEqual(new Date('2027-06-01T00:00:00Z'));
  });

  it('names the first field that’s wrong', () => {
    expect(parseOfferInput(newOffer({ key: 'BAD', kind: 'SPA' }), { isKnownCountry: known })).toEqual({ ok: false, field: 'key' });
    expect(parseOfferInput(newOffer({ url: 'ftp://x' }), { isKnownCountry: known })).toEqual({ ok: false, field: 'url' });
    expect(parseOfferInput(newOffer({ countryCode: 'ZZ' }), { isKnownCountry: known })).toEqual({ ok: false, field: 'countryCode' });
  });

  it('sends only what a change names', () => {
    expect(parseOfferInput({ title: 'Stays in Osaka' }, { existing: { key: 'k' }, isKnownCountry: known })).toEqual({ ok: true, data: { title: 'Stays in Osaka' } });
  });

  it('refuses a date after the year 9999, as the server does', () => {
    const body = newOffer({ endsAt: '+010000-01-01T00:00:00.000Z' });
    expect(server.parseOfferInput(body, { isKnownCountry: known })).toEqual({ ok: false, field: 'endsAt' });
    expect(parseOfferInput(body, { isKnownCountry: known })).toEqual({ ok: false, field: 'endsAt' });
  });
});

describe('offerIsLive', () => {
  const now = new Date('2027-07-01T12:00:00Z');
  const cases = [
    { active: true },
    { active: false },
    { active: true, startsAt: '2027-07-01T12:00:00Z' },
    { active: true, startsAt: '2027-07-02T00:00:00Z' },
    { active: true, endsAt: '2027-07-01T12:00:00Z' },
    { active: true, endsAt: '2027-07-01T12:00:01Z' },
    { active: true, startsAt: '2027-06-01T00:00:00Z', endsAt: '2027-08-01T00:00:00Z' },
  ];

  it('agrees with the server: on, started, and not yet ended', () => {
    expect(cases.map((offer) => Boolean(offerIsLive(offer, now)))).toEqual([true, false, true, false, false, true, true]);
    for (const offer of cases) expect(Boolean(offerIsLive(offer, now))).toBe(Boolean(server.offerIsLive(offer, now)));
  });
});

describe('offersIn', () => {
  it('finds the list in a file or takes a bare list', () => {
    const offers = [{ key: 'a' }];
    expect(offersIn({ offers })).toBe(offers);
    expect(offersIn(offers)).toBe(offers);
    expect(offersIn({ offers: 'x' })).toBeNull();
    expect(offersIn(null)).toBeNull();
  });
});

describe('fillOfferUrl', () => {
  it('fills the placeholders URL-encoded, and empty when unknown, as the server does', () => {
    const url = 'https://example.com/{country}/s?q={destination}&in={checkin}&out={checkout}&x={other}';
    const context = { destination: 'São Paulo & más', country: 'BR', checkin: '2027-01-02' };
    expect(fillOfferUrl(url, context)).toBe('https://example.com/BR/s?q=S%C3%A3o%20Paulo%20%26%20m%C3%A1s&in=2027-01-02&out=&x={other}');
    expect(fillOfferUrl(url, context)).toBe(server.fillOfferUrl(url, context));
    expect(fillOfferUrl('https://example.com/{country}')).toBe('https://example.com/');
  });
});
