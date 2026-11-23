import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { countriesIndexMeta, countryPageMeta, nameInSentence } from '@/utils/countries/countryMeta';
import { COUNTRY_PAGES, COUNTRY_ROUTES, HAS_CHECKED_COUNTRY_PAGES, HAS_COUNTRY_PAGES, loadCountryPage } from '@/utils/countries/countryPages';
import { COUNTRIES_SECTION, countryRoutesFor } from '@/utils/countries/countryRoutes';
import { countriesIndexSchema, countryPageSchema } from '@/utils/countries/countrySchema';
import { festivalGuidePhoto, guidePhoto, landmarkGuidePhoto } from '@/utils/countries/guidePhotos';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { MAX_DESCRIPTION, MAX_TITLE, descriptionProblems } from '@/utils/seo/metaText';

const months = (best) => Array.from({ length: 12 }, (_, i) => (best.includes(i) ? 'best' : 'good'));

describe('nameInSentence', () => {
  it('puts "the" before the names that take it', () => {
    expect(nameInSentence('United States')).toBe('the United States');
    expect(nameInSentence('Netherlands')).toBe('the Netherlands');
    expect(nameInSentence('Philippines')).toBe('the Philippines');
    expect(nameInSentence('Dominican Republic')).toBe('the Dominican Republic');
    expect(nameInSentence('Republic of the Congo')).toBe('the Republic of the Congo');
    expect(nameInSentence('Cayman Islands')).toBe('the Cayman Islands');
    expect(nameInSentence('United Arab Emirates')).toBe('the United Arab Emirates');
  });

  it('leaves the others alone', () => {
    for (const name of ['Spain', 'France', 'Japan', 'Iceland']) expect(nameInSentence(name)).toBe(name);
  });
});

describe('countryPageMeta', () => {
  const content = { slug: 'spain', summary: 'Sun, cities and tapas, from the Pyrenees to the Costa del Sol.', whenToGo: { months: months([3, 4, 5, 8, 9]) } };

  it('opens the description with the best months, then the summary', () => {
    const meta = countryPageMeta(content, 'Spain');
    expect(meta.pageName).toBe('Spain');
    expect(meta.path).toBe('/countries/spain');
    expect(meta.title).toBe('Spain: Best Time to Visit and Local Customs | My Planet View');
    expect(meta.desc.startsWith('The best months to visit Spain are April to June and September to October. Sun, cities')).toBe(true);
    expect(descriptionProblems(meta.desc)).toEqual([]);
  });

  it('adds a last sentence when the pair is too short', () => {
    const meta = countryPageMeta({ ...content, summary: 'Sun and tapas.' }, 'Spain');
    expect(meta.desc).toBe('The best months to visit Spain are April to June and September to October. Sun and tapas. Festivals, customs and tipping are covered too.');
  });

  it('says what the page covers when no month is best', () => {
    const meta = countryPageMeta({ ...content, whenToGo: { months: Array(12).fill('good') } }, 'Netherlands');
    expect(meta.desc.startsWith('When to go to the Netherlands, its festivals and local customs.')).toBe(true);
  });

  it('shortens the title for a long name rather than cutting it', () => {
    const meta = countryPageMeta({ ...content, slug: 'saint-vincent-and-the-grenadines' }, 'Saint Vincent and the Grenadines');
    expect(meta.title.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(meta.title.startsWith('Saint Vincent and the Grenadines: Best Time to Visit')).toBe(true);
  });

  it('keeps a too-long description whole, for check-meta to name', () => {
    const meta = countryPageMeta({ ...content, summary: 'x '.repeat(100).trim() }, 'Spain');
    expect(meta.desc.length).toBeGreaterThan(MAX_DESCRIPTION);
    expect(meta.desc.endsWith('x')).toBe(true);
  });

  it('gives every checked guide a title and description within the limits', { timeout: 20000 }, () => {
    const dir = path.resolve(process.cwd(), 'src/content/countries');
    const problems = [];
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
      const guide = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (guide.status !== 'checked') continue;
      const meta = countryPageMeta(guide, COUNTRY_BY_CODE[guide.code].name);
      if (meta.title.length > MAX_TITLE) problems.push(`${file}: title ${meta.title.length}`);
      for (const problem of descriptionProblems(meta.desc)) problems.push(`${file}: ${problem}`);
    }
    expect(problems).toEqual([]);
  });
});

