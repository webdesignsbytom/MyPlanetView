// Constants
import {
  HOME_PAGE_URL,
  ABOUT_PAGE_URL,
  CONTACT_PAGE_URL,
  FAQ_PAGE_URL,
  PRICING_PAGE_URL,
  SIGN_UP_PAGE_URL,
  LOGIN_PAGE_URL,
  ACCOUNT_PAGE_URL,
  ADMIN_PAGE_URL,
  ADMIN_CONTACT_FORM_PAGE_URL,
  ADMIN_USERS_PAGE_URL,
  ADMIN_EVENTS_PAGE_URL,
  MAP_PAGE_URL,
} from '../constants/routes';
// Utils
import { hasRole, ROLES } from '../user/permissions';

// Only routed pages; auth links depend on the user
export const getNavLinkItemsArray = (user) => [
  // Signed in: your map first
  ...(user ? [{ path: MAP_PAGE_URL, label: 'My map' }] : []),

  // Core pages (the legal pages are linked from the footer)
  { path: HOME_PAGE_URL, label: 'Home' },
  { path: ABOUT_PAGE_URL, label: 'About' },
  { path: FAQ_PAGE_URL, label: 'FAQ' },
  { path: PRICING_PAGE_URL, label: 'Pricing' },
  { path: CONTACT_PAGE_URL, label: 'Contact' },

  // Admin
  ...(hasRole(user, ROLES.ADMIN, ROLES.DEVELOPER)
    ? [
        {
          label: 'Admin',
          subpages: [
            { path: ADMIN_PAGE_URL, label: 'Dashboard' },
            { path: ADMIN_CONTACT_FORM_PAGE_URL, label: 'Contact Forms' },
            { path: ADMIN_USERS_PAGE_URL, label: 'Users' },
            ...(hasRole(user, ROLES.DEVELOPER)
              ? [{ path: ADMIN_EVENTS_PAGE_URL, label: 'Audit Log' }]
              : []),
          ],
        },
      ]
    : []),

  // Account
  ...(user
    ? [{ path: ACCOUNT_PAGE_URL, label: 'Account' }]
    : [
        { path: LOGIN_PAGE_URL, label: 'Login' },
        { path: SIGN_UP_PAGE_URL, label: 'Sign Up' },
      ]),
];
