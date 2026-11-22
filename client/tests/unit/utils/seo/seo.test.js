import { describe, expect, it } from 'vitest';
import { buildBreadcrumbLd, crumbFor } from '@/utils/seo/breadcrumbs';
import getCanonical from '@/utils/seo/getCanonical';
import { MAX_DESCRIPTION, MAX_TITLE, MIN_DESCRIPTION, descriptionProblems, listDescription, metaTitle } from '@/utils/seo/metaText';
import {
  absoluteUrl,
  businessAddress,
  businessEntity,
  businessRef,
  collectionPageSchema,
  compact,
  isoDate,
  pageSchema,
  websiteEntity,
  websiteRef,
} from '@/utils/seo/schema';
import { helmetData } from '@/utils/data/helmetData';

const SITE = 'https://myplanetview.com';

describe('breadcrumbs', () => {
  it('names a crumb the way its page names itself', () => {
    expect(crumbFor('/about')).toEqual({ name: 'About', href: '/about' });
    expect(crumbFor('/nowhere')).toEqual({ name: undefined, href: '/nowhere' });
  });

  it('builds the BreadcrumbList, numbered from 1', () => {
    expect(buildBreadcrumbLd({ baseUrl: SITE, items: [crumbFor('/'), crumbFor('/faq')] })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${SITE}/faq` },
      ],
    });
  });
});

describe('getCanonical', () => {
  it('gives the page’s one address, with no trailing or doubled slashes', () => {
    expect(getCanonical()).toBe(`${SITE}/`);
    expect(getCanonical('')).toBe(`${SITE}/`);
    expect(getCanonical('/')).toBe(`${SITE}/`);
    expect(getCanonical('about')).toBe(`${SITE}/about`);
    expect(getCanonical('/about/')).toBe(`${SITE}/about`);
    expect(getCanonical('//countries//japan//')).toBe(`${SITE}/countries/japan`);
  });
});

describe('metaTitle', () => {
  it('adds the brand when it fits', () => {
    expect(metaTitle('About', 'My Planet View')).toBe('About | My Planet View');
    expect(metaTitle('  About  ', '')).toBe('About');
  });

  it('drops the brand when it doesn’t fit, and cuts a long name on a word', () => {
    const name = 'Japan: Best Time to Visit and Local Customs for Travellers';
    expect(metaTitle(name, 'My Planet View')).toBe(name);
    const long = `${name} and much more besides`;
    const title = metaTitle(long, 'My Planet View');
    expect(title.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(long.startsWith(title)).toBe(true);
    expect(long[title.length]).toBe(' ');
    expect(metaTitle('x'.repeat(70))).toBe('x'.repeat(60));
  });
});

describe('listDescription and descriptionProblems', () => {
  it('names as many whole names as fit', () => {
    expect(listDescription('Guides to the world.', ['Japan', 'Peru', 'Chile'])).toBe('Guides to the world. Posts include Japan, Peru and Chile.');
    expect(listDescription('Guides.', ['Japan'], { prefix: 'See' })).toBe('Guides. See Japan.');
    const lead = 'a'.repeat(130);
    expect(listDescription(lead, ['Japan', 'Peru', 'a much longer name'])).toBe(`${lead} Posts include Japan.`);
    expect(listDescription('a'.repeat(150), ['Japan'])).toBe('a'.repeat(150));
    expect(listDescription(' Lead ', [])).toBe('Lead');
  });

  it('finds what’s wrong with a description', () => {
    expect(descriptionProblems('a'.repeat(MIN_DESCRIPTION))).toEqual([]);
    expect(descriptionProblems('short')).toEqual(['under 120 characters (5)']);
    expect(descriptionProblems('a'.repeat(MAX_DESCRIPTION + 1))).toEqual(['over 156 characters (157)']);
    expect(descriptionProblems(`${'a'.repeat(130)}...`)).toEqual(['ends with an ellipsis']);
    expect(descriptionProblems(`${'a'.repeat(130)}… `)).toEqual(['ends with an ellipsis']);
    expect(descriptionProblems(undefined)).toEqual(['under 120 characters (0)']);
  });
});

describe('structured data', () => {
  it('drops empty facts', () => {
    expect(compact({ a: 1, b: '', c: null, d: undefined, e: [], f: [0], g: 0, h: false })).toEqual({ a: 1, f: [0], g: 0, h: false });
  });

  it('makes site addresses absolute, and refuses others', () => {
    expect(absoluteUrl('/brand/logo.png')).toBe(`${SITE}/brand/logo.png`);
    expect(absoluteUrl('https://cdn.example/x.jpg')).toBe('https://cdn.example/x.jpg');
    expect(absoluteUrl('HTTP://x.example')).toBe('HTTP://x.example');
    expect(absoluteUrl('//evil.example/x')).toBeUndefined();
    expect(absoluteUrl('relative.png')).toBeUndefined();
    expect(absoluteUrl('')).toBeUndefined();
    expect(absoluteUrl(5)).toBeUndefined();
  });

  it('writes dates as ISO strings, or nothing', () => {
    expect(isoDate('2026-11-16')).toBe('2026-11-16T00:00:00.000Z');
    expect(isoDate(new Date('2026-11-16T10:00:00Z'))).toBe('2026-11-16T10:00:00.000Z');
    expect(isoDate('not a date')).toBeUndefined();
    expect(isoDate(null)).toBeUndefined();
  });

  it('names the business and the site the same way everywhere', () => {
    expect(businessRef).toMatchObject({ '@type': 'Organization', '@id': `${SITE}/#org`, name: 'My Planet View', url: SITE });
    expect(websiteRef).toEqual({ '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: 'My Planet View' });
    expect(websiteEntity).toMatchObject({ '@context': 'https://schema.org', inLanguage: 'en-GB', publisher: businessRef });
  });

  it('describes the business with no blank facts', () => {
    expect(businessAddress).toMatchObject({ '@type': 'PostalAddress', addressCountry: 'GB' });
    expect(businessAddress.streetAddress).not.toMatch(/, $/);
    expect(businessEntity.description).toBe(helmetData['/'].desc);
    expect(businessEntity).not.toHaveProperty('areaServed');
    expect(businessEntity.contactPoint).toMatchObject({ '@type': 'ContactPoint', availableLanguage: ['English'] });
    const blanks = Object.values(businessEntity).filter((v) => v === null || v === '' || (Array.isArray(v) && !v.length));
    expect(blanks).toEqual([]);
  });

  it('lists a collection page’s items in the order shown', () => {
    const schema = collectionPageSchema({
      path: '/countries/',
      name: 'Countries',
      description: 'Guides',
      items: [
        { path: '/countries/japan', name: 'Japan' },
        { path: 'countries/peru', name: 'Peru' },
      ],
    });
    expect(schema).toMatchObject({ '@type': 'CollectionPage', url: `${SITE}/countries`, isPartOf: websiteRef });
    expect(schema.mainEntity.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, url: `${SITE}/countries/japan`, name: 'Japan' },
      { '@type': 'ListItem', position: 2, url: `${SITE}/countries/peru`, name: 'Peru' },
    ]);
  });

  it('describes a page from its head’s own entry', () => {
    const page = helmetData['/about'];
    expect(pageSchema('/about')).toEqual(
      compact({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: `${SITE}/about`,
        name: page.title || metaTitle(page.pageName, 'My Planet View'),
        description: page.desc,
        inLanguage: 'en-GB',
        isPartOf: websiteRef,
      }),
    );
    expect(pageSchema('/faq', { type: 'FAQPage', mainEntity: [] })).toMatchObject({ '@type': 'FAQPage' });
    expect(pageSchema('/faq', { type: 'FAQPage', mainEntity: [] })).not.toHaveProperty('mainEntity');
  });
});
