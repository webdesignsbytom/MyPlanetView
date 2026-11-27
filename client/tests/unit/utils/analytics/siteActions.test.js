import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from '@/utils/analytics/initGA';
import {
  ANALYTICS_EVENTS,
  trackCheckoutPaid,
  trackCheckoutStarted,
  trackCountriesMarked,
  trackPhotosUploaded,
  trackShare,
  trackSignUp,
} from '@/utils/analytics/siteActions';

vi.mock('@/utils/analytics/initGA', () => ({ trackEvent: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

// The things analytics counts (the audit, 26 Nov 2026): GA4's names, nothing about who or where
describe('analytics events', () => {
  it('uses GA4’s own names where one fits', () => {
    expect(ANALYTICS_EVENTS).toEqual({
      signUp: 'sign_up',
      markCountry: 'mark_country',
      uploadPhotos: 'upload_photos',
      share: 'share',
      beginCheckout: 'begin_checkout',
      purchase: 'purchase',
    });
  });

  it('counts sign-ups, countries marked, uploads and shares, with no ids or places', () => {
    trackSignUp();
    expect(trackEvent).toHaveBeenLastCalledWith('sign_up', { method: 'email' });
    trackCountriesMarked({ status: 'LIVED' });
    expect(trackEvent).toHaveBeenLastCalledWith('mark_country', { status: 'lived', count: 1, method: 'one' });
    trackCountriesMarked({ status: 'VISITED', count: 14, method: 'quick_fill' });
    expect(trackEvent).toHaveBeenLastCalledWith('mark_country', { status: 'visited', count: 14, method: 'quick_fill' });
    trackPhotosUploaded(6);
    expect(trackEvent).toHaveBeenLastCalledWith('upload_photos', { count: 6 });
    trackShare({ method: 'invite', contentType: 'trip' });
    expect(trackEvent).toHaveBeenLastCalledWith('share', { method: 'invite', content_type: 'trip' });
  });

  it('a checkout started, then its purchase once on the way back', () => {
    trackCheckoutStarted({ item: 'plan', plan: 'PREMIUM', interval: 'YEAR', pence: 9900 });
    expect(trackEvent).toHaveBeenLastCalledWith('begin_checkout', { currency: 'GBP', value: 99, item: 'plan', plan: 'First Class', interval: 'YEAR' });
    trackCheckoutPaid('gift');
    // Another item's return: nothing, and the plan's is forgotten too
    expect(trackEvent).toHaveBeenCalledTimes(1);

    trackCheckoutStarted({ item: 'gift', plan: 'REGULAR', interval: 'YEAR', pence: 4900 });
    trackCheckoutPaid('gift');
    expect(trackEvent).toHaveBeenLastCalledWith('purchase', { currency: 'GBP', value: 49, item: 'gift', plan: 'Business', interval: 'YEAR' });
    trackCheckoutPaid('gift');
    expect(trackEvent).toHaveBeenCalledTimes(3);
  });

  it('a return with nothing started sends nothing', () => {
    trackCheckoutPaid('plan');
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
