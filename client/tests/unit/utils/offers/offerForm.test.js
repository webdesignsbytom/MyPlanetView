import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_WORDS, emptyOfferForm, offerBodyFrom, offerFormFrom, offerUrlProblem, previewOfferFrom } from '@/utils/offers/offerForm';
import { OFFER_PLACEMENTS, checkOfferUrl, parseOfferInput } from '@/utils/offers/offerRules';

const filled = (extra = {}) => ({
  ...emptyOfferForm(),
  key: ' Example-Stays-JP ',
  partner: 'Example Stays',
  title: 'Hotels in Kyoto',
  url: ' https://example.com/hotels?q={destination} ',
  ...extra,
});

describe('PLACEHOLDER_WORDS', () => {
  it('lists the placeholders as a sentence', () => {
    expect(PLACEHOLDER_WORDS).toBe('{destination}, {country}, {checkin} and {checkout}');
  });
});

describe('offerUrlProblem', () => {
  it('says nothing about a good link', () => {
    expect(offerUrlProblem('https://example.com/{country}?q={destination}')).toBeNull();
  });

  it('says what’s wrong in words', () => {
    expect(offerUrlProblem('')).toBe('the link is missing');
    expect(offerUrlProblem('   ')).toBe('the link is missing');
    expect(offerUrlProblem(null)).toBe('the link is missing');
    expect(offerUrlProblem(`https://example.com/${'a'.repeat(2000)}`)).toBe('the link is longer than 2,000 characters');
    expect(offerUrlProblem('https://example.com/?q={city}')).toBe(
      'the link has {city}, which is never filled in (only {destination}, {country}, {checkin} and {checkout} are)',
    );
    expect(offerUrlProblem('example.com/hotels')).toBe('the link isn’t a whole web address (https://…)');
    expect(offerUrlProblem('http://example.com/')).toBe('the link must start with https://');
    expect(offerUrlProblem('https://me:secret@example.com/')).toBe('the link mustn’t hold a user name or password');
  });

  it('finds nothing to say about a placeholder in the host, which the rules still refuse', () => {
    expect(offerUrlProblem('https://{destination}.example.com/')).toBeNull();
    expect(checkOfferUrl('https://{destination}.example.com/')).toBeNull();
  });
});

describe('emptyOfferForm', () => {
  it('starts on every travel placement, with print left for the admin to tick', () => {
    const form = emptyOfferForm();
    expect(form.placements).toEqual(OFFER_PLACEMENTS.filter((p) => p !== 'PRINT'));
    expect(form).toMatchObject({ kind: 'HOTEL', weight: '1', active: true, firstDay: '', lastDay: '' });
  });

  it('gives each form its own list', () => {
    emptyOfferForm().placements.push('PRINT');
    expect(emptyOfferForm().placements).not.toContain('PRINT');
  });
});

describe('offerFormFrom', () => {
  it('turns a stored offer into the inputs’ strings', () => {
    const offer = {
      key: 'k',
      partner: 'P',
      kind: 'TOUR',
      title: 'T',
      blurb: null,
      countryCode: 'JP',
      placements: ['GALLERY'],
      url: 'https://x.example',
      imageKey: null,
      weight: 3,
      active: false,
      startsAt: '2027-06-01T00:00:00.000Z',
      endsAt: null,
    };
    expect(offerFormFrom(offer)).toEqual({
      key: 'k',
      partner: 'P',
      kind: 'TOUR',
      title: 'T',
      blurb: '',
      countryCode: 'JP',
      placements: ['GALLERY'],
      url: 'https://x.example',
      imageKey: '',
      weight: '3',
      active: false,
      firstDay: '2027-06-01',
      lastDay: '',
    });
  });

  it('fills what’s missing', () => {
    expect(offerFormFrom({ key: 'k' })).toMatchObject({ partner: '', kind: 'OTHER', placements: [], weight: '1', active: true });
  });
});

