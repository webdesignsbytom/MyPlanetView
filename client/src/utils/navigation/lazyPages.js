import { lazy } from 'react';
// Constants
import {
  ABOUT_PAGE_URL,
  ACCOUNT_PAGE_URL,
  ADMIN_CONTACT_FORM_PAGE_URL,
  ADMIN_EVENTS_PAGE_URL,
  ADMIN_PAGE_URL,
  ADMIN_USERS_PAGE_URL,
  CONTACT_PAGE_URL,
  DEV_SELECT_LAB_PAGE_URL,
  FORGOT_PASS_PAGE_URL,
  LEGAL_AGREEMENTS_PAGE_URL,
  LOGIN_PAGE_URL,
  MAINTENANCE_PAGE_URL,
  SIGN_UP_PAGE_URL,
  MAP_PAGE_URL,
  WELCOME_PAGE_URL,
} from '../constants/routes';

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
export const TermAndPoliciesPage = lazyPage(() => import('@/pages/policies/TermAndPoliciesPage'));
export const MaintenancePage = lazyPage(() => import('@/pages/maintenance/MaintenancePage'));
export const Error404 = lazyPage(() => import('@/pages/error/Error404'));
// Admin
export const AdminDashboardPage = lazyPage(() => import('@/pages/admin/AdminDashboardPage'));
export const ContactFormAdminPage = lazyPage(() => import('@/pages/contact/admin/ContactFormAdminPage'));
export const AdminUsersPage = lazyPage(() => import('@/pages/admin/AdminUsersPage'));
export const AdminEventsPage = lazyPage(() => import('@/pages/admin/AdminEventsPage'));
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
export const InviteAcceptPage = lazyPage(() => import('@/pages/invite/InviteAcceptPage'));
// Dev server only: null in production builds, so the page isn't bundled
export const SelectLabPage = import.meta.env.DEV ? lazyPage(() => import('@/pages/dev/SelectLabPage')) : null;

// Static paths -> page ('*' is the 404 page)
const PAGES_BY_PATH = {
  [ABOUT_PAGE_URL]: AboutPage,
  [CONTACT_PAGE_URL]: ContactPage,
  [LEGAL_AGREEMENTS_PAGE_URL]: TermAndPoliciesPage,
  [MAINTENANCE_PAGE_URL]: MaintenancePage,
  [ADMIN_PAGE_URL]: AdminDashboardPage,
  [ADMIN_CONTACT_FORM_PAGE_URL]: ContactFormAdminPage,
  [ADMIN_USERS_PAGE_URL]: AdminUsersPage,
  [ADMIN_EVENTS_PAGE_URL]: AdminEventsPage,
  [ACCOUNT_PAGE_URL]: AccountPage,
  [LOGIN_PAGE_URL]: LoginPage,
  [SIGN_UP_PAGE_URL]: RegisterPage,
  [FORGOT_PASS_PAGE_URL]: ForgettenPasswordPage,
  [MAP_PAGE_URL]: MapPage,
  [WELCOME_PAGE_URL]: WelcomePage,
  ...(SelectLabPage ? { [DEV_SELECT_LAB_PAGE_URL]: SelectLabPage } : {}),
  '*': Error404,
};

// Load a page's code ahead of time (hover prefetch, first paint of a pre-rendered page)
export const preloadPage = (path) => PAGES_BY_PATH[path]?.preload().catch(() => {}) ?? Promise.resolve();
