import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
// Components
import LoadingScreen from './components/utils/LoadingScreen';
// Hooks
import useScrollToTopOnRouteChange from './utils/functions/scrollToTop';
import useFocusMainOnRouteChange from './hooks/FocusMainOnRouteChange';
// Constants
import {
  ABOUT_PAGE_URL,
  ACCOUNT_PAGE_URL,
  ADMIN_PAGE_URL,
  ADMIN_CONTACT_FORM_PAGE_URL,
  ADMIN_EVENTS_PAGE_URL,
  ADMIN_USERS_PAGE_URL,
  CONTACT_PAGE_URL,
  FAQ_PAGE_URL,
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
  INVITE_PAGE_URL,
  ANALYTICS_EXCLUDED_PREFIXES,
} from '@/utils/constants/routes';
import { COOKIE_CONSENT_STYLE, COOKIE_TIMER } from './utils/constants/constants';
// Analytics
import { initGA, sendPageView } from './utils/analytics/initGA';
import { readConsent } from './utils/analytics/consent';
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
  ContactPage,
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
  InviteAcceptPage,
} from './utils/navigation/lazyPages';

// Build-time pre-render: no cookie modal, no analytics
const IS_PRERENDER = Boolean(window.__PRERENDER__);

// Share links and invites carry a secret in the address: analytics never sees them
const isAnalyticsExcluded = (pathname) =>
  ANALYTICS_EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

// Cookie pop-ups by COOKIE_CONSENT_STYLE; only the chosen one is downloaded
const COOKIE_POPUPS = {
  banner: () => import('./components/modals/CookieConsentBanner'),
  notice: () => import('./components/modals/CookieConsentBanner'),
  modal: () => import('./components/modals/CookieConsentModal'),
};

function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [consent, setConsent] = useState(readConsent);
  const [CookieCmp, setCookieCmp] = useState(null);
  const location = useLocation();

  useScrollToTopOnRouteChange();
  useFocusMainOnRouteChange();

  // Lazy-import the cookie pop-up after the timer, until they've chosen
  useEffect(() => {
    if (consent !== null || IS_PRERENDER) {
      setIsVisible(false);
      return;
    }
    const t = setTimeout(async () => {
      const m = await (COOKIE_POPUPS[COOKIE_CONSENT_STYLE] || COOKIE_POPUPS.banner)();
      setCookieCmp(() => m.default);
      setIsVisible(true);
    }, COOKIE_TIMER);
    return () => clearTimeout(t);
  }, [consent]);

  // GA only after a yes, on idle, and never first loaded on a page with a secret address
  const excluded = isAnalyticsExcluded(location.pathname);
  useEffect(() => {
    if (consent !== 'granted' || IS_PRERENDER || excluded) return;
    const id = window.requestIdleCallback
      ? requestIdleCallback(() => initGA(import.meta.env.VITE_ANALYTICS_ID))
      : setTimeout(() => initGA(import.meta.env.VITE_ANALYTICS_ID), 0);
    return () =>
      window.cancelIdleCallback ? cancelIdleCallback(id) : clearTimeout(id);
  }, [consent, excluded]);

  // Route change pageviews (fires only if GA loaded; never for share or invite pages)
  useEffect(() => {
    if (isAnalyticsExcluded(location.pathname)) return;
    sendPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <>
      {isVisible && CookieCmp && (
        <Suspense fallback={null}>
          <CookieCmp onChoice={setConsent} />
        </Suspense>
      )}

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path={HOME_PAGE_URL} element={<HomePage />} />
          <Route path={ABOUT_PAGE_URL} element={<AboutPage />} />
          <Route path={FAQ_PAGE_URL} element={<FaqPage />} />
          <Route path={CONTACT_PAGE_URL} element={<ContactPage />} />
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
          <Route path={SHARED_PAGE_URL} element={<SharedPage />} />
          <Route path={INVITE_PAGE_URL} element={<InviteAcceptPage />} />

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
