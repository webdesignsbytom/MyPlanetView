import { beforeEach, describe, expect, it } from 'vitest';
import { OFFER_MESSAGES, adEveryFor, adsFor, clickContext, liveOffersView, offerClick } from '@/dev/mock/offers';
import { exampleOfferId } from '@/dev/mock/seed';
import { offerIsLive } from '@/utils/offers/offerRules';
import { HOME_MAP, SAM_MAP, db, freshStore, signOut } from './mockApi';

beforeEach(() => freshStore());

const offer = (index) => db().offers.find((o) => o.id === exampleOfferId(index));

describe('adEveryFor', () => {
  it('shows a paying viewer no cards', () => {
    expect(adEveryFor({ ownerPlan: 'FREE', viewerPlan: 'REGULAR' })).toBeNull();
    expect(adEveryFor({ ownerPlan: 'FREE', viewerPlan: 'PREMIUM' })).toBeNull();
  });

  it('shows anyone else the owner’s plan’s rate: Economy 12, Business 24, First Class none', () => {
    expect(adEveryFor({ ownerPlan: 'FREE', viewerPlan: 'FREE' })).toBe(12);
    expect(adEveryFor({ ownerPlan: 'REGULAR', viewerPlan: 'FREE' })).toBe(24);
    expect(adEveryFor({ ownerPlan: 'PREMIUM', viewerPlan: 'FREE' })).toBeNull();
  });
});

describe('adsFor', () => {
  it('gives the test user (Business) none, and someone signed out the owner’s rate', () => {
    const home = db().maps.find((m) => m.id === HOME_MAP);
    const sams = db().maps.find((m) => m.id === SAM_MAP);
    expect(adsFor(home)).toEqual({ every: null });
    signOut();
    expect(adsFor(home)).toEqual({ every: 24 });
    expect(adsFor(sams)).toEqual({ every: 12 });
    expect(adsFor(null)).toEqual({ every: 12 });
  });
});

describe('liveOffersView', () => {
  it('lists the live offers by country (none last), then key, without links or keys', () => {
    const list = liveOffersView();
    expect(list.map((o) => o.id).sort()).toEqual(db().offers.filter((o) => offerIsLive(o, new Date())).map((o) => o.id).sort());
    expect(list.length).toBeGreaterThan(20);
    expect(Object.keys(list[0]).sort()).toEqual(['blurb', 'countryCode', 'id', 'imageKey', 'kind', 'partner', 'placements', 'title', 'weight']);
    const codes = list.map((o) => o.countryCode);
    const firstGeneral = codes.indexOf(null);
    expect(codes.slice(firstGeneral).every((c) => c === null)).toBe(true);
    expect(codes.slice(0, firstGeneral)).toEqual([...codes.slice(0, firstGeneral)].sort());
  });

  it('leaves out an offer turned off, not started or ended', () => {
    const all = liveOffersView().length;
    offer(0).active = false;
    offer(1).startsAt = new Date(Date.now() + 86400000).toISOString();
    offer(2).endsAt = new Date(Date.now() - 86400000).toISOString();
    expect(liveOffersView()).toHaveLength(all - 3);
  });
});

describe('clickContext', () => {
  it('takes a cleaned destination, a country code and dates in order', () => {
    expect(clickContext({ dest: '  <b>Seville</b> ', country: 'ES', from: '2027-04-01', to: '2027-04-05' })).toEqual({
      destination: 'Seville',
      country: 'ES',
      checkin: '2027-04-01',
      checkout: '2027-04-05',
    });
  });

  it('leaves out what doesn’t fit, never refusing', () => {
    expect(clickContext({ dest: '', country: 'es', from: '2027-02-30', to: 'soon' })).toEqual({});
    expect(clickContext({ from: '2027-04-05', to: '2027-04-01' })).toEqual({ checkin: '2027-04-05' });
    expect(clickContext({ to: '2027-04-01' })).toEqual({ checkout: '2027-04-01' });
    expect(clickContext({ dest: 'x'.repeat(200) }).destination).toHaveLength(80);
    expect(clickContext()).toEqual({});
  });
});

describe('offerClick', () => {
  it('counts the click in today’s tally for its placement and fills in the link', () => {
    const now = new Date('2026-11-23T10:00:00Z');
    const answer = offerClick(exampleOfferId(0), { p: 'GALLERY', country: 'ES', dest: 'Seville' }, now);
    expect(answer.status).toBe(302);
    expect(answer.location).toContain('country=ES');
    expect(answer.location).toContain('q=Seville');
    offerClick(exampleOfferId(0), { p: 'GALLERY' }, now);
    const row = db().offerClicks.find((r) => r.offerId === exampleOfferId(0) && r.day === '2026-11-23' && r.placement === 'GALLERY');
    expect(row.count).toBe(2);
  });

  it('follows a click with no known placement without counting it', () => {
    const before = JSON.stringify(db().offerClicks);
    expect(offerClick(exampleOfferId(0), { p: 'BILLBOARD' }).status).toBe(302);
    expect(offerClick(exampleOfferId(0)).status).toBe(302);
    expect(JSON.stringify(db().offerClicks)).toBe(before);
  });

  it('answers 404 for an unknown offer, or one no longer live', () => {
    expect(offerClick('nope')).toEqual({ status: 404, message: OFFER_MESSAGES.notFound });
    offer(0).active = false;
    expect(offerClick(exampleOfferId(0), { p: 'GALLERY' })).toEqual({ status: 404, message: OFFER_MESSAGES.ended });
  });
});
