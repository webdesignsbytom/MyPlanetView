import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { AuthContext } from '@/auth/AuthContext';
import { sendPageView, stopGA, trackAddress } from '@/utils/analytics/initGA';
import { authValue, signedIn } from './pages/renderPage';

// Every page is a stub naming itself and the state.from it was sent with, so the test checks
// App's route table and guards, not the pages
vi.mock('@/utils/navigation/lazyPages', async () => {
  const { createElement } = await import('react');
  const { useLocation } = await import('react-router-dom');
  const stub = (name) =>
    function StubPage() {
      const location = useLocation();
      return createElement('div', { 'data-page': name, 'data-from': location.state?.from ?? '' });
    };
  const names = [
    'AboutPage',
    'AdminDashboardPage',
    'ContactFormAdminPage',
    'AdminUsersPage',
    'AdminEventsPage',
    'AdminPromoCodesPage',
    'AdminOffersPage',
    'AdminThemesPage',
    'ContactPage',
    'PricingPage',
    'TermAndPoliciesPage',
    'AccountPage',
    'LoginPage',
    'RegisterPage',
    'VerifyEmailPage',
    'ForgettenPasswordPage',
    'ResetLostPasswordPage',
    'MaintenancePage',
    'Error404',
    'SelectLabPage',
    'MapPage',
    'TripPage',
    'WelcomePage',
    'SharedPage',
    'EmbedPage',
    'GuessPage',
    'InviteAcceptPage',
    'ChallengesPage',
    'ChallengePage',
    'ChallengeJoinPage',
    'GiftsPage',
    'ComparePage',
    'GiftPage',
    'ImportPage',
    'UnsubscribePage',
    'PassportPage',
    'CountriesIndexPage',
  ];
  return {
    ...Object.fromEntries(names.map((name) => [name, stub(name)])),
    COUNTRY_GUIDE_PAGES: [{ slug: 'france', path: '/countries/france', Page: stub('CountryPage:france') }],
    MONTH_GUIDE_PAGES: [{ slug: 'january', path: '/where-to-go/january', Page: stub('MonthPage:january') }],
  };
});
vi.mock('@/pages/home/HomePage', () => ({ default: () => <div data-page='HomePage' data-from='' /> }));
vi.mock('@/pages/faq/FaqPage', () => ({ default: () => <div data-page='FaqPage' data-from='' /> }));
vi.mock('@/components/utils/LoadingScreen', () => ({ default: () => <div data-loading-screen /> }));
vi.mock('@/components/utils/OfflineNotice', () => ({ default: () => null }));
vi.mock('@/utils/functions/scrollToTop', () => ({ default: () => {} }));
vi.mock('@/hooks/FocusMainOnRouteChange', () => ({ default: () => {} }));
vi.mock('@/hooks/useRememberPromoCode', () => ({ default: () => {} }));
vi.mock('@/utils/analytics/initGA', () => ({ initGA: vi.fn(), sendPageView: vi.fn(), stopGA: vi.fn(), trackAddress: vi.fn() }));
// A "no" from an earlier visit: no cookie pop-up is ever opened
vi.mock('@/utils/analytics/consent', () => ({ readConsent: () => 'denied', onCookieSettings: () => () => {} }));

const visit = (at, auth = authValue()) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[at]}>
        <App />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const shown = () => {
  const page = document.querySelector('[data-page]');
  return page ? { page: page.getAttribute('data-page'), from: page.getAttribute('data-from') } : null;
};

