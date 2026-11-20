import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adEveryFor,
  checkOfferUrl,
  clickContext,
  fillOfferUrl,
  offerIsLive,
  parseOfferInput,
} from '../src/utils/offers.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const known = new Set(COUNTRIES.map((c) => c.code));
const isKnownCountry = (code) => known.has(code);
const good = {
  key: 'example-stays-jp',
  partner: 'Example Stays',
  kind: 'HOTEL',
  title: 'Hotels in Japan',
  placements: ['GALLERY', 'TRAVEL_DESK'],
  url: 'https://www.example.com/stays?q={destination}&in={checkin}&out={checkout}',
};

describe('who sees offer cards', () => {
  it('follows the map owner’s plan, unless the viewer pays', () => {
    expect(adEveryFor({ ownerPlan: 'FREE', viewerPlan: 'FREE' })).toBe(12);
    expect(adEveryFor({ ownerPlan: 'REGULAR', viewerPlan: 'FREE' })).toBe(24);
    expect(adEveryFor({ ownerPlan: 'PREMIUM', viewerPlan: 'FREE' })).toBeNull();
    expect(adEveryFor({ ownerPlan: 'FREE', viewerPlan: 'REGULAR' })).toBeNull();
    expect(adEveryFor({ ownerPlan: 'FREE', viewerPlan: 'PREMIUM' })).toBeNull();
    // Unknown plans count as Economy
    expect(adEveryFor({ ownerPlan: undefined, viewerPlan: undefined })).toBe(12);
  });
});

describe('an offer', () => {
  it('takes https links with known placeholders only', () => {
    expect(checkOfferUrl(good.url)).toBe(good.url);
    expect(checkOfferUrl('https://example.com/{destination}/hotels')).not.toBeNull();
    // A placeholder in the host would make /go an open redirect
    for (const bad of ['https://www.partner.com{destination}', 'https://{destination}/hotels', 'https://{country}.partner.com/']) {
      expect(checkOfferUrl(bad), bad).toBeNull();
    }
    for (const bad of ['http://example.com', 'javascript:alert(1)', 'https://example.com/?a={user}', 'https://u:p@example.com', '', null]) {
      expect(checkOfferUrl(bad), String(bad)).toBeNull();
    }
  });

  it('is checked whole when new, and field by field when changed', () => {
    expect(parseOfferInput(good, { isKnownCountry })).toMatchObject({ ok: true, data: { key: 'example-stays-jp', kind: 'HOTEL' } });
    expect(parseOfferInput({ ...good, countryCode: 'JP', weight: 3, imageKey: 'visitCountryPosters/jp-800.avif' }, { isKnownCountry }).ok).toBe(true);
    const wrong = [
      [{ ...good, key: 'Has Spaces' }, 'key'],
      [{ ...good, partner: '' }, 'partner'],
      [{ ...good, kind: 'CASINO' }, 'kind'],
      [{ ...good, placements: [] }, 'placements'],
      [{ ...good, placements: ['POPUP'] }, 'placements'],
      [{ ...good, countryCode: 'ZZ' }, 'countryCode'],
      [{ ...good, imageKey: '../secret.png' }, 'imageKey'],
      [{ ...good, imageKey: 'images/logo.svg' }, 'imageKey'],
      [{ ...good, weight: 0 }, 'weight'],
      [{ ...good, startsAt: '2027-02-01T00:00:00Z', endsAt: '2027-01-01T00:00:00Z' }, 'endsAt'],
    ];
    for (const [offer, field] of wrong) expect(parseOfferInput(offer, { isKnownCountry }), field).toEqual({ ok: false, field });
    const existing = { ...good, startsAt: null, endsAt: null };
    expect(parseOfferInput({ active: false }, { existing, isKnownCountry })).toEqual({ ok: true, data: { active: false } });
    expect(parseOfferInput({ key: 'renamed' }, { existing, isKnownCountry })).toEqual({ ok: false, field: 'key' });
  });

  it('is live while active and inside its dates', () => {
    const now = new Date('2027-06-01T00:00:00Z');
    expect(offerIsLive({ active: true }, now)).toBe(true);
    expect(offerIsLive({ active: false }, now)).toBe(false);
    expect(offerIsLive({ active: true, startsAt: '2027-07-01T00:00:00Z' }, now)).toBe(false);
    expect(offerIsLive({ active: true, endsAt: '2027-05-31T00:00:00Z' }, now)).toBe(false);
  });

  it('fills its link from what the card knew, encoded, and blanks the rest', () => {
    const context = clickContext({ dest: 'Kyoto & Osaka', country: 'JP', from: '2027-04-01', to: '2027-04-08' });
    expect(context).toEqual({ destination: 'Kyoto & Osaka', country: 'JP', checkin: '2027-04-01', checkout: '2027-04-08' });
    expect(fillOfferUrl(good.url, context)).toBe('https://www.example.com/stays?q=Kyoto%20%26%20Osaka&in=2027-04-01&out=2027-04-08');
    expect(fillOfferUrl(good.url, {})).toBe('https://www.example.com/stays?q=&in=&out=');
    // Nonsense is left out, never refused
    expect(clickContext({ dest: '<b></b>', country: 'japan', from: '2027-13-01', to: '2027-03-01' })).toEqual({ checkout: '2027-03-01' });
    expect(clickContext({ from: '2027-04-08', to: '2027-04-01' })).toEqual({ checkin: '2027-04-08' });
  });
});

describe('the example offers file', () => {
  const file = JSON.parse(fs.readFileSync(path.join(here, '../prisma/seed/data/offers.example.json'), 'utf8'));

  it('is valid, with unique keys, fictional partners and example.com links', () => {
    const keys = new Set();
    for (const offer of file.offers) {
      expect(parseOfferInput(offer, { isKnownCountry }), offer.key).toMatchObject({ ok: true });
      expect(keys.has(offer.key), offer.key).toBe(false);
      keys.add(offer.key);
      expect(offer.key).toMatch(/^example-/);
      expect(offer.partner).toMatch(/^Example /);
      expect(new URL(offer.url.replace(/\{[a-z]+\}/g, 'x')).hostname).toBe('www.example.com');
    }
  });

  it('only uses pictures that exist in the media folder', () => {
    for (const offer of file.offers.filter((o) => o.imageKey)) {
      expect(fs.existsSync(path.join(here, '../../media', offer.imageKey)), offer.imageKey).toBe(true);
    }
  });
});