describe('offerBodyFrom', () => {
  it('makes a new offer’s body, which the rules take', () => {
    const result = offerBodyFrom(filled({ blurb: '  ', countryCode: '', placements: ['TRAVEL_DESK', 'GALLERY'], weight: ' 4 ' }));
    expect(result).toEqual({
      ok: true,
      body: {
        key: 'example-stays-jp',
        partner: 'Example Stays',
        title: 'Hotels in Kyoto',
        blurb: null,
        kind: 'HOTEL',
        countryCode: null,
        placements: ['GALLERY', 'TRAVEL_DESK'],
        url: 'https://example.com/hotels?q={destination}',
        imageKey: null,
        weight: 4,
        active: true,
        startsAt: null,
        endsAt: null,
      },
    });
    expect(parseOfferInput(result.body, { isKnownCountry: () => true }).ok).toBe(true);
  });

  it('sends the days as the first and last moments of UTC days', () => {
    const { body } = offerBodyFrom(filled({ firstDay: '2027-06-01', lastDay: '2027-08-31' }));
    expect(body.startsAt).toBe('2027-06-01T00:00:00.000Z');
    expect(body.endsAt).toBe('2027-08-31T23:59:59.999Z');
  });

  it('says what’s wrong with each field', () => {
    const result = offerBodyFrom({
      ...emptyOfferForm(),
      key: 'X',
      kind: 'SPA',
      placements: [],
      url: 'http://example.com',
      imageKey: 'logo.svg',
      weight: '0',
      firstDay: 'soon',
      lastDay: 'later',
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({
      key: 'A key is 2 to 64 lower-case letters, digits and dashes, starting with a letter or digit.',
      partner: 'Name the partner.',
      title: 'Give the card its line, e.g. Hotels in Kyoto.',
      kind: 'Choose what it offers.',
      placements: 'Choose at least one place to show it.',
      url: 'The link must start with https://.',
      imageKey: 'A file in the public bucket: letters, digits and / _ . - only, ending .avif, .webp, .jpg, .jpeg or .png.',
      weight: 'A whole number from 1 to 100.',
      firstDay: 'Pick a day, or leave it empty to start now.',
      lastDay: 'Pick a day, or leave it empty for no end.',
    });
  });

  it('refuses a last day before the first, a weight that isn’t whole and a link it can’t use', () => {
    const result = offerBodyFrom(filled({ firstDay: '2027-06-02', lastDay: '2027-06-01', weight: '2.5', url: 'https://{destination}.example.com/' }));
    expect(result.errors).toEqual({
      lastDay: 'The last day can’t be before the first.',
      weight: 'A whole number from 1 to 100.',
      url: 'The link isn’t one we can use.',
    });
  });

  it('sends no key on a change, and a day only when it changed', () => {
    const existing = { key: 'k', startsAt: '2027-06-01T08:30:00.000Z', endsAt: '2027-08-31T20:00:00.000Z' };
    const unchanged = offerBodyFrom(filled({ key: 'ignored', firstDay: '2027-06-01', lastDay: '2027-08-31' }), { existing });
    expect(unchanged.ok).toBe(true);
    expect(unchanged.body).not.toHaveProperty('key');
    expect(unchanged.body).not.toHaveProperty('startsAt');
    expect(unchanged.body).not.toHaveProperty('endsAt');

    const changed = offerBodyFrom(filled({ firstDay: '2027-06-02', lastDay: '' }), { existing });
    expect(changed.body.startsAt).toBe('2027-06-02T00:00:00.000Z');
    expect(changed.body.endsAt).toBeNull();
  });

  it('keeps a good picture key', () => {
    expect(offerBodyFrom(filled({ imageKey: ' offers/kyoto.webp ' })).body.imageKey).toBe('offers/kyoto.webp');
  });
});

describe('previewOfferFrom', () => {
  it('shows what’s typed so far, with stand-ins', () => {
    expect(previewOfferFrom(emptyOfferForm())).toEqual({
      partner: 'Partner',
      kind: 'HOTEL',
      title: 'The card’s line',
      blurb: null,
      countryCode: null,
      imageKey: null,
    });
    expect(previewOfferFrom(filled({ blurb: '<b>Near</b> the station', countryCode: 'JP', imageKey: ' a.png ' }))).toMatchObject({
      partner: 'Example Stays',
      title: 'Hotels in Kyoto',
      blurb: 'Near the station',
      countryCode: 'JP',
      imageKey: 'a.png',
    });
  });

  it('leaves out a picture key that isn’t one', () => {
    expect(previewOfferFrom(filled({ imageKey: 'logo.svg' })).imageKey).toBeNull();
  });
});
