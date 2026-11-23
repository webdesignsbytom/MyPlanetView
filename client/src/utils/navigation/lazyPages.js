import { createElement, lazy } from 'react';
// Constants
import {
  ABOUT_PAGE_URL,
  ACCOUNT_PAGE_URL,
  ADMIN_CONTACT_FORM_PAGE_URL,
  ADMIN_EVENTS_PAGE_URL,
  ADMIN_OFFERS_PAGE_URL,
  ADMIN_THEMES_PAGE_URL,
  CHALLENGES_PAGE_URL,
  GIFTS_PAGE_URL,
  COMPARE_PAGE_URL,
  IMPORT_PAGE_URL,
  ADMIN_PAGE_URL,
  ADMIN_PROMO_CODES_PAGE_URL,
  ADMIN_USERS_PAGE_URL,
  CONTACT_PAGE_URL,
  COUNTRIES_PAGE_URL,
  DEV_SELECT_LAB_PAGE_URL,
  FORGOT_PASS_PAGE_URL,
  LEGAL_AGREEMENTS_PAGE_URL,
  LOGIN_PAGE_URL,
  MAINTENANCE_PAGE_URL,
  PRICING_PAGE_URL,
  SIGN_UP_PAGE_URL,
  MAP_PAGE_URL,
  WELCOME_PAGE_URL,
  countryPagePath,
  monthPagePath,
} from '../constants/routes';
// Country guides
import { COUNTRY_PAGES, HAS_COUNTRY_PAGES, loadCountryIndex, loadCountryPage } from '../countries/countryPages';
import { HAS_MONTH_PAGES, MONTH_PAGES, loadMonthPage } from '../months/monthPages';

// lazy() that renders straight away once its code is loaded (no loading screen)
const lazyPage = (load) => {
  let loaded = null;
  const preload = () => load().then((module) => (loaded = module));
  const Page = lazy(() => (loaded ? { then: (resolve) => resolve(loaded) } : preload()));
  Page.preload = preload;
  return Page;
};

// Public pages
export const AboutPage = lazyPage(() => import('@/pages/about/AboutPage'));
export const ContactPage = lazyPage(() => import('@/pages/contact/ContactPage'));
export const PricingPage = lazyPage(() => import('@/pages/pricing/PricingPage'));
export const TermAndPoliciesPage = lazyPage(() => import('@/pages/policies/TermAndPoliciesPage'));
export const MaintenancePage = lazyPage(() => import('@/pages/maintenance/MaintenancePage'));
export const Error404 = lazyPage(() => import('@/pages/error/Error404'));
// Admin
export const AdminDashboardPage = lazyPage(() => import('@/pages/admin/AdminDashboardPage'));
export const ContactFormAdminPage = lazyPage(() => import('@/pages/contact/admin/ContactFormAdminPage'));
export const AdminUsersPage = lazyPage(() => import('@/pages/admin/AdminUsersPage'));
export const AdminEventsPage = lazyPage(() => import('@/pages/admin/AdminEventsPage'));
export const AdminPromoCodesPage = lazyPage(() => import('@/pages/admin/AdminPromoCodesPage'));
export const AdminOffersPage = lazyPage(() => import('@/pages/admin/AdminOffersPage'));
export const AdminThemesPage = lazyPage(() => import('@/pages/admin/AdminThemesPage'));
// Users
export const AccountPage = lazyPage(() => import('@/pages/account/AccountPage'));
export const LoginPage = lazyPage(() => import('@/users/login/LoginPage'));
export const RegisterPage = lazyPage(() => import('@/users/register/RegisterPage'));
export const VerifyEmailPage = lazyPage(() => import('@/users/verify/VerifyEmailPage'));
export const ForgettenPasswordPage = lazyPage(() => import('@/users/password/ForgettenPasswordPage'));
export const ResetLostPasswordPage = lazyPage(() => import('@/users/password/ResetLostPasswordPage'));
// The travel app (signed in, or a share link)
export const MapPage = lazyPage(() => import('@/pages/map/MapPage'));
export const TripPage = lazyPage(() => import('@/pages/trips/TripPage'));
export const WelcomePage = lazyPage(() => import('@/pages/onboarding/WelcomePage'));
export const SharedPage = lazyPage(() => import('@/pages/shared/SharedPage'));
// A map framed on someone's website (23 Nov 2026)
export const EmbedPage = lazyPage(() => import('@/pages/embed/EmbedPage'));
// A "Guess where I was" game (23 Nov 2026)
export const GuessPage = lazyPage(() => import('@/pages/guess/GuessPage'));
export const InviteAcceptPage = lazyPage(() => import('@/pages/invite/InviteAcceptPage'));
export const ChallengesPage = lazyPage(() => import('@/pages/challenges/ChallengesPage'));
export const ChallengePage = lazyPage(() => import('@/pages/challenges/ChallengePage'));
export const ChallengeJoinPage = lazyPage(() => import('@/pages/challenges/ChallengeJoinPage'));
// Gifts of a year of a plan (docs/API.md "Gifts")
export const GiftsPage = lazyPage(() => import('@/pages/gifts/GiftsPage'));
export const ComparePage = lazyPage(() => import('@/pages/compare/ComparePage'));
export const GiftPage = lazyPage(() => import('@/pages/gifts/GiftPage'));
// Bringing your travels from Polarsteps (docs/API.md "Importing from Polarsteps")
export const ImportPage = lazyPage(() => import('@/pages/import/ImportPage'));
// An email's unsubscribe link (docs/API.md "Emails")
export const UnsubscribePage = lazyPage(() => import('@/pages/unsubscribe/UnsubscribePage'));
// A map's passport (/maps/:mapId/passport, and /shared/:code/passport)
export const PassportPage = lazyPage(() => import('@/pages/passport/PassportPage'));
// Dev server only: null in production builds, so the page isn't bundled
export const SelectLabPage = import.meta.env.DEV ? lazyPage(() => import('@/pages/dev/SelectLabPage')) : null;