const PUBLIC = [
  ['/', 'HomePage'],
  ['/about', 'AboutPage'],
  ['/faq', 'FaqPage'],
  ['/pricing', 'PricingPage'],
  ['/contact', 'ContactPage'],
  ['/countries', 'CountriesIndexPage'],
  ['/countries/france', 'CountryPage:france'],
  ['/where-to-go/january', 'MonthPage:january'],
  ['/user-agreements', 'TermAndPoliciesPage'],
  ['/down-for-maintenance', 'MaintenancePage'],
  ['/login', 'LoginPage'],
  ['/sign-up', 'RegisterPage'],
  ['/verify-email-address/user-1/abc', 'VerifyEmailPage'],
  ['/forgot-password', 'ForgettenPasswordPage'],
  ['/reset-password/user-1/tok', 'ResetLostPasswordPage'],
  ['/shared/ABCD-EFGH-JKMN', 'SharedPage'],
  ['/embed/ABCD-EFGH-JKMN', 'EmbedPage'],
  ['/guess/ABCD-EFGH-JKMN', 'GuessPage'],
  ['/shared/ABCD-EFGH-JKMN/passport', 'PassportPage'],
  ['/invite/tok-1', 'InviteAcceptPage'],
  ['/challenges/join/CHA2-YR5R-DTRP', 'ChallengeJoinPage'],
  ['/gift/AAAA-BBBB-CCCC', 'GiftPage'],
  ['/unsubscribe?u=1&t=2', 'UnsubscribePage'],
  ['/dev/select-lab', 'SelectLabPage'],
  ['/no-such-page', 'Error404'],
  ['/countries/atlantis', 'Error404'],
];

const SIGNED_IN = [
  ['/map', 'MapPage'],
  ['/maps/map-1', 'MapPage'],
  ['/maps/map-1/passport', 'PassportPage'],
  ['/trips/trip-1', 'TripPage'],
  ['/welcome', 'WelcomePage'],
  ['/challenges', 'ChallengesPage'],
  ['/challenges/ch-1', 'ChallengePage'],
  ['/gifts', 'GiftsPage'],
  ['/compare?a=map-1&b=map-2', 'ComparePage'],
  ['/import?map=map-1', 'ImportPage'],
  ['/account', 'AccountPage'],
];

const ADMIN = [
  ['/admin', 'AdminDashboardPage'],
  ['/admin/contact-forms', 'ContactFormAdminPage'],
  ['/admin/users', 'AdminUsersPage'],
  ['/admin/promo-codes', 'AdminPromoCodesPage'],
  ['/admin/offers', 'AdminOffersPage'],
  ['/admin/themes', 'AdminThemesPage'],
];

describe('App: the route table', () => {
  it.each(PUBLIC)('%s opens %s for anyone', (at, page) => {
    visit(at);
    expect(shown()).toEqual({ page, from: '' });
  });

  it.each(SIGNED_IN)('%s opens %s when signed in', (at, page) => {
    visit(at, signedIn());
    expect(shown().page).toBe(page);
  });

  it.each(SIGNED_IN)('%s sends a signed-out visitor to sign in with state.from', (at) => {
    visit(at);
    expect(shown()).toEqual({ page: 'LoginPage', from: at });
  });

  it.each(ADMIN)('%s opens %s for an admin and a developer', (at, page) => {
    const admin = visit(at, signedIn({ role: 'ADMIN' }));
    expect(shown().page).toBe(page);
    admin.unmount();
    visit(at, signedIn({ role: 'DEVELOPER' }));
    expect(shown().page).toBe(page);
  });

  it.each(ADMIN)('%s sends an ordinary user home and a signed-out one to sign in', (at) => {
    const first = visit(at, signedIn({ role: 'USER' }));
    expect(shown()).toEqual({ page: 'HomePage', from: '' });
    first.unmount();
    visit(at);
    expect(shown()).toEqual({ page: 'LoginPage', from: at });
  });

  it('opens the events page for developers only', () => {
    const developer = visit('/admin/events', signedIn({ role: 'DEVELOPER' }));
    expect(shown().page).toBe('AdminEventsPage');
    developer.unmount();
    const admin = visit('/admin/events', signedIn({ role: 'ADMIN' }));
    expect(shown().page).toBe('HomePage');
    admin.unmount();
    visit('/admin/events');
    expect(shown()).toEqual({ page: 'LoginPage', from: '/admin/events' });
  });

  it('shows the guard’s spinner, no page, while the session is being read', () => {
    visit('/map', authValue({ loading: true }));
    expect(shown()).toBeNull();
    expect(document.querySelector('[role="status"]')).toBeTruthy();
  });
});

describe('App: analytics', () => {
  it('stops GA after a "no", and tracks each address with a page view', async () => {
    visit('/about');
    await waitFor(() => expect(stopGA).toHaveBeenCalled());
    expect(trackAddress).toHaveBeenCalled();
    expect(sendPageView).toHaveBeenCalled();
  });
});
