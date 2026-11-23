import { describe, expect, it } from 'vitest';
import {
  INVITE_OFFER_DAYS,
  INVITE_OFFER_MONTHS,
  INVITE_OFFER_PERCENT_OFF,
  inviteOfferText,
  invitePageOfferText,
  offerCovers,
  offerMonthlyPrice,
  yearlyInviteSaving,
} from '@/utils/plans/inviteOffer';
import * as server from '../../../../../server/src/utils/inviteOffer.js';

describe('the invite offer’s numbers', () => {
  it('are the server’s', () => {
    expect(INVITE_OFFER_DAYS).toBe(server.INVITE_OFFER_DAYS);
    expect(INVITE_OFFER_MONTHS).toBe(server.INVITE_OFFER_MONTHS);
    expect(INVITE_OFFER_PERCENT_OFF).toBe(server.INVITE_OFFER_PERCENT_OFF);
    for (const plan of ['REGULAR', 'PREMIUM']) expect(yearlyInviteSaving(plan)).toBe(server.yearlyInviteSaving(plan));
  });

  it('save three half-price months, in pence', () => {
    expect(yearlyInviteSaving('REGULAR')).toBe(749);
    expect(yearlyInviteSaving('PREMIUM')).toBe(1499);
    expect(offerMonthlyPrice('REGULAR')).toBe(249);
    expect(offerMonthlyPrice('PREMIUM')).toBe(499);
  });
});

describe('offerCovers', () => {
  it('covers the offer’s own plan and a lower paid one, never Economy', () => {
    const premium = { plan: 'PREMIUM' };
    expect(offerCovers(premium, 'PREMIUM')).toBe(true);
    expect(offerCovers(premium, 'REGULAR')).toBe(true);
    expect(offerCovers(premium, 'FREE')).toBe(false);
    expect(offerCovers({ plan: 'REGULAR' }, 'PREMIUM')).toBe(false);
    expect(offerCovers(null, 'REGULAR')).toBe(false);
  });
});

describe('the offer’s words', () => {
  it('tells the account page what the offer gives and until when', () => {
    expect(inviteOfferText({ plan: 'PREMIUM', endsAt: '2026-11-29T10:00:00Z' })).toBe(
      'A welcome offer from your invite: First Class or Business at half price for your first 3 months, or £14.99 off a year of First Class. Choose it by 29 Nov 2026.',
    );
    expect(inviteOfferText({ plan: 'REGULAR', endsAt: '2026-11-29' })).toBe(
      'A welcome offer from your invite: Business at half price for your first 3 months, or £7.49 off a year of Business. Choose it by 29 Nov 2026.',
    );
  });

  it('tells the invite page before signing up', () => {
    expect(invitePageOfferText({ plan: 'REGULAR', planName: 'Business' })).toBe(
      'Join within 7 days and get Business at half price for your first 3 months (or £7.49 off your first year).',
    );
  });
});
