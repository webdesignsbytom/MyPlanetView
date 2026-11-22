import { describe, expect, it } from 'vitest';
import { helmetData } from '@/utils/data/helmetData';
import * as metaData from '@/utils/data/metaData';
import * as pricing from '@/utils/data/pricingData';
import { LEGAL_VERSION, PrivacySectionsArray, TermsSectionsArray } from '@/utils/data/termsData';
import { faqSchemaItems, faqsArray } from '@/utils/data/faqData';
import { homeCta, homeFeatures, homeFeaturesIntro, homeGroups, homeHero, homePrivacy } from '@/utils/data/homeData';
import { aboutIntro, aboutSections } from '@/utils/data/aboutData';
import { FooterLinkGroups } from '@/utils/data/footerData';
import { getNavLinkItemsArray } from '@/utils/data/navData';
import { emptyContactFormData } from '@/utils/data/formData';
import { COMMON_COUNTRIES, COUNTRIES } from '@/utils/data/countryData';
import * as icons from '@/utils/data/svgIcons';
import { socialMediaLinks } from '@/utils/data/socialMediaData';
import { CompanyName } from '@/utils/constants/constants';
import * as links from '@/utils/constants/links';
import { EDITORS_PER_MAP, FREE_MAPS, INCLUDED_MAPS, PLANS, PLAN_IDS, TRANSFER_GRACE_DAYS, formatPence } from '@/utils/constants/plans';
import * as routes from '@/utils/constants/routes';
import { HAS_CHECKED_COUNTRY_PAGES } from '@/utils/countries/countryPages';
import { MAP_STYLES } from '@/utils/map/mapStyles';
import { REFUND_DAYS } from '@/utils/plans/billing';
import { INVITE_OFFER_DAYS, INVITE_OFFER_MONTHS, INVITE_OFFER_PERCENT_OFF } from '@/utils/plans/inviteOffer';
import { PROMO_TRIAL_DAYS } from '@/utils/plans/promoCodes';
import { MAX_DESCRIPTION, MAX_TITLE, MIN_DESCRIPTION, metaTitle } from '@/utils/seo/metaText';
import getCanonical from '@/utils/seo/getCanonical';

const GB = 1000 ** 3;
const isOwnPage = (route) => !route.includes(':') && !route.includes('#') && route !== '*';
const titleOf = (entry) => entry.title || metaTitle(entry.pageName, CompanyName);
const ROUTE_VALUES = new Set(Object.values(routes).filter((value) => typeof value === 'string'));

