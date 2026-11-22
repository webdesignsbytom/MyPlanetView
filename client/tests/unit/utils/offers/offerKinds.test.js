import { describe, expect, it } from 'vitest';
import {
  OFFER_KIND_ORDER,
  OFFER_KIND_WORDS,
  OFFER_SHELF_TITLES,
  PARTNER_OFFERS_NOTE,
  PRINT_OFFERS_NOTE,
  offerKindWord,
  offerLinkLabel,
} from '@/utils/offers/offerKinds';
import { OFFER_KINDS } from '@/utils/offers/offerRules';

describe('offer kinds’ words', () => {
  it('orders, titles and names every kind the rules know, and no other', () => {
    expect([...OFFER_KIND_ORDER].sort()).toEqual([...OFFER_KINDS].sort());
    expect(Object.keys(OFFER_SHELF_TITLES).sort()).toEqual([...OFFER_KINDS].sort());
    expect(Object.keys(OFFER_KIND_WORDS).sort()).toEqual([...OFFER_KINDS].sort());
  });

  it('puts the shelves in the order a trip is booked', () => {
    expect(OFFER_KIND_ORDER.slice(0, 3)).toEqual(['HOTEL', 'TOUR', 'FLIGHT']);
    expect(OFFER_SHELF_TITLES.HOTEL).toBe('Places to stay');
  });

  it('names a kind on a card’s stamp, and an unknown one as travel', () => {
    expect(offerKindWord('INSURANCE')).toBe('Cover');
    expect(offerKindWord('ESIM')).toBe('eSIM');
    expect(offerKindWord('SPACESHIP')).toBe('Travel');
    expect(offerKindWord(undefined)).toBe('Travel');
  });

  it('calls a card’s link an ad first, then where it goes', () => {
    expect(offerLinkLabel({ title: 'Hotels in Kyoto', partner: 'Example Stays' })).toBe(
      'Ad: Hotels in Kyoto. Visit Example Stays (opens in a new tab)',
    );
  });

  it('says partner offers may earn a commission', () => {
    expect(PARTNER_OFFERS_NOTE).toMatch(/commission if you book/);
    expect(PRINT_OFFERS_NOTE).toMatch(/commission if you order/);
  });
});