// Country guides (src/content/countries/): a page's code and its content load together, so
// its first render is complete, as the pre-render needs. One page per guide, from the
// checked files (drafts too on the dev server); with none, no index, no routes, no chunks.
const withContent = (loadPage, loadContent, prop) => () =>
  Promise.all([loadPage(), loadContent()]).then(([module, content]) => ({
    default: function PageWithContent() {
      return createElement(module.default, { [prop]: content });
    },
  }));

export const CountriesIndexPage = HAS_COUNTRY_PAGES
  ? lazyPage(withContent(() => import('@/pages/countries/CountriesIndexPage'), loadCountryIndex, 'pages'))
  : null;
export const COUNTRY_GUIDE_PAGES = HAS_COUNTRY_PAGES
  ? COUNTRY_PAGES.map(({ slug }) => ({
      slug,
      path: countryPagePath(slug),
      Page: lazyPage(withContent(() => import('@/pages/countries/CountryPage'), () => loadCountryPage(slug), 'page')),
    }))
  : [];

// "Where to go in <month>" (src/content/months/): the same, one page per month this build
// has; with none, no routes and no chunk
export const MONTH_GUIDE_PAGES = HAS_MONTH_PAGES
  ? MONTH_PAGES.map(({ slug }) => ({
      slug,
      path: monthPagePath(slug),
      Page: lazyPage(withContent(() => import('@/pages/months/MonthPage'), () => loadMonthPage(slug), 'page')),
    }))
  : [];

// Static paths -> page ('*' is the 404 page)
const PAGES_BY_PATH = {
  [ABOUT_PAGE_URL]: AboutPage,
  [CONTACT_PAGE_URL]: ContactPage,
  [PRICING_PAGE_URL]: PricingPage,
  [LEGAL_AGREEMENTS_PAGE_URL]: TermAndPoliciesPage,
  [MAINTENANCE_PAGE_URL]: MaintenancePage,
  [ADMIN_PAGE_URL]: AdminDashboardPage,
  [ADMIN_CONTACT_FORM_PAGE_URL]: ContactFormAdminPage,
  [ADMIN_USERS_PAGE_URL]: AdminUsersPage,
  [ADMIN_EVENTS_PAGE_URL]: AdminEventsPage,
  [ADMIN_PROMO_CODES_PAGE_URL]: AdminPromoCodesPage,
  [ADMIN_OFFERS_PAGE_URL]: AdminOffersPage,
  [ADMIN_THEMES_PAGE_URL]: AdminThemesPage,
  [CHALLENGES_PAGE_URL]: ChallengesPage,
  [GIFTS_PAGE_URL]: GiftsPage,
  [COMPARE_PAGE_URL]: ComparePage,
  [IMPORT_PAGE_URL]: ImportPage,
  [ACCOUNT_PAGE_URL]: AccountPage,
  [LOGIN_PAGE_URL]: LoginPage,
  [SIGN_UP_PAGE_URL]: RegisterPage,
  [FORGOT_PASS_PAGE_URL]: ForgettenPasswordPage,
  [MAP_PAGE_URL]: MapPage,
  [WELCOME_PAGE_URL]: WelcomePage,
  ...(SelectLabPage ? { [DEV_SELECT_LAB_PAGE_URL]: SelectLabPage } : {}),
  ...(CountriesIndexPage ? { [COUNTRIES_PAGE_URL]: CountriesIndexPage } : {}),
  ...Object.fromEntries(COUNTRY_GUIDE_PAGES.map(({ path, Page }) => [path, Page])),
  ...Object.fromEntries(MONTH_GUIDE_PAGES.map(({ path, Page }) => [path, Page])),
  '*': Error404,
};

// Load a page's code ahead of time (hover prefetch, first paint of a pre-rendered page)
export const preloadPage = (path) => PAGES_BY_PATH[path]?.preload().catch(() => {}) ?? Promise.resolve();
