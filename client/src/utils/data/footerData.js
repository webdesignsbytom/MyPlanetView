import {
  ABOUT_PAGE_URL,
  ACCOUNT_PAGE_URL,
  CONTACT_PAGE_URL,
  COUNTRIES_PAGE_URL,
  FAQ_PAGE_URL,
  HOME_PAGE_URL,
  LOGIN_PAGE_URL,
  MAP_PAGE_URL,
  PRICING_PAGE_URL,
  PRIVACY_POLICIES_PAGE_URL,
  SIGN_UP_PAGE_URL,
  TERMS_AND_CONDITIONS_PAGE_URL,
} from '../constants/routes';
import { HAS_CHECKED_COUNTRY_PAGES } from '../countries/countryPages';
import { COUNTRIES_SECTION } from '../countries/countryRoutes';

// Footer link columns, one FooterNavSection each. `signedInLinks` replaces `links` for a
// signed-in visitor (the pre-rendered pages are built signed out, so they keep `links`).
// An entry with `action` instead of `route` is a button ('cookie-settings' shows the
// cookie choice again, so consent can be withdrawn).
export const FooterLinkGroups = [
  {
    id: 'footer-explore',
    title: 'Explore',
    links: [
      { name: 'Home', route: HOME_PAGE_URL },
      { name: 'About', route: ABOUT_PAGE_URL },
      { name: 'FAQ', route: FAQ_PAGE_URL },
      { name: 'Pricing', route: PRICING_PAGE_URL },
      // Only once a country guide is checked (before that, /countries doesn't exist)
      ...(HAS_CHECKED_COUNTRY_PAGES ? [{ name: COUNTRIES_SECTION.name, route: COUNTRIES_PAGE_URL }] : []),
      { name: 'Contact', route: CONTACT_PAGE_URL },
    ],
  },
  {
    id: 'footer-account',
    title: 'Your map',
    links: [
      { name: 'Sign up', route: SIGN_UP_PAGE_URL },
      { name: 'Log in', route: LOGIN_PAGE_URL },
    ],
    signedInLinks: [
      { name: 'My map', route: MAP_PAGE_URL },
      { name: 'Account', route: ACCOUNT_PAGE_URL },
    ],
  },
  {
    id: 'footer-legal',
    title: 'Legal',
    links: [
      { name: 'Terms', route: TERMS_AND_CONDITIONS_PAGE_URL },
      { name: 'Privacy', route: PRIVACY_POLICIES_PAGE_URL },
      { name: 'Cookie settings', action: 'cookie-settings' },
    ],
  },
];
