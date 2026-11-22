import { describe, expect, it } from 'vitest';
import { chooseOffer, chooseOffers, mostCommonCountry, offerGroups, offersForPlacement, pickByWeight, slotHash } from '@/utils/offers/chooseOffer';

const offer = (id, extra = {}) => ({ id, kind: 'HOTEL', placements: ['GALLERY', 'TRAVEL_DESK'], countryCode: null, weight: 1, ...extra });

describe('offersForPlacement', () => {
  it('keeps only the offers that may go in the placement', () => {
    const offers = [offer('a'), offer('b', { placements: ['SLIDESHOW'] }), offer('c', { placements: null })];
    expect(offersForPlacement(offers, 'GALLERY').map((o) => o.id)).toEqual(['a']);
    expect(offersForPlacement(offers, 'SLIDESHOW').map((o) => o.id)).toEqual(['b']);
  });

  it('takes no list as empty', () => {
    expect(offersForPlacement(undefined, 'GALLERY')).toEqual([]);
  });
});

describe('slotHash', () => {
  it('gives the same unsigned 32-bit number for the same text', () => {
    const value = slotHash('trip:1#0');
    expect(slotHash('trip:1#0')).toBe(value);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(2 ** 32);
  });

  it('lands keys that differ by one character far apart', () => {
    expect(slotHash('trip:1#0')).not.toBe(slotHash('trip:1#1'));
    expect(slotHash('a')).not.toBe(slotHash('b'));
  });

  it('reads numbers as their text', () => {
    expect(slotHash(12)).toBe(slotHash('12'));
  });
});

