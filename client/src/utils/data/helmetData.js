// Constants
import { CompanyName } from '../constants/constants.js';
import { PLANS, formatPence } from '../constants/plans.js';
import {
  HOME_PAGE_URL,
  ABOUT_PAGE_URL,
  CONTACT_PAGE_URL,
  PRICING_PAGE_URL,
  SIGN_UP_PAGE_URL,
  LOGIN_PAGE_URL,
  VERIFY_EMAIL_PAGE_URL,
  FORGOT_PASS_PAGE_URL,
  RESET_PASS_PAGE_URL,
  ACCOUNT_PAGE_URL,
  ADMIN_PAGE_URL,
  ADMIN_CONTACT_FORM_PAGE_URL,
  ADMIN_USERS_PAGE_URL,
  ADMIN_EVENTS_PAGE_URL,
  LEGAL_AGREEMENTS_PAGE_URL,
  TERMS_AND_CONDITIONS_PAGE_URL,
  PRIVACY_POLICIES_PAGE_URL,
  MAINTENANCE_PAGE_URL,
  ERROR_404_PAGE_URL,
  FAQ_PAGE_URL,
  DEV_SELECT_LAB_PAGE_URL,
  MAP_PAGE_URL,
  TRIP_PAGE_URL,
  WELCOME_PAGE_URL,
  SHARED_PAGE_URL,
  INVITE_PAGE_URL,
} from '../constants/routes.js';

export const helmetData = {
  // Main public pages
  [HOME_PAGE_URL]: {
    pageName: 'Home',
    title: `${CompanyName} | Your Private Travel Map and Photos`,
    desc: 'Keep a private map of every country you have visited. Add your travel photos, match them to landmarks, plan new trips and share only with who you choose.',
    indexing: 'index,follow',
  },

  [ABOUT_PAGE_URL]: {
    pageName: 'About',
    desc: `Why ${CompanyName} exists, who it is for and who runs it: one private map for solo travellers, couples and families, with your photos where they belong.`,
    indexing: 'index,follow',
  },

  [FAQ_PAGE_URL]: {
    pageName: 'FAQ',
    desc: `Answers about ${CompanyName}: who can see your map, how sharing links work, what happens to photo location data, and how couples and families share.`,
    indexing: 'index,follow',
  },

  [PRICING_PAGE_URL]: {
    pageName: 'Pricing',
    title: `Pricing: Economy, Business and First Class | ${CompanyName}`,
    desc: `${CompanyName} pricing: Economy is free, Business is ${formatPence(PLANS.REGULAR.price.MONTH)} a month and First Class ${formatPence(PLANS.PREMIUM.price.MONTH)}. Every plan has private sharing and your travel map.`,
    indexing: 'index,follow',
  },

  [CONTACT_PAGE_URL]: {
    pageName: 'Contact',
    desc: `Contact the ${CompanyName} team with a question, a bug report or an idea for the map. Send a message with an optional screenshot and we reply by email.`,
    indexing: 'index,follow',
  },

  // Auth
  [SIGN_UP_PAGE_URL]: {
    pageName: 'Sign Up',
    desc: `Create a free ${CompanyName} account and start your private travel map: choose solo, couple or family, colour in countries and add your photos.`,
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,follow',
  },

  [LOGIN_PAGE_URL]: {
    pageName: 'Login',
    desc: `Sign in to ${CompanyName} to open your travel map, add photos and trips, and manage who you share them with.`,
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,follow',
  },

  [VERIFY_EMAIL_PAGE_URL]: {
    pageName: 'Verify Email',
    desc: `Verify your email address to activate your ${CompanyName} account.`,
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  [FORGOT_PASS_PAGE_URL]: {
    pageName: 'Forgot Password',
    desc: `Request a password reset link for your ${CompanyName} account.`,
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  [RESET_PASS_PAGE_URL]: {
    pageName: 'Reset Password',
    desc: `Choose a new password for your ${CompanyName} account.`,
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  // Account
  [ACCOUNT_PAGE_URL]: {
    pageName: 'Account',
    desc: `Manage your ${CompanyName} account: profile, email, password and sessions.`,
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  // The travel app: private, never indexed (and share/invite addresses carry secrets)
  [MAP_PAGE_URL]: {
    pageName: 'Your Map',
    desc: `Your private ${CompanyName} travel map.`,
    indexing: 'noindex,nofollow',
  },

  [TRIP_PAGE_URL]: {
    pageName: 'Trip',
    desc: `A trip on ${CompanyName}: its stops, route and photos.`,
    indexing: 'noindex,nofollow',
  },

  [WELCOME_PAGE_URL]: {
    pageName: 'Welcome',
    desc: `Set up your ${CompanyName} map: who it's for and who travels.`,
    indexing: 'noindex,nofollow',
  },

  [SHARED_PAGE_URL]: {
    pageName: 'Shared With You',
    desc: `A travel map or trip shared with you on ${CompanyName}.`,
    indexing: 'noindex,nofollow',
  },

  [INVITE_PAGE_URL]: {
    pageName: 'Invitation',
    desc: `Accept an invitation to a ${CompanyName} travel map or trip.`,
    indexing: 'noindex,nofollow',
  },

  // Admin
  [ADMIN_PAGE_URL]: {
    pageName: 'Admin',
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  [ADMIN_CONTACT_FORM_PAGE_URL]: {
    pageName: 'Contact Form Admin',
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  [ADMIN_USERS_PAGE_URL]: {
    pageName: 'User Admin',
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  [ADMIN_EVENTS_PAGE_URL]: {
    pageName: 'Audit Log',
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
  },

  // Legal
  [LEGAL_AGREEMENTS_PAGE_URL]: {
    pageName: 'Terms and Privacy',
    desc: `The ${CompanyName} terms and privacy policy: what you agree to, what we store, where your photos are kept, how sharing works and how to delete it.`,
    indexing: 'index,follow',
  },

  [TERMS_AND_CONDITIONS_PAGE_URL]: {
    pageName: 'Terms and Conditions',
    desc: `The terms for using ${CompanyName}: accounts, your photos and content, sharing, acceptable use, the free service and closing your account.`,
    indexing: 'index,follow',
  },

  [PRIVACY_POLICIES_PAGE_URL]: {
    pageName: 'Privacy Policy',
    desc: `How ${CompanyName} handles your data: what we store, the location in your photos, where files are kept, cookies, how long we keep it and your rights.`,
    indexing: 'index,follow',
  },

  // System
  [MAINTENANCE_PAGE_URL]: {
    pageName: 'Maintenance',
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
    desc: `${CompanyName} is currently undergoing maintenance.`,
  },

  [ERROR_404_PAGE_URL]: {
    pageName: 'Page Not Found',
    additionalMeta: [],
    structuredData: [],
    indexing: 'noindex,nofollow',
    desc: `The page you are looking for could not be found.`,
  },

  // Dev server only
  [DEV_SELECT_LAB_PAGE_URL]: {
    pageName: 'Dropdown Lab',
    indexing: 'noindex,nofollow',
    desc: 'Trials for fully styled dropdowns (customizable select).',
  },
};
