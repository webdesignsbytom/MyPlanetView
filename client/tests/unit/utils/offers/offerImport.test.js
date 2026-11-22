import { describe, expect, it, vi } from 'vitest';
import { OFFER_FILE_MAX_BYTES, importPlan, problemSentences, readOfferFile } from '@/utils/offers/offerImport';

const file = (text, name = 'offers.json') => new File([text], name, { type: 'application/json' });

describe('readOfferFile', () => {
  it('asks for a file when there’s none', async () => {
    expect(await readOfferFile(null)).toEqual({ ok: false, error: 'Choose a file first.' });
  });

  it('refuses a file over 2 MB before reading it', async () => {
    const result = await readOfferFile({ name: 'big.json', size: OFFER_FILE_MAX_BYTES + 1 });
    expect(result).toEqual({ ok: false, error: 'big.json is too big to import: a file can be up to 2 MB (500 offers fit easily).' });
  });

  it('reads a file of offers', async () => {
    const payload = { _about: 'x', offers: [{ key: 'a' }, { key: 'b' }] };
    expect(await readOfferFile(file(JSON.stringify(payload)))).toEqual({ ok: true, payload, offers: payload.offers });
  });

  it('takes a bare list, and a file starting with a byte-order mark', async () => {
    const BOM = String.fromCharCode(0xfeff);
    const result = await readOfferFile(file(`${BOM}${JSON.stringify([{ key: 'a' }])}`));
    expect(result).toEqual({ ok: true, payload: { offers: [{ key: 'a' }] }, offers: [{ key: 'a' }] });
  });

  it('says what’s wrong with a file that isn’t JSON', async () => {
    const result = await readOfferFile(file('{ "offers": [ ', 'broken.json'));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/^broken\.json isn’t a JSON file we can read\. Check for a missing comma, quote or bracket \(the browser says: .+\)\.$/);
  });

  it('says when it holds no list of offers', async () => {
    expect(await readOfferFile(file('{"deals": []}'))).toEqual({
      ok: false,
      error: 'offers.json doesn’t hold a list of offers: it should look like { "offers": [ … ] }.',
    });
  });

  it('wants 1 to 500 offers', async () => {
    expect((await readOfferFile(file('{"offers": []}'))).error).toBe('An import holds 1 to 500 offers; offers.json has 0.');
    const many = JSON.stringify({ offers: Array.from({ length: 1001 }, (_, i) => ({ key: `k${i}` })) });
    expect((await readOfferFile(file(many))).error).toBe('An import holds 1 to 500 offers; offers.json has 1,001.');
  });

  it('says when the browser couldn’t read it', async () => {
    class FailingReader {
      readAsText() {
        this.error = new Error('nope');
        this.onerror();
      }
    }
    vi.stubGlobal('FileReader', FailingReader);
    expect(await readOfferFile(file('{}', 'locked.json'))).toEqual({ ok: false, error: 'locked.json couldn’t be read. Choose it again.' });
  });
});

describe('importPlan', () => {
  it('splits the keys into new ones and ones to update', () => {
    const offers = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, null, { key: 7 }];
    expect(importPlan(offers, ['b', 'z'])).toEqual({ total: 5, newKeys: ['a', 'c', '', ''], updateKeys: ['b'] });
  });
});

describe('problemSentences', () => {
  const offers = [
    { key: 'good-one' },
    { key: 'good-one' },
    { key: 'Bad Key', partner: 5, title: null },
    'not an offer',
    { key: 'p', placements: ['GALLERY', 'BILLBOARD'], countryCode: 'ZZ', url: 'http://x.example', endsAt: '2027-01-01T00:00:00Z' },
    { key: 'q', placements: 'GALLERY', endsAt: 'later' },
  ];
  const sentence = (index, field, key = offers[index]?.key) => problemSentences([{ index, key, field }], offers)[0];

  it('words a problem with the whole file', () => {
    expect(problemSentences([{ index: null, field: 'offers' }])).toEqual(['The file must hold a list of 1 to 500 offers, written { "offers": [ … ] }']);
  });

  it('names each offer by its number and key', () => {
    expect(sentence(3, 'offer', undefined)).toBe('Offer 4: it isn’t an offer: each one is written { "key": …, "partner": …, … } inside the list');
    expect(sentence(1, 'key')).toBe('Offer 2 (good-one): the key is already used by offer 1 in this file');
    expect(sentence(2, 'key')).toBe('Offer 3 (Bad Key): the key must be 2 to 64 lower-case letters, digits and dashes, starting with a letter or digit');
    expect(problemSentences([{ index: 0, key: null, field: 'key' }], [{}])).toEqual(['Offer 1: the key is missing']);
  });

  it('words the text fields', () => {
    expect(sentence(2, 'partner')).toBe('Offer 3 (Bad Key): the partner’s name must be text');
    expect(sentence(0, 'partner')).toBe('Offer 1 (good-one): the partner’s name is missing');
    expect(sentence(2, 'title')).toBe('Offer 3 (Bad Key): the title (the card’s line) is missing');
    expect(sentence(0, 'blurb')).toBe('Offer 1 (good-one): the blurb must be text, or null for none');
  });

  it('names an unknown placement, or asks for one', () => {
    expect(sentence(4, 'placements')).toBe(
      'Offer 5 (p): "BILLBOARD" isn’t a place offers show (use GALLERY, SLIDESHOW, COUNTRY_PAGE, TRAVEL_DESK, PRINT)',
    );
    expect(sentence(5, 'placements')).toBe(
      'Offer 6 (q): it must show somewhere: give "placements" one or more of GALLERY, SLIDESHOW, COUNTRY_PAGE, TRAVEL_DESK, PRINT',
    );
  });

  it('words the link, the country, the picture, the numbers and the dates', () => {
    expect(sentence(4, 'url')).toBe('Offer 5 (p): the link must start with https://');
    expect(sentence(4, 'countryCode')).toBe(
      'Offer 5 (p): "ZZ" isn’t a country code we know: use two capital letters, such as "JP", or null for an offer for anywhere',
    );
    expect(sentence(4, 'imageKey')).toMatch(/^Offer 5 \(p\): the picture must be a file in the public bucket/);
    expect(sentence(4, 'kind')).toBe('Offer 5 (p): the kind must be one of HOTEL, TOUR, FLIGHT, ESIM, INSURANCE, LUGGAGE, CAR_HIRE, OTHER, PRINTS');
    expect(sentence(4, 'weight')).toBe('Offer 5 (p): the weight must be a whole number from 1 to 100');
    expect(sentence(4, 'active')).toBe('Offer 5 (p): "active" must be true or false');
    expect(sentence(4, 'startsAt')).toBe('Offer 5 (p): the start must be a date and time, such as "2027-06-01T00:00:00Z", or null');
    expect(sentence(4, 'endsAt')).toBe('Offer 5 (p): the end is before the start');
    expect(sentence(5, 'endsAt')).toBe('Offer 6 (q): the end must be a date and time, such as "2027-08-31T23:59:59Z", or null');
    expect(sentence(4, 'colour')).toBe('Offer 5 (p): "colour" isn’t right');
  });
});
