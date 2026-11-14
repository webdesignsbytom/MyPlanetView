// Brand colours (literals live in brandColours.js; components use the CSS tokens)
import { BRAND_RED, BRAND_GROUND, BRAND_GROUND_DARK } from './brandColours.js';

// Site identity
export const CompanyName = 'My Planet View';
export const CompanyShortName = 'My Planet View'; // app name under a home-screen icon
export const CompanyEmailAddress = 'hello@myplanetview.com'; // the domain isn't registered yet
export const SITE_LANGUAGE = 'en-GB'; // <html lang>, og:locale, structured data

// Who runs the site (legal pages, structured data)
export const OperatorName = 'Byte Toast Studio';
export const DirectorName = 'Tom Brockington';
export const LocationCity = 'Tavistock';
export const LocationCountry = 'United Kingdom';
export const LocationCountryCode = 'GB'; // ISO 3166 code

// Browser bar and installed-app colours (light mode)
export const THEME_COLOUR = BRAND_RED;
export const THEME_COLOUR_DARK = BRAND_GROUND_DARK;
export const BACKGROUND_COLOUR = BRAND_GROUND;

// Developer credit (footer)
export const DEVELOPER_NAME = 'Byte Toast Studio';
export const DEVELOPER_URL = 'https://bytetoast-studio.com';

// Short copy
export const CompanyTagLine = 'Picture your travel.';

// Operator's address (legal pages and structured data)
export const AddressLine1 = '70 Monksmead'; // street
export const AddressLine2 = ''; // second street line, if any
export const AddressLine3 = LocationCity; // town or city
export const AddressLine4 = 'Devon'; // county or region, or empty
export const PostalCode = 'PL19 8ER';
// The address as shown on the page, one line each
export const ADDRESS_LINES = [OperatorName, AddressLine1, AddressLine2, AddressLine3, AddressLine4, PostalCode, LocationCountry].filter(Boolean);

// URLs (one host everywhere; www. 301s to it).
// The intended domain, not registered yet: the server's BusinessUrl must match.
export const FULL_BUSINESS_URL = 'https://myplanetview.com';
export const SHORT_BUSINESS_URL = 'myplanetview.com';
export const DISPLAY_BUSINESS_URL = 'myplanetview.com';

// Cookie settings
// Pop-up: 'banner' (analytics yes/no) | 'notice' (essential cookies only, no analytics) | 'modal' (must agree to enter)
export const COOKIE_CONSENT_STYLE = 'banner';
export const NumberOfCookies = 0;
export const COOKIE_TIMER = 10000;
export const COOKIE_POLICY_NAME = 'CookiePolicy';
export const DISAGREE_LINK = 'https://google.com';

// Structured data: one Organization, described on the home page
export const BUSINESS_SCHEMA_TYPE = 'Organization';
export const BUSINESS_AREA_SERVED = null; // worldwide
export const BUSINESS_LANGUAGES = ['English'];

// JSON-LD entity IDs
export const ORG_ID = `${FULL_BUSINESS_URL}/#org`;
export const WEBSITE_ID = `${FULL_BUSINESS_URL}/#website`;

// Fallback OG/Twitter
export const OG_TYPE_DEFAULT = 'website';

// Default 1200x630 share image (client/public/brand/og-default.jpg)
const OG_DEFAULT = `${FULL_BUSINESS_URL}/brand/og-default.jpg`;

// Page media (OG images): swap a key for a page-specific image once it's in client/public
export const PAGE_MEDIA = {
  logo: `${FULL_BUSINESS_URL}/brand/logo.png`,

  homePreview: OG_DEFAULT,
  contactPreview: OG_DEFAULT,
  aboutPreview: OG_DEFAULT,
  faqPreview: OG_DEFAULT,

  maintenancePreview: OG_DEFAULT,
  termsPreview: OG_DEFAULT,
  errorPreview: `${FULL_BUSINESS_URL}/pages/404-preview.webp`,
};

// Handy accessor (unknown keys get the default)
export const PageMediaHelper = (key) => PAGE_MEDIA[key] ?? OG_DEFAULT;

// API
export const API_TIMEOUT = 20000;

// Uploads
export const UPLOAD_CONCURRENCY = 4;
