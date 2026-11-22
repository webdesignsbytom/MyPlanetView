// Pages
export const HOME_PAGE_URL = '/';
export const ABOUT_PAGE_URL = '/about';
export const CONTACT_PAGE_URL = '/contact';
export const FAQ_PAGE_URL = '/faq';
export const PRICING_PAGE_URL = '/pricing';

// Country guides (public, pre-rendered). Not in PUBLIC_STATIC_ROUTES: they're built from
// the checked files in src/content/countries/ (scripts/country-pages.mjs), and with none
// checked there's no index and no country page at all
export const COUNTRIES_PAGE_URL = '/countries';
export const countryPagePath = (slug) => `${COUNTRIES_PAGE_URL}/${slug}`;

// "Where to go in <month>" (public, pre-rendered): built from the checked files in
// src/content/months/ and the checked country guides (scripts/month-pages.mjs); a month
// with too few countries at their best isn't built. No index page: each links the others
export const WHERE_TO_GO_URL = '/where-to-go';
export const monthPagePath = (slug) => `${WHERE_TO_GO_URL}/${slug}`;

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
// The passport (landmark book) of a map, and of a map opened from its share link
export const MAP_PASSPORT_PAGE_URL = '/maps/:mapId/passport';
export const SHARED_PASSPORT_PAGE_URL = '/shared/:code/passport';
export const mapPassportPath = (mapId) => `${mapPath(mapId)}/passport`;
export const sharedPassportPath = (code) => `/shared/${encodeURIComponent(code)}/passport`;
export const tripPath = (tripId) => `/trips/${encodeURIComponent(tripId)}`;
// Friends challenges (signed in), and a challenge's join link (anyone; the code is a secret)
export const CHALLENGES_PAGE_URL = '/challenges';
export const CHALLENGE_PAGE_URL = '/challenges/:challengeId';
export const CHALLENGE_JOIN_PAGE_URL = '/challenges/join/:code';
// Gifts of a year of a plan (docs/API.md "Gifts"): buying and yours (signed in), and a
// gift's own page (anyone with its code)
export const GIFTS_PAGE_URL = '/gifts';
// Bringing your travels from Polarsteps (docs/API.md "Importing from Polarsteps"; signed in)
export const IMPORT_PAGE_URL = '/import';
// Comparing two maps (22 Nov 2026; signed in): ?a=&b= are map ids
export const COMPARE_PAGE_URL = '/compare';
export const comparePath = (mapId) => `${COMPARE_PAGE_URL}?a=${encodeURIComponent(mapId)}`;
// An email's unsubscribe link (docs/API.md "Emails"; anyone, with its signed ?u=&t=)
export const UNSUBSCRIBE_PAGE_URL = '/unsubscribe';
export const importPath = (mapId) => (mapId ? `${IMPORT_PAGE_URL}?map=${encodeURIComponent(mapId)}` : IMPORT_PAGE_URL);
export const GIFT_PAGE_URL = '/gift/:code';
export const giftPath = (code) => `/gift/${encodeURIComponent(code)}`;
export const challengePath = (challengeId) => `/challenges/${encodeURIComponent(challengeId)}`;
export const challengeJoinPath = (code) => `/challenges/join/${encodeURIComponent(code)}`;

// Admin pages
export const ADMIN_PAGE_URL = '/admin';
export const ADMIN_CONTACT_FORM_PAGE_URL = `${ADMIN_PAGE_URL}/contact-forms`;
export const ADMIN_USERS_PAGE_URL = `${ADMIN_PAGE_URL}/users`;
export const ADMIN_EVENTS_PAGE_URL = `${ADMIN_PAGE_URL}/events`;
export const ADMIN_PROMO_CODES_PAGE_URL = `${ADMIN_PAGE_URL}/promo-codes`;
export const ADMIN_OFFERS_PAGE_URL = `${ADMIN_PAGE_URL}/offers`;
export const ADMIN_THEMES_PAGE_URL = `${ADMIN_PAGE_URL}/themes`;

// Dev server only (not routed in production builds)
export const DEV_SELECT_LAB_PAGE_URL = '/dev/select-lab';

// For site map
export const PUBLIC_STATIC_ROUTES = [
  HOME_PAGE_URL,
  ABOUT_PAGE_URL,
  FAQ_PAGE_URL,
  PRICING_PAGE_URL,
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
  CHALLENGES_PAGE_URL,
  GIFTS_PAGE_URL,
  GIFT_PAGE_URL.split('/:')[0],
  IMPORT_PAGE_URL,
  UNSUBSCRIBE_PAGE_URL,
  COMPARE_PAGE_URL,
];

// Pages whose address carries a secret (share code, invite token, password-reset or
// email-verification link): analytics is paused there (utils/analytics/privacy.js)
export const ANALYTICS_EXCLUDED_PREFIXES = [
  SHARED_PAGE_URL.split('/:')[0],
  CHALLENGE_JOIN_PAGE_URL.split('/:')[0],
  // A gift's code is worth a year of a plan
  GIFT_PAGE_URL.split('/:')[0],
  // Its query is a signed link to someone's account
  UNSUBSCRIBE_PAGE_URL,
  INVITE_PAGE_URL.split('/:')[0],
  RESET_PASS_PAGE_URL.split('/:')[0],
  VERIFY_EMAIL_PAGE_URL.split('/:')[0],
];

// Pages with an id or a secret in the address: analytics only ever sees the pattern. A
// pattern with something after its id (the passports) is matched whole; the others cover
// anything under their prefix (utils/analytics/privacy.js)
export const ANALYTICS_REDACTED_ROUTES = [
  CHALLENGE_JOIN_PAGE_URL,
  GIFT_PAGE_URL,
  CHALLENGE_PAGE_URL,
  MAP_PASSPORT_PAGE_URL,
  SHARED_PASSPORT_PAGE_URL,
  SHARED_PAGE_URL,
  INVITE_PAGE_URL,
  RESET_PASS_PAGE_URL,
  VERIFY_EMAIL_PAGE_URL,
  MAP_BY_ID_PAGE_URL,
  TRIP_PAGE_URL,
];

// Sitemap lastmod per page (YYYY-MM-DD); set only when the content really changes
export const ROUTE_SITEMAP_META = {};