describe('countriesIndexMeta', () => {
  it('lists the guides by name within the limits', () => {
    const meta = countriesIndexMeta(['Australia', 'Canada', 'Germany', 'Japan', 'Spain']);
    expect(meta.pageName).toBe('Countries');
    expect(meta.path).toBe('/countries');
    expect(meta.title.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(meta.desc).toContain('Guides include Australia');
    expect(descriptionProblems(meta.desc)).toEqual([]);
  });
});

describe('countryRoutesFor', () => {
  it('gives the index and a page per guide, or nothing at all', () => {
    expect(countryRoutesFor([])).toEqual([]);
    expect(countryRoutesFor([{ slug: 'spain' }, { slug: 'japan' }])).toEqual(['/countries', '/countries/spain', '/countries/japan']);
    expect(COUNTRIES_SECTION).toEqual({ name: 'Countries', href: '/countries' });
  });
});

describe('countryPages (the virtual module)', () => {
  it('routes every page it has', () => {
    expect(HAS_COUNTRY_PAGES).toBe(COUNTRY_PAGES.length > 0);
    expect(COUNTRY_ROUTES).toEqual(countryRoutesFor(COUNTRY_PAGES));
    expect(HAS_CHECKED_COUNTRY_PAGES).toBe(COUNTRY_PAGES.some((page) => page.status === 'checked'));
    for (const page of COUNTRY_PAGES) expect(COUNTRY_BY_CODE[page.code].slug).toBe(page.slug);
  });

  it('has the checked guides, so the section is linked', () => {
    expect(HAS_CHECKED_COUNTRY_PAGES).toBe(true);
  });

  it('loads a page’s whole content by its slug', async () => {
    const first = COUNTRY_PAGES.find((page) => page.status === 'checked');
    const page = await loadCountryPage(first.slug);
    expect(page.code).toBe(first.code);
    expect(page.whenToGo.months).toHaveLength(12);
  });
});

describe('countrySchema', () => {
  const meta = { path: '/countries/spain', title: 'Spain | My Planet View', desc: 'About Spain.' };
  const page = { name: 'Spain', slug: 'spain', lastChecked: '2026-11-16', facts: { wikidata: 'Q29' } };

  it('describes a guide as a page about the country, reviewed on its check', () => {
    expect(countryPageSchema(page, meta)).toMatchObject({
      '@type': 'WebPage',
      url: 'https://myplanetview.com/countries/spain',
      name: meta.title,
      description: meta.desc,
      inLanguage: 'en-GB',
      lastReviewed: '2026-11-16',
      about: { '@type': 'Country', name: 'Spain', sameAs: 'https://www.wikidata.org/wiki/Q29' },
    });
  });

  it('claims no review date for an unchecked page', () => {
    expect(countryPageSchema({ ...page, lastChecked: null }, meta)).not.toHaveProperty('lastReviewed');
  });

  it('lists the guides on the index in the order shown', () => {
    const schema = countriesIndexSchema([page, { name: 'Japan', slug: 'japan' }], { path: '/countries', title: 'Guides', desc: 'All.' });
    expect(schema['@type']).toBe('CollectionPage');
    expect(schema.mainEntity.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, url: 'https://myplanetview.com/countries/spain', name: 'Spain' },
      { '@type': 'ListItem', position: 2, url: 'https://myplanetview.com/countries/japan', name: 'Japan' },
    ]);
  });
});

describe('guidePhotos', () => {
  const photo = { width: 480, height: 320, author: 'Jo Bloggs', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0', file: 'Alhambra at dusk (2).jpg' };

  it('gives a photo’s two files, its size and its credit, linked to its Commons page', () => {
    const shown = guidePhoto('landmarkPhotos', 'alhambra', photo);
    expect(shown.avif.endsWith('landmarkPhotos/alhambra-480.avif')).toBe(true);
    expect(shown.webp.endsWith('landmarkPhotos/alhambra-480.webp')).toBe(true);
    expect(shown).toMatchObject({ width: 480, height: 320, author: 'Jo Bloggs', licence: 'CC BY-SA 4.0', licenceUrl: photo.licenceUrl });
    expect(shown.source).toBe('https://commons.wikimedia.org/wiki/File:Alhambra_at_dusk_(2).jpg');
  });

  it('is null without a photo', () => {
    expect(guidePhoto('landmarkPhotos', 'x', null)).toBeNull();
    expect(landmarkGuidePhoto({ slug: 'x' })).toBeNull();
  });

  it('keeps landmarks and festivals in their own folders', () => {
    expect(landmarkGuidePhoto({ slug: 'alhambra', photo }).webp).toContain('landmarkPhotos/alhambra-480');
    expect(festivalGuidePhoto({ key: 'es-la-tomatina', photo }).webp).toContain('festivalPhotos/es-la-tomatina-480');
  });
});
