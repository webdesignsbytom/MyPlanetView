// Pages
export const HOME_PAGE_URL = '/';
export const ABOUT_PAGE_URL = '/about';
export const CONTACT_PAGE_URL = '/contact';
export const FAQ_PAGE_URL = '/faq';

// Terms and Conditions
export const LEGAL_AGREEMENTS_PAGE_URL = '/user-agreements';
export const TERMS_AND_CONDITIONS_PAGE_URL = '/user-agreements#terms-and-conditions';
export const PRIVACY_POLICIES_PAGE_URL = '/user-agreements#privacy-policy';

// Maintainance
export const MAINTENANCE_PAGE_URL = '/down-for-maintenance';

// Error
export const ERROR_404_PAGE_URL = '*';

// User pages
export const SIGN_UP_PAGE_URL = '/sign-up';
export const LOGIN_PAGE_URL = '/login';
export const VERIFY_EMAIL_PAGE_URL =
  '/verify-email-address/:userId/:uniqueString';
export const FORGOT_PASS_PAGE_URL = '/forgot-password';
export const RESET_PASS_PAGE_URL = '/reset-password/:userId/:token';

// Accounts pages
export const ACCOUNT_PAGE_URL = '/account';

// The travel app (signed in, or a share link): never indexed
export const MAP_PAGE_URL = '/map'; // your default map
export const MAP_BY_ID_PAGE_URL = '/maps/:mapId';
export const TRIP_PAGE_URL = '/trips/:tripId';
export const WELCOME_PAGE_URL = '/welcome'; // onboarding after sign-up
export const SHARED_PAGE_URL = '/shared/:code'; // a share link, no sign-in
export const INVITE_PAGE_URL = '/invite/:token'; // accept an emailed invite

export const mapPath = (mapId) => `/maps/${encodeURIComponent(mapId)}`;
export const tripPath = (tripId) => `/trips/${encodeURIComponent(tripId)}`;

// Admin pages
export const ADMIN_PAGE_URL = '/admin';
export const ADMIN_CONTACT_FORM_PAGE_URL = `${ADMIN_PAGE_URL}/contact-forms`;
export const ADMIN_USERS_PAGE_URL = `${ADMIN_PAGE_URL}/users`;
export const ADMIN_EVENTS_PAGE_URL = `${ADMIN_PAGE_URL}/events`;

// Dev server only (not routed in production builds)
export const DEV_SELECT_LAB_PAGE_URL = '/dev/select-lab';

// For site map
export const PUBLIC_STATIC_ROUTES = [
  HOME_PAGE_URL,
  ABOUT_PAGE_URL,
  FAQ_PAGE_URL,
  CONTACT_PAGE_URL,
  LEGAL_AGREEMENTS_PAGE_URL,
];

// Browser-only pages (signed in, admin, email links)
// Hosts send these to the app shell; any other unknown URL gets the real 404
export const CLIENT_ONLY_ROUTE_PREFIXES = [
  ADMIN_PAGE_URL,
  ACCOUNT_PAGE_URL,
  LOGIN_PAGE_URL,
  SIGN_UP_PAGE_URL,
  FORGOT_PASS_PAGE_URL,
  VERIFY_EMAIL_PAGE_URL.split('/:')[0],
  RESET_PASS_PAGE_URL.split('/:')[0],
  MAINTENANCE_PAGE_URL,
  MAP_PAGE_URL,
  MAP_BY_ID_PAGE_URL.split('/:')[0],
  TRIP_PAGE_URL.split('/:')[0],
  WELCOME_PAGE_URL,
  SHARED_PAGE_URL.split('/:')[0],
  INVITE_PAGE_URL.split('/:')[0],
];

// Pages whose address carries a secret (share code, invite token, password-reset or
// email-verification link): analytics is paused there (utils/analytics/privacy.js)
export const ANALYTICS_EXCLUDED_PREFIXES = [
  SHARED_PAGE_URL.split('/:')[0],
  INVITE_PAGE_URL.split('/:')[0],
  RESET_PASS_PAGE_URL.split('/:')[0],
  VERIFY_EMAIL_PAGE_URL.split('/:')[0],
];

// Pages with an id or a secret in the address: analytics only ever sees the pattern
export const ANALYTICS_REDACTED_ROUTES = [
  SHARED_PAGE_URL,
  INVITE_PAGE_URL,
  RESET_PASS_PAGE_URL,
  VERIFY_EMAIL_PAGE_URL,
  MAP_BY_ID_PAGE_URL,
  TRIP_PAGE_URL,
];

// Sitemap lastmod per page (YYYY-MM-DD); set only when the content really changes
export const ROUTE_SITEMAP_META = {};
