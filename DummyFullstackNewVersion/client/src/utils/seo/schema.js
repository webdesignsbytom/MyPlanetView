// Structured data builders: the business, the site and each page, from constants.js and helmetData only
import {
  AddressLine1,
  AddressLine2,
  AddressLine3,
  AddressLine4,
  BUSINESS_AREA_SERVED,
  BUSINESS_LANGUAGES,
  BUSINESS_SCHEMA_TYPE,
  CompanyEmailAddress,
  CompanyName,
  FULL_BUSINESS_URL,
  LocationCountryCode,
  ORG_ID,
  PageMediaHelper,
  PostalCode,
  SITE_LANGUAGE,
  WEBSITE_ID,
} from '@/utils/constants/constants';
import { HOME_PAGE_URL } from '@/utils/constants/routes';
import { SOCIAL_URLS } from '@/utils/constants/links';
import { helmetData } from '@/utils/data/helmetData';
import { metaTitle } from '@/utils/seo/metaText';
import getCanonical from '@/utils/seo/getCanonical';

const CONTEXT = 'https://schema.org';

// Drops empty facts, so no node claims a blank value
export const compact = (node) =>
  Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) => value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length),
    ),
  );

// Absolute http(s) URL, or undefined (structured data ignores relative ones)
export const absoluteUrl = (url) => {
  if (typeof url !== 'string' || !url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith('/') && !url.startsWith('//') ? `${FULL_BUSINESS_URL}${url}` : undefined;
};

// ISO string, or undefined (a Date object prints as [object Object] in meta tags)
export const isoDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export const websiteRef = { '@type': 'WebSite', '@id': WEBSITE_ID, url: FULL_BUSINESS_URL, name: CompanyName };

// How every node names the business: one @id and one @type everywhere
export const businessRef = {
  '@type': BUSINESS_SCHEMA_TYPE,
  '@id': ORG_ID,
  name: CompanyName,
  url: FULL_BUSINESS_URL,
  logo: PageMediaHelper('logo'),
};

export const businessAddress = compact({
  '@type': 'PostalAddress',
  streetAddress: [AddressLine1, AddressLine2].filter(Boolean).join(', '),
  addressLocality: AddressLine3,
  addressRegion: AddressLine4,
  postalCode: PostalCode,
  addressCountry: LocationCountryCode,
});

// The full description of the site's organisation, on the home page only
export const businessEntity = compact({
  '@context': CONTEXT,
  ...businessRef,
  description: helmetData[HOME_PAGE_URL].desc,
  image: PageMediaHelper('homePreview'),
  email: CompanyEmailAddress,
  address: businessAddress,
  areaServed: BUSINESS_AREA_SERVED,
  contactPoint: compact({
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: CompanyEmailAddress,
    areaServed: BUSINESS_AREA_SERVED,
    availableLanguage: BUSINESS_LANGUAGES,
  }),
  sameAs: SOCIAL_URLS,
});

export const websiteEntity = {
  '@context': CONTEXT,
  ...websiteRef,
  inLanguage: SITE_LANGUAGE,
  publisher: businessRef,
};

// A generated list page: its items as an ItemList, in the order shown
export const collectionPageSchema = ({ path, name, description, items }) =>
  compact({
    '@context': CONTEXT,
    '@type': 'CollectionPage',
    url: getCanonical(path),
    name,
    description,
    inLanguage: SITE_LANGUAGE,
    isPartOf: websiteRef,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: getCanonical(item.path),
        name: item.name,
      })),
    },
  });

// A page node, named and described from the same helmetData entry as the page's head
export const pageSchema = (route, { type = 'WebPage', ...extra } = {}) => {
  const page = helmetData[route];
  return compact({
    '@context': CONTEXT,
    '@type': type,
    url: getCanonical(route),
    name: page.title || metaTitle(page.pageName, CompanyName),
    description: page.desc,
    inLanguage: SITE_LANGUAGE,
    isPartOf: websiteRef,
    ...extra,
  });
};
