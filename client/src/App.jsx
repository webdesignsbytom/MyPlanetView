import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
// Components
import LoadingScreen from './components/utils/LoadingScreen';
// Hooks
import useScrollToTopOnRouteChange from './utils/functions/scrollToTop';
import useFocusMainOnRouteChange from './hooks/FocusMainOnRouteChange';
import OfflineNotice from './components/utils/OfflineNotice';
import useRememberPromoCode from './hooks/useRememberPromoCode';
// Constants
import {
  ABOUT_PAGE_URL,
  ACCOUNT_PAGE_URL,
  ADMIN_PAGE_URL,
  ADMIN_CONTACT_FORM_PAGE_URL,
  ADMIN_EVENTS_PAGE_URL,
  ADMIN_PROMO_CODES_PAGE_URL,
  ADMIN_OFFERS_PAGE_URL,
  ADMIN_THEMES_PAGE_URL,
  ADMIN_USERS_PAGE_URL,
  CONTACT_PAGE_URL,
  COUNTRIES_PAGE_URL,
  FAQ_PAGE_URL,
  PRICING_PAGE_URL,
  FORGOT_PASS_PAGE_URL,
  HOME_PAGE_URL,
  LEGAL_AGREEMENTS_PAGE_URL,
  LOGIN_PAGE_URL,
  MAINTENANCE_PAGE_URL,
  RESET_PASS_PAGE_URL,
  SIGN_UP_PAGE_URL,
  VERIFY_EMAIL_PAGE_URL,
  DEV_SELECT_LAB_PAGE_URL,
  MAP_PAGE_URL,
  MAP_BY_ID_PAGE_URL,
  TRIP_PAGE_URL,
  WELCOME_PAGE_URL,
  SHARED_PAGE_URL,
  EMBED_PAGE_URL,
  GUESS_PAGE_URL,
  isEmbedPath,
  INVITE_PAGE_URL,
  CHALLENGES_PAGE_URL,
  CHALLENGE_PAGE_URL,
  CHALLENGE_JOIN_PAGE_URL,
  GIFTS_PAGE_URL,
  COMPARE_PAGE_URL,
  GIFT_PAGE_URL,
  IMPORT_PAGE_URL,
  UNSUBSCRIBE_PAGE_URL,
  MAP_PASSPORT_PAGE_URL,
  SHARED_PASSPORT_PAGE_URL,
} from '@/utils/constants/routes';
import { COOKIE_CONSENT_STYLE, COOKIE_TIMER } from './utils/constants/constants';
// Analytics
import { initGA, sendPageView, stopGA, trackAddress } from './utils/analytics/initGA';
import { onCookieSettings, readConsent } from './utils/analytics/consent';
import { isAnalyticsExcluded } from './utils/analytics/privacy';
// Guards
import {
  AuthenticateAdmin,
  AuthenticateDeveloper,
  AuthenticateUser,
} from './utils/user/AuthenticateUser';
// Eager pages (entry/critical)
import HomePage from './pages/home/HomePage';
import FaqPage from './pages/faq/FaqPage';
// Lazy pages (listed once in lazyPages.js)
import {
  AboutPage,
  AdminDashboardPage,
  ContactFormAdminPage,
  AdminUsersPage,
  AdminEventsPage,
  AdminPromoCodesPage,
  AdminOffersPage,
  AdminThemesPage,
  ContactPage,
  PricingPage,
  TermAndPoliciesPage,
  AccountPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgettenPasswordPage,
  ResetLostPasswordPage,
  MaintenancePage,
  Error404,
  SelectLabPage,
  MapPage,
  TripPage,
  WelcomePage,
  SharedPage,
  EmbedPage,
  GuessPage,
  InviteAcceptPage,
  ChallengesPage,
  ChallengePage,
  ChallengeJoinPage,
  GiftsPage,
  ComparePage,
  GiftPage,
  ImportPage,
  UnsubscribePage,
  PassportPage,
  CountriesIndexPage,
  COUNTRY_GUIDE_PAGES,
  MONTH_GUIDE_PAGES,
} from './utils/navigation/lazyPages';

// Build-time pre-render: no cookie modal, no analytics
const IS_PRERENDER = Boolean(window.__PRERENDER__);

const GA_ID = import.meta.env.VITE_ANALYTICS_ID;

// Cookie pop-ups by COOKIE_CONSENT_STYLE; only the chosen one is downloaded
const COOKIE_POPUPS = {
  banner: () => import('./components/modals/CookieConsentBanner'),
  notice: () => import('./components/modals/CookieConsentBanner'),
  modal: () => import('./components/modals/CookieConsentModal'),
};

