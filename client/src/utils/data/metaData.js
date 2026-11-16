// Per-page structured data and share images. Names, descriptions and business facts come from
// helmetData and constants.js; HelmetItem sets each page's og/twitter title and description.
// Constants
import { PageMediaHelper } from '@/utils/constants/constants';
import {
  ABOUT_PAGE_URL,
  CONTACT_PAGE_URL,
  FAQ_PAGE_URL,
  LEGAL_AGREEMENTS_PAGE_URL,
  PRICING_PAGE_URL,
} from '@/utils/constants/routes';
// SEO
import {
  businessEntity,
  businessRef,
  pageSchema,
  websiteEntity,
} from '@/utils/seo/schema';

// Share image (og:image and twitter:image) from a PAGE_MEDIA key or a URL
const shareImage = (image) => [
  { property: 'og:image', content: image },
  { name: 'twitter:image', content: image },
];
const pageImage = (key) => shareImage(PageMediaHelper(key));

// Home
export const homePageStructuredData = businessEntity;
export const websiteStructuredData = websiteEntity;
export const homePageAdditionalMeta = pageImage('homePreview');

// Main pages
export const aboutPageStructuredData = pageSchema(ABOUT_PAGE_URL, { type: 'AboutPage', mainEntity: businessRef });
export const aboutPageAdditionalMeta = pageImage('aboutPreview');

// WebPage on purpose: FAQSchema emits the FAQPage from the visible questions
export const faqPageStructuredData = pageSchema(FAQ_PAGE_URL);
export const faqPageAdditionalMeta = pageImage('faqPreview');

export const contactPageStructuredData = pageSchema(CONTACT_PAGE_URL, { type: 'ContactPage', mainEntity: businessRef });
export const contactPageAdditionalMeta = pageImage('contactPreview');

// A plain WebPage: no Offer markup until the prices are final (M4: markup must match the page)
export const pricingPageStructuredData = pageSchema(PRICING_PAGE_URL, { publisher: businessRef });
export const pricingPageAdditionalMeta = pageImage('pricingPreview');

export const termsAndPoliciesStructuredData = pageSchema(LEGAL_AGREEMENTS_PAGE_URL, { publisher: businessRef });
export const termsAndPoliciesAdditionalMeta = pageImage('termsPreview');

// Noindex pages carry no structured data
export const forgottenPasswordPageStructuredData = null;
export const forgottenPasswordPageAdditionalMeta = pageImage('termsPreview');
export const resetPasswordPageStructuredData = null;
export const resetPasswordPageAdditionalMeta = pageImage('termsPreview');
export const loginPageStructuredData = null;
export const loginPageAdditionalMeta = pageImage('termsPreview');
export const registerPageStructuredData = null;
export const registerPageAdditionalMeta = pageImage('termsPreview');
export const verifyEmailPageStructuredData = null;
export const verifyEmailPageAdditionalMeta = pageImage('termsPreview');
export const maintenancePageStructuredData = null;
export const maintenancePageAdditionalMeta = pageImage('maintenancePreview');
export const errorPageStructuredData = null;
export const errorPageAdditionalMeta = pageImage('errorPreview');