describe('helmetData', () => {
  const entries = Object.entries(helmetData);

  it('gives every page a title of 60 characters or fewer', () => {
    for (const [route, entry] of entries) expect(titleOf(entry).length, route).toBeLessThanOrEqual(MAX_TITLE);
  });

  it('gives every indexed page a description of 120 to 156 characters, in whole sentences, each its own', () => {
    const indexed = entries.filter(([route, entry]) => isOwnPage(route) && entry.indexing.startsWith('index'));
    expect(indexed.map(([route]) => route).sort()).toEqual([...routes.PUBLIC_STATIC_ROUTES].sort());
    for (const [route, entry] of indexed) {
      expect(entry.desc.length, route).toBeGreaterThanOrEqual(MIN_DESCRIPTION);
      expect(entry.desc.length, route).toBeLessThanOrEqual(MAX_DESCRIPTION);
      expect(entry.desc, route).toMatch(/[.!?]$/);
      expect(entry.desc, route).not.toMatch(/(\.\.\.|…)$/);
    }
    const descriptions = indexed.map(([, entry]) => entry.desc);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('keeps every other description within the limit', () => {
    for (const [route, entry] of entries) if (entry.desc) expect(entry.desc.length, route).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it('never indexes a browser-only page', () => {
    for (const [route, entry] of entries) {
      const clientOnly = routes.CLIENT_ONLY_ROUTE_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
      if (clientOnly || route === '*') expect(entry.indexing, route).toMatch(/^noindex/);
      expect(['index,follow', 'noindex,follow', 'noindex,nofollow'], route).toContain(entry.indexing);
    }
  });

  it('is keyed by the route constants, and names every page', () => {
    for (const [route, entry] of entries) {
      expect(ROUTE_VALUES.has(route), route).toBe(true);
      expect(entry.pageName, route).toBeTruthy();
    }
  });

  it('prices the pricing page’s description from the plans', () => {
    const desc = helmetData[routes.PRICING_PAGE_URL].desc;
    expect(desc).toContain(formatPence(PLANS.REGULAR.price.MONTH));
    expect(desc).toContain(formatPence(PLANS.PREMIUM.price.MONTH));
  });
});

describe('metaData', () => {
  const pages = [
    ['about', routes.ABOUT_PAGE_URL, 'AboutPage'],
    ['faq', routes.FAQ_PAGE_URL, 'WebPage'],
    ['contact', routes.CONTACT_PAGE_URL, 'ContactPage'],
    ['pricing', routes.PRICING_PAGE_URL, 'WebPage'],
    ['termsAndPolicies', routes.LEGAL_AGREEMENTS_PAGE_URL, 'WebPage'],
  ];

  it('describes each public page from its helmetData entry, at its canonical address', () => {
    for (const [name, route, type] of pages) {
      const data = metaData[`${name === 'termsAndPolicies' ? name : `${name}Page`}StructuredData`];
      expect(data['@type'], name).toBe(type);
      expect(data.url, name).toBe(getCanonical(route));
      expect(data.description, name).toBe(helmetData[route].desc);
    }
    expect(metaData.homePageStructuredData['@type']).toBe('Organization');
    expect(metaData.websiteStructuredData['@type']).toBe('WebSite');
  });

  it('gives every page the same share image for og and twitter', () => {
    const extras = Object.entries(metaData).filter(([name]) => name.endsWith('AdditionalMeta'));
    expect(extras.length).toBeGreaterThan(10);
    for (const [name, meta] of extras) {
      const [og, twitter] = meta;
      expect(og, name).toMatchObject({ property: 'og:image' });
      expect(twitter, name).toMatchObject({ name: 'twitter:image', content: og.content });
      expect(og.content, name).toMatch(/^https:\/\/myplanetview\.com\//);
    }
  });

  it('marks up nothing on the noindex pages', () => {
    for (const name of ['forgottenPassword', 'resetPassword', 'login', 'register', 'verifyEmail', 'maintenance', 'error']) {
      expect(metaData[`${name}PageStructuredData`], name).toBeNull();
    }
  });
});

describe('pricingData', () => {
  const allText = JSON.stringify(pricing);
  const count = (n) => n.toLocaleString('en-GB');

  it('has a ticket per plan, each with its photos per country from the constants, and nothing marked “soon”', () => {
    expect(pricing.planTickets.map((ticket) => ticket.id)).toEqual([...PLAN_IDS]);
    for (const ticket of pricing.planTickets) {
      expect(ticket.features.map((f) => f.text)).toContain(`${count(PLANS[ticket.id].limits.photosPerCountry)} photos of each country, on each map`);
      expect(ticket.features.some((f) => f.soon)).toBe(false);
    }
  });

  it('takes the extra maps’ prices and the free maps from the constants', () => {
    expect(pricing.extraMaps.prices).toEqual([
      expect.objectContaining({ month: formatPence(PLANS.REGULAR.extraMap.MONTH), year: formatPence(PLANS.REGULAR.extraMap.YEAR) }),
      expect.objectContaining({ month: formatPence(PLANS.PREMIUM.extraMap.MONTH), year: formatPence(PLANS.PREMIUM.extraMap.YEAR) }),
    ]);
    expect(pricing.extraMaps.intro).toContain(`Every account has ${FREE_MAPS} maps free`);
    expect(pricing.extraMaps.intro).toContain(`${FREE_MAPS - INCLUDED_MAPS} more on Economy`);
  });

  it('takes the yearly prices, the storage limits, the editors and the refund days from the constants', () => {
    expect(pricing.gifts.intro).toContain(formatPence(PLANS.REGULAR.price.YEAR));
    expect(pricing.gifts.intro).toContain(formatPence(PLANS.PREMIUM.price.YEAR));
    const notes = pricing.pricingNotes.map((note) => note.text).join(' ');
    expect(notes).toContain(`${Math.round(PLANS.REGULAR.limits.storageCapBytes / GB)} GB`);
    expect(notes).toContain(`${Math.round(PLANS.PREMIUM.limits.storageCapBytes / GB)} GB`);
    expect(notes).toContain(`within ${REFUND_DAYS} days`);
    expect(allText).toContain(`up to ${EDITORS_PER_MAP} editors on each map`);
  });

  it('tells the truth about yearly plans: about two months free', () => {
    for (const id of ['REGULAR', 'PREMIUM']) {
      const monthsFree = (PLANS[id].price.MONTH * 12 - PLANS[id].price.YEAR) / PLANS[id].price.MONTH;
      expect(monthsFree, id).toBeGreaterThan(1.75);
      expect(monthsFree, id).toBeLessThan(2.5);
    }
  });

  it('states the invite offer as the offer’s own constants have it', () => {
    const note = pricing.pricingNotes.find((n) => n.text.startsWith('Invited to'));
    expect(note.text).toContain(`within ${INVITE_OFFER_DAYS} days`);
    expect(note.text).toContain(`first ${INVITE_OFFER_MONTHS} months`);
    expect(INVITE_OFFER_PERCENT_OFF).toBe(50);
    expect(note.text).toContain('half price');
  });

  it('counts the map’s looks as the styles there are', () => {
    const words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
    expect(allText).toContain(`${words[MAP_STYLES.length - 1]} looks for the map`);
  });
});

describe('termsData', () => {
  const sections = [...TermsSectionsArray, ...PrivacySectionsArray];
  const text = (id) => sections.find((section) => section.id === id).content.join(' ');

  it('has its version and the day it changed', () => {
    expect(LEGAL_VERSION.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(LEGAL_VERSION.version).toBe('1.3.0');
    expect(LEGAL_VERSION.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(LEGAL_VERSION.lastUpdated))).toBe(false);
  });

  it('gives every section its own id, a title and paragraphs', () => {
    const ids = sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of sections) {
      expect(section.title, section.id).toBeTruthy();
      expect(section.content.length, section.id).toBeGreaterThan(0);
      for (const paragraph of section.content) expect(typeof paragraph === 'string' ? paragraph.trim() : paragraph, section.id).toBeTruthy();
    }
  });

  it('states the plans’ numbers as the constants have them', () => {
    expect(TermsSectionsArray.find((s) => s.id === 'refunds').title).toBe(`${REFUND_DAYS} days to change your mind`);
    expect(text('free-memberships-and-promo-codes')).toContain(`within the ${PROMO_TRIAL_DAYS} days`);
    expect(text('free-memberships-and-promo-codes')).toContain(`your first ${INVITE_OFFER_MONTHS} monthly payments`);
    expect(text('free-memberships-and-promo-codes')).toContain(`within ${INVITE_OFFER_DAYS} days of creating your account`);
    expect(text('changing-plans')).toContain(`Every account has ${FREE_MAPS} maps free`);
    expect(text('changing-plans')).toContain(`for ${TRANSFER_GRACE_DAYS} days`);
  });
});

describe('the page copy', () => {
  it('has the FAQ’s questions once each, and its markup from the same questions', () => {
    const questions = faqsArray.map((faq) => faq.question);
    expect(new Set(questions).size).toBe(questions.length);
    expect(faqSchemaItems).toEqual(faqsArray.map(({ question, answer }) => ({ q: question, a: answer })));
    const cost = faqsArray.find((faq) => faq.question.endsWith('cost?')).answer;
    expect(cost).toContain(`${FREE_MAPS} maps, ${PLANS.FREE.limits.photosPerCountry} photos of each country`);
    expect(cost).toContain(formatPence(PLANS.REGULAR.price.MONTH));
  });

  it('gives the home and about sections their ids and words', () => {
    expect(homeHero.title).toBeTruthy();
    expect(homeFeaturesIntro).toBeTruthy();
    for (const list of [homeFeatures, homeGroups, aboutSections]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const item of list) expect(item.title).toBeTruthy();
    }
    expect(homeGroups.map((g) => g.id)).toEqual(['solo', 'couple', 'family']);
    expect(homePrivacy.points.length).toBeGreaterThan(3);
    expect(homeCta.title).toBe('Start your map');
    expect(aboutIntro).toContain(CompanyName);
  });

  it('starts the contact form empty, with the server’s fields', () => {
    expect(emptyContactFormData).toEqual({ name: '', email: '', message: '' });
  });
});

describe('footerData', () => {
  it('links only to real routes, and offers the cookie choice again', () => {
    const all = FooterLinkGroups.flatMap((group) => [...group.links, ...(group.signedInLinks || [])]);
    for (const link of all) {
      if (link.action) expect(link.action).toBe('cookie-settings');
      else expect(ROUTE_VALUES.has(link.route), link.route).toBe(true);
    }
    expect(all.filter((link) => link.action)).toEqual([{ name: 'Cookie settings', action: 'cookie-settings' }]);
  });

  it('links the country guides once one is checked', () => {
    const explore = FooterLinkGroups.find((group) => group.id === 'footer-explore').links.map((link) => link.route);
    expect(explore.includes(routes.COUNTRIES_PAGE_URL)).toBe(HAS_CHECKED_COUNTRY_PAGES);
  });
});

describe('navData', () => {
  const paths = (items) => items.map((item) => item.path ?? item.label);

  it('offers a signed-out visitor the pages, then log in and sign up', () => {
    const items = getNavLinkItemsArray(null);
    expect(paths(items)).toEqual([
      '/',
      ...(HAS_CHECKED_COUNTRY_PAGES ? ['/countries'] : []),
      '/about',
      '/faq',
      '/pricing',
      '/contact',
      '/login',
      '/sign-up',
    ]);
  });

  it('puts a signed-in person’s map first and their account last, with no admin menu', () => {
    const items = getNavLinkItemsArray({ role: 'USER' });
    expect(paths(items).slice(0, 3)).toEqual(['/map', '/challenges', '/']);
    expect(paths(items).at(-1)).toBe('/account');
    expect(paths(items)).not.toContain('Admin');
  });

  it('gives an admin the admin pages, and only a developer the audit log', () => {
    const adminMenu = (role) => getNavLinkItemsArray({ role }).find((item) => item.label === 'Admin').subpages.map((page) => page.path);
    expect(adminMenu('ADMIN')).toEqual(['/admin', '/admin/contact-forms', '/admin/users', '/admin/promo-codes', '/admin/offers', '/admin/themes']);
    expect(adminMenu('DEVELOPER')).toEqual([...adminMenu('ADMIN'), '/admin/events']);
  });
});

describe('countryData', () => {
  it('lists each country once, A to Z, the most chosen ones in their own group', () => {
    expect(new Set(COUNTRIES).size).toBe(COUNTRIES.length);
    const sorted = [...COUNTRIES].sort((a, b) => a.localeCompare(b, 'en'));
    expect(COUNTRIES).toEqual(sorted);
    for (const name of COMMON_COUNTRIES) expect(COUNTRIES).not.toContain(name);
    expect(COMMON_COUNTRIES).toEqual(['United Kingdom', 'United States']);
  });
});

describe('svgIcons and socialMediaData', () => {
  it('draws each icon from a viewBox and its paths, fixed', () => {
    const all = Object.entries(icons);
    expect(all.length).toBe(6);
    for (const [name, icon] of all) {
      expect(icon.viewBox, name).toMatch(/^0 0 \d+ \d+$/);
      expect(icon.paths.length, name).toBeGreaterThan(0);
      for (const d of icon.paths) expect(d, name).toMatch(/^M[\d.]/);
      expect(Object.isFrozen(icon), name).toBe(true);
    }
  });

  it('shows only the social links that have an address (none yet)', () => {
    const anySet = [links.FACEBOOK_URL, links.INSTAGRAM_URL, links.TIKTOK_URL, links.X_URL, links.GOOGLE_BUSINESS_URL].some(Boolean);
    expect(socialMediaLinks.length > 0).toBe(anySet);
    for (const link of socialMediaLinks) expect(link.url).toMatch(/^https:\/\//);
  });
});