function App() {
  const [consent, setConsent] = useState(readConsent);
  // The cookie pop-up showing: { Cmp, fromSettings } (none on the first render, so the
  // pre-rendered pages hydrate)
  const [cookiePopup, setCookiePopup] = useState(null);
  const settingsOpener = useRef(null);
  const location = useLocation();

  useScrollToTopOnRouteChange();
  useFocusMainOnRouteChange();
  // A creator's ?code= link, kept for the visit until they sign up (in an effect)
  useRememberPromoCode();

  // A map framed on someone's website (/embed/:code) never shows our cookie pop-up: it's
  // their page, and nothing there sets a cookie or loads analytics
  const embedded = isEmbedPath(location.pathname);

  // Lazy-import the cookie pop-up after the timer, until they've chosen
  useEffect(() => {
    if (consent !== null || IS_PRERENDER || embedded) return undefined;
    const t = setTimeout(async () => {
      const m = await (COOKIE_POPUPS[COOKIE_CONSENT_STYLE] || COOKIE_POPUPS.banner)();
      setCookiePopup((open) => open || { Cmp: m.default, fromSettings: false });
    }, COOKIE_TIMER);
    return () => clearTimeout(t);
  }, [consent, embedded]);

  // The footer's Cookie settings: the banner at once, showing the current choice, so a yes
  // can be withdrawn (the 'modal' style's "I Disagree" leaves the site, so it's always the banner)
  useEffect(
    () =>
      onCookieSettings(async () => {
        settingsOpener.current = document.activeElement;
        const m = await COOKIE_POPUPS.banner();
        setCookiePopup({ Cmp: m.default, fromSettings: true });
      }),
    [],
  );

  const closeCookiePopup = () => {
    const opener = cookiePopup?.fromSettings ? settingsOpener.current : null;
    setCookiePopup(null);
    if (opener?.isConnected) requestAnimationFrame(() => opener.focus());
  };
  const chooseCookies = (choice) => {
    setConsent(choice);
    closeCookiePopup();
  };

  // A no, or a yes withdrawn: GA stops sending and its cookies are deleted (initGA.js)
  useEffect(() => {
    if (consent === 'denied' && !IS_PRERENDER) stopGA(GA_ID);
  }, [consent]);

  // Every address change: GA paused on a page with a secret in its address (share, invite,
  // reset and verify links) and resumed after; then the page view, with the address
  // redacted to its route pattern (sent once GA has loaded; never for a secret page)
  useEffect(() => {
    if (IS_PRERENDER) return;
    trackAddress(GA_ID);
    sendPageView();
  }, [location.pathname, location.search]);

  // GA only after a yes, on idle, and never first loaded on a page with a secret address
  const excluded = isAnalyticsExcluded(location.pathname);
  useEffect(() => {
    if (consent !== 'granted' || IS_PRERENDER || excluded) return;
    const id = window.requestIdleCallback
      ? requestIdleCallback(() => initGA(GA_ID))
      : setTimeout(() => initGA(GA_ID), 0);
    return () =>
      window.cancelIdleCallback ? cancelIdleCallback(id) : clearTimeout(id);
  }, [consent, excluded]);

  return (
    <>
      <OfflineNotice />
      {cookiePopup && (
        <Suspense fallback={null}>
          <cookiePopup.Cmp
            onChoice={chooseCookies}
            current={consent}
            fromSettings={cookiePopup.fromSettings}
            onClose={closeCookiePopup}
          />
        </Suspense>
      )}

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path={HOME_PAGE_URL} element={<HomePage />} />
          <Route path={ABOUT_PAGE_URL} element={<AboutPage />} />
          <Route path={FAQ_PAGE_URL} element={<FaqPage />} />
          <Route path={PRICING_PAGE_URL} element={<PricingPage />} />
          <Route path={CONTACT_PAGE_URL} element={<ContactPage />} />

          {/* Country guides: built from the checked content files (drafts too in development).
              None checked: no index and no country routes, so those addresses are 404s */}
          {CountriesIndexPage ? <Route path={COUNTRIES_PAGE_URL} element={<CountriesIndexPage />} /> : null}
          {COUNTRY_GUIDE_PAGES.map((guide) => (
            <Route key={guide.slug} path={guide.path} element={<guide.Page />} />
          ))}
          {/* "Where to go in <month>": the checked month files with enough countries (drafts in development) */}
          {MONTH_GUIDE_PAGES.map((month) => (
            <Route key={month.slug} path={month.path} element={<month.Page />} />
          ))}

          <Route
            path={ADMIN_PAGE_URL}
            element={
              <AuthenticateAdmin>
                <AdminDashboardPage />
              </AuthenticateAdmin>
            }
          />
          <Route
            path={ADMIN_CONTACT_FORM_PAGE_URL}
            element={
              <AuthenticateAdmin>
                <ContactFormAdminPage />
              </AuthenticateAdmin>
            }
          />
          <Route
            path={ADMIN_USERS_PAGE_URL}
            element={
              <AuthenticateAdmin>
                <AdminUsersPage />
              </AuthenticateAdmin>
            }
          />
          <Route
            path={ADMIN_PROMO_CODES_PAGE_URL}
            element={
              <AuthenticateAdmin>
                <AdminPromoCodesPage />
              </AuthenticateAdmin>
            }
          />
          <Route
            path={ADMIN_OFFERS_PAGE_URL}
            element={
              <AuthenticateAdmin>
                <AdminOffersPage />
              </AuthenticateAdmin>
            }
          />
          <Route
            path={ADMIN_THEMES_PAGE_URL}
            element={
              <AuthenticateAdmin>
                <AdminThemesPage />
              </AuthenticateAdmin>
            }
          />
          <Route
            path={ADMIN_EVENTS_PAGE_URL}
            element={
              <AuthenticateDeveloper>
                <AdminEventsPage />
              </AuthenticateDeveloper>
            }
          />

          {/* The travel app */}
          <Route
            path={MAP_PAGE_URL}
            element={
              <AuthenticateUser>
                <MapPage />
              </AuthenticateUser>
            }
          />
          <Route
            path={MAP_BY_ID_PAGE_URL}
            element={
              <AuthenticateUser>
                <MapPage />
              </AuthenticateUser>
            }
          />
          <Route
            path={TRIP_PAGE_URL}
            element={
              <AuthenticateUser>
                <TripPage />
              </AuthenticateUser>
            }
          />
          <Route
            path={WELCOME_PAGE_URL}
            element={
              <AuthenticateUser>
                <WelcomePage />
              </AuthenticateUser>
            }
          />
          <Route
            path={MAP_PASSPORT_PAGE_URL}
            element={
              <AuthenticateUser>
                <PassportPage />
              </AuthenticateUser>
            }
          />
          <Route path={SHARED_PAGE_URL} element={<SharedPage />} />
          <Route path={EMBED_PAGE_URL} element={<EmbedPage />} />
          <Route path={GUESS_PAGE_URL} element={<GuessPage />} />
          <Route path={SHARED_PASSPORT_PAGE_URL} element={<PassportPage />} />
          <Route path={INVITE_PAGE_URL} element={<InviteAcceptPage />} />

          {/* Friends challenges: yours (signed in), and a challenge's join link (anyone) */}
          <Route
            path={CHALLENGES_PAGE_URL}
            element={
              <AuthenticateUser>
                <ChallengesPage />
              </AuthenticateUser>
            }
          />
          <Route path={CHALLENGE_JOIN_PAGE_URL} element={<ChallengeJoinPage />} />
          <Route
            path={CHALLENGE_PAGE_URL}
            element={
              <AuthenticateUser>
                <ChallengePage />
              </AuthenticateUser>
            }
          />

          {/* Gifts of a year of a plan: buying and yours (signed in), and a gift's page (anyone) */}
          <Route
            path={GIFTS_PAGE_URL}
            element={
              <AuthenticateUser>
                <GiftsPage />
              </AuthenticateUser>
            }
          />
          <Route path={GIFT_PAGE_URL} element={<GiftPage />} />

          {/* Comparing two maps the person can open (signed in) */}
          <Route
            path={COMPARE_PAGE_URL}
            element={
              <AuthenticateUser>
                <ComparePage />
              </AuthenticateUser>
            }
          />

          {/* An email's unsubscribe link (anyone) */}
          <Route path={UNSUBSCRIBE_PAGE_URL} element={<UnsubscribePage />} />

          {/* Bringing your travels from Polarsteps (signed in) */}
          <Route
            path={IMPORT_PAGE_URL}
            element={
              <AuthenticateUser>
                <ImportPage />
              </AuthenticateUser>
            }
          />

          {/* Users */}
          <Route
            path={ACCOUNT_PAGE_URL}
            element={
              <AuthenticateUser>
                <AccountPage />
              </AuthenticateUser>
            }
          />
          <Route path={LOGIN_PAGE_URL} element={<LoginPage />} />
          <Route path={SIGN_UP_PAGE_URL} element={<RegisterPage />} />
          <Route path={VERIFY_EMAIL_PAGE_URL} element={<VerifyEmailPage />} />
          <Route
            path={FORGOT_PASS_PAGE_URL}
            element={<ForgettenPasswordPage />}
          />
          <Route
            path={RESET_PASS_PAGE_URL}
            element={<ResetLostPasswordPage />}
          />

          {/* Terms and conditions */}
          <Route
            path={LEGAL_AGREEMENTS_PAGE_URL}
            element={<TermAndPoliciesPage />}
          />

          {/* Maintainance */}
          <Route path={MAINTENANCE_PAGE_URL} element={<MaintenancePage />} />

          {/* Dev server only */}
          {SelectLabPage ? <Route path={DEV_SELECT_LAB_PAGE_URL} element={<SelectLabPage />} /> : null}

          {/* Error */}
          <Route path='*' element={<Error404 />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