describe('pickByWeight', () => {
  it('gives null for nothing', () => {
    expect(pickByWeight([], 'x')).toBeNull();
    expect(pickByWeight(null, 'x')).toBeNull();
  });

  it('picks the same offer for the same seed, whatever order the list comes in', () => {
    const list = [offer('a'), offer('b'), offer('c'), offer('d')];
    const reversed = [...list].reverse();
    for (const seed of ['one', 'two', 'three', 'four', 'five']) {
      expect(pickByWeight(list, seed).id).toBe(pickByWeight(reversed, seed).id);
    }
  });

  it('picks a heavier offer more often, in proportion to its weight', () => {
    const list = [offer('light', { weight: 1 }), offer('heavy', { weight: 3 })];
    const counts = { light: 0, heavy: 0 };
    for (let i = 0; i < 4000; i++) counts[pickByWeight(list, `slot-${i}`).id] += 1;
    const ratio = counts.heavy / counts.light;
    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(3.5);
  });

  it('counts a missing, broken or too-small weight as 1', () => {
    const list = [offer('a', { weight: 0 }), offer('b', { weight: 'lots' }), offer('c', { weight: -4 }), offer('d', { weight: undefined })];
    const seen = new Set();
    for (let i = 0; i < 400; i++) seen.add(pickByWeight(list, `s${i}`).id);
    expect([...seen].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('offerGroups', () => {
  const offers = [
    offer('jp', { countryCode: 'JP' }),
    offer('fr', { countryCode: 'FR' }),
    offer('it', { countryCode: 'IT' }),
    offer('gb', { countryCode: 'GB' }),
    offer('id', { countryCode: 'ID' }),
    offer('esim', { kind: 'ESIM' }),
    offer('slideshow-only', { placements: ['SLIDESHOW'] }),
  ];

  it('lists the trip, the country, the photos around and the general offers, best first', () => {
    const groups = offerGroups(offers, { placement: 'GALLERY', tripCountry: 'JP', country: 'FR', aroundCountry: 'IT' });
    expect(groups.map((g) => [g.source, g.countryCode, g.offers.map((o) => o.id)])).toEqual([
      ['trip', 'JP', ['jp']],
      ['country', 'FR', ['fr']],
      ['around', 'IT', ['it']],
      ['general', null, ['esim']],
    ]);
  });

  it('leaves out a group with no offers', () => {
    const groups = offerGroups(offers, { placement: 'GALLERY', country: 'BR' });
    expect(groups.map((g) => g.source)).toEqual(['general']);
  });

  it('gives a UK nation the UK’s offers and a region its country’s', () => {
    expect(offerGroups(offers, { placement: 'GALLERY', country: 'XC' })[0]).toMatchObject({ source: 'country', countryCode: 'XC' });
    expect(offerGroups(offers, { placement: 'GALLERY', country: 'XC' })[0].offers.map((o) => o.id)).toEqual(['gb']);
    expect(offerGroups(offers, { placement: 'GALLERY', tripCountry: 'XB' })[0].offers.map((o) => o.id)).toEqual(['id']);
  });

  it('takes only the placement’s offers', () => {
    expect(offerGroups(offers, { placement: 'SLIDESHOW' })).toEqual([{ source: 'general', countryCode: null, offers: [offers[6]] }]);
  });
});

describe('chooseOffer', () => {
  const offers = [
    offer('fr-hotel', { countryCode: 'FR' }),
    offer('fr-tour', { countryCode: 'FR', kind: 'TOUR' }),
    offer('esim', { kind: 'ESIM' }),
  ];

  it('chooses from the best group and says which it was', () => {
    const choice = chooseOffer(offers, { placement: 'GALLERY', country: 'FR' }, 'map:1#0');
    expect(['fr-hotel', 'fr-tour']).toContain(choice.offer.id);
    expect(choice).toMatchObject({ source: 'country', countryCode: 'FR' });
  });

  it('gives the same card for the same slot every time', () => {
    const context = { placement: 'GALLERY', country: 'FR' };
    const first = chooseOffer(offers, context, 'map:1#4').offer.id;
    for (let i = 0; i < 5; i++) expect(chooseOffer(offers, context, 'map:1#4').offer.id).toBe(first);
  });

  it('falls through to the next group when the offers beside it used them all', () => {
    const choice = chooseOffer(offers, { placement: 'GALLERY', country: 'FR' }, 'slot', { avoidIds: ['fr-hotel', 'fr-tour'] });
    expect(choice).toEqual({ offer: offers[2], source: 'general', countryCode: null });
  });

  it('prefers a kind not shown already, when the group has one', () => {
    for (let i = 0; i < 20; i++) {
      const choice = chooseOffer(offers, { placement: 'GALLERY', country: 'FR' }, `slot${i}`, { otherKindsThan: ['HOTEL'] });
      expect(choice.offer.id).toBe('fr-tour');
    }
  });

  it('still chooses a shown kind when the group has nothing else', () => {
    const choice = chooseOffer([offers[0]], { placement: 'GALLERY', country: 'FR' }, 'slot', { otherKindsThan: ['HOTEL'] });
    expect(choice.offer.id).toBe('fr-hotel');
  });

  it('gives null when nothing fits', () => {
    expect(chooseOffer(offers, { placement: 'PRINT' }, 'slot')).toBeNull();
    expect(chooseOffer([], { placement: 'GALLERY' }, 'slot')).toBeNull();
  });
});

describe('chooseOffers', () => {
  const offers = [
    offer('fr-hotel', { countryCode: 'FR', placements: ['COUNTRY_PAGE'] }),
    offer('fr-hotel-2', { countryCode: 'FR', placements: ['COUNTRY_PAGE'] }),
    offer('fr-tour', { countryCode: 'FR', kind: 'TOUR', placements: ['COUNTRY_PAGE'] }),
  ];

  it('chooses different offers for slots side by side, of another kind where it can', () => {
    const chosen = chooseOffers(offers, { placement: 'COUNTRY_PAGE', country: 'FR' }, 'guide:FR', 2);
    expect(chosen).toHaveLength(2);
    expect(new Set(chosen.map((c) => c.offer.id)).size).toBe(2);
    expect(new Set(chosen.map((c) => c.offer.kind))).toEqual(new Set(['HOTEL', 'TOUR']));
  });

  it('stops when there are no more offers to choose', () => {
    expect(chooseOffers(offers, { placement: 'COUNTRY_PAGE', country: 'FR' }, 'guide:FR', 5)).toHaveLength(3);
    expect(chooseOffers(offers, { placement: 'GALLERY' }, 'x', 2)).toEqual([]);
  });
});

describe('mostCommonCountry', () => {
  it('gives the country most of the photos are in', () => {
    expect(mostCommonCountry([{ countryCode: 'FR' }, { countryCode: 'IT' }, { countryCode: 'IT' }])).toBe('IT');
  });

  it('gives a tie to the country nearer the slot (listed first)', () => {
    expect(mostCommonCountry([{ countryCode: 'ES' }, { countryCode: 'PT' }, { countryCode: 'PT' }, { countryCode: 'ES' }])).toBe('ES');
  });

  it('ignores photos with no country, and gives null for none', () => {
    expect(mostCommonCountry([{ countryCode: null }, null, {}])).toBeNull();
    expect(mostCommonCountry(undefined)).toBeNull();
    expect(mostCommonCountry([{}, { countryCode: 'JP' }])).toBe('JP');
  });
});
