import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MONTH_LABELS,
  MONTH_MIN_COUNTRIES,
  MONTH_SLUGS,
  isMonthPublishable,
  monthContentProblems,
  monthPicks,
} from '@/utils/months/monthContent';
import { monthPageMeta } from '@/utils/months/monthMeta';
import { CHECKED_MONTH_PAGES, HAS_MONTH_PAGES, MONTH_PAGES, loadMonthPage } from '@/utils/months/monthPages';
import { monthPageSchema } from '@/utils/months/monthSchema';
import { MAX_DESCRIPTION, MAX_TITLE } from '@/utils/seo/metaText';

const valid = () => ({ month: 6, slug: 'june', status: 'draft', lastChecked: null, summary: 'June is summer up north.', intro: ['A paragraph.'] });
const months = (rated) => Array.from({ length: 12 }, (_, i) => rated[i] ?? 'avoid');
const guide = (code, name, rated, extra = {}) => ({ code, slug: name.toLowerCase(), name, status: 'checked', whenToGo: { months: months(rated), ...extra } });

describe('monthContentProblems', () => {
  it('passes a good file', () => {
    expect(monthContentProblems(valid())).toEqual([]);
    expect(monthContentProblems({ ...valid(), status: 'checked', lastChecked: '2026-11-20' })).toEqual([]);
  });

  it('refuses what isn’t an object', () => {
    for (const value of [null, 'june', []]) expect(monthContentProblems(value)).toEqual(['not an object']);
  });

  it('names each problem', () => {
    expect(monthContentProblems({ ...valid(), month: 13, extra: true })).toEqual(['unknown field "extra"', 'month: 1 to 12']);
    expect(monthContentProblems({ ...valid(), slug: 'juni' })).toEqual(['slug: should be "june"']);
    expect(monthContentProblems({ ...valid(), status: 'done' })).toEqual(['status: "draft" or "checked"']);
    expect(monthContentProblems({ ...valid(), status: 'checked' })).toEqual(['lastChecked: a date (YYYY-MM-DD) once checked']);
    expect(monthContentProblems({ ...valid(), lastChecked: 'soon' })).toEqual(['lastChecked: a date or null']);
    expect(monthContentProblems({ ...valid(), summary: ' ', intro: [] })).toEqual(['summary: one sentence', 'intro: 1 to 4 paragraphs']);
    expect(monthContentProblems({ ...valid(), intro: ['a', 'b', 'c', 'd', 'e'] })).toEqual(['intro: 1 to 4 paragraphs']);
  });

  it('names the months', () => {
    expect(MONTH_SLUGS[0]).toBe('january');
    expect(MONTH_LABELS[11]).toBe('December');
    expect(MONTH_MIN_COUNTRIES).toBe(3);
  });
});

describe('monthPicks', () => {
  const spain = guide('ES', 'Spain', { 5: 'best' }, {
    seasons: [{ name: 'Summer', months: [6, 7, 8], text: 'Hot and bright.' }],
    weather: 'Mostly dry.',
    festivals: [
      { name: 'San Fermín', when: 'Usually 6–14 July', months: [7], text: 'x' },
      { name: 'Corpus', when: 'Usually June', months: [6], text: 'x', place: 'Toledo' },
    ],
  });
  const italy = guide('IT', 'Italy', { 5: 'good' }, { weather: 'Warm.' });
  const austria = guide('AT', 'Austria', { 5: 'best' }, { weather: 'Fresh.' });
  const usa = guide('US', 'United States', { 5: 'avoid' }, {
    regions: [
      { name: 'Alaska', text: 'Long days.', months: months({ 5: 'best' }) },
      { name: 'Florida', text: 'Storms.', months: months({ 5: 'avoid' }) },
    ],
  });

  it('lists the countries at their best, with the season’s line and festivals, then the good ones, each A to Z', () => {
    const picks = monthPicks(6, [spain, italy, austria, usa]);
    expect(picks.best.map((pick) => pick.name)).toEqual(['Austria', 'Spain']);
    expect(picks.best[1]).toEqual({
      code: 'ES', slug: 'spain', name: 'Spain', status: 'checked', season: 'Hot and bright.',
      festivals: [{ name: 'Corpus', when: 'Usually June', place: 'Toledo' }],
    });
    expect(picks.best[0].season).toBe('Fresh.');
    expect(picks.good).toEqual([{ code: 'IT', slug: 'italy', name: 'Italy', status: 'checked', season: 'Warm.' }]);
  });

  it('adds the regions at their best where the country isn’t', () => {
    expect(monthPicks(6, [spain, usa]).regions).toEqual([
      { code: 'US', slug: 'united states', name: 'United States', status: 'checked', region: 'Alaska', text: 'Long days.' },
    ]);
    const bestUsa = guide('US', 'United States', { 5: 'best' }, { regions: usa.whenToGo.regions });
    expect(monthPicks(6, [bestUsa]).regions).toEqual([]);
  });

  it('is a page only with enough countries at their best or good', () => {
    expect(isMonthPublishable(monthPicks(6, [spain, italy, austria]))).toBe(true);
    expect(isMonthPublishable(monthPicks(6, [spain, italy, usa]))).toBe(false);
    expect(monthPicks(1, [])).toEqual({ best: [], good: [], regions: [] });
  });
});

describe('monthPageMeta', () => {
  it('names the month and its countries within the limits', () => {
    const meta = monthPageMeta(valid(), { bestNames: ['Austria', 'Spain'], goodNames: ['Italy'] });
    expect(meta.pageName).toBe('Where to go in June');
    expect(meta.path).toBe('/where-to-go/june');
    // The brand would take it past 60 characters, so it's left off
    expect(meta.title).toBe('Where to Go in June: Countries at Their Best');
    expect(meta.title.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(meta.desc).toContain('At their best or good in June: Austria, Spain and Italy.');
    expect(meta.desc.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it('adds a line when the description is short, and leaves out names that don’t fit', () => {
    const short = monthPageMeta(valid(), { bestNames: ['Spain'] });
    expect(short.desc.endsWith('Each links to its guide, with the weather, festivals and customs.')).toBe(true);
    const names = Array.from({ length: 30 }, (_, i) => `Country number ${i}`);
    const long = monthPageMeta(valid(), { bestNames: names });
    expect(long.desc.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(long.desc.endsWith('.')).toBe(true);
  });
});

describe('monthPageSchema', () => {
  const page = { lastChecked: '2026-11-20', picks: { best: [{ name: 'Spain', slug: 'spain' }], good: [{ name: 'Italy', slug: 'italy' }] } };
  const meta = { path: '/where-to-go/june', title: 'June', desc: 'Where to go.' };

  it('lists the guides in the order shown, reviewed on the month’s check', () => {
    const schema = monthPageSchema(page, meta);
    expect(schema['@type']).toBe('CollectionPage');
    expect(schema.url).toBe('https://myplanetview.com/where-to-go/june');
    expect(schema.mainEntity.itemListElement.map((item) => item.url)).toEqual([
      'https://myplanetview.com/countries/spain',
      'https://myplanetview.com/countries/italy',
    ]);
    expect(schema.lastReviewed).toBe('2026-11-20');
    expect(monthPageSchema({ ...page, lastChecked: null }, meta)).not.toHaveProperty('lastReviewed');
  });
});

describe('monthPages (the virtual module) and the month files', () => {
  it('lists each page once, and the checked ones apart', () => {
    expect(HAS_MONTH_PAGES).toBe(MONTH_PAGES.length > 0);
    expect(CHECKED_MONTH_PAGES).toEqual(MONTH_PAGES.filter((page) => page.status === 'checked'));
    for (const page of MONTH_PAGES) expect(MONTH_SLUGS[page.month - 1]).toBe(page.slug);
  });

  it('loads a page with its picks, enough to stand alone', async () => {
    if (!MONTH_PAGES.length) return;
    const page = await loadMonthPage(MONTH_PAGES[0].slug);
    expect(page.slug).toBe(MONTH_PAGES[0].slug);
    expect(isMonthPublishable(page.picks)).toBe(true);
  });

  it('has a file for every month, each passing every check', () => {
    const dir = path.resolve(process.cwd(), 'src/content/months');
    const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
    expect(files.sort()).toEqual(MONTH_SLUGS.map((slug) => `${slug}.json`).sort());
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      expect(monthContentProblems(content), file).toEqual([]);
      expect(`${content.slug}.json`).toBe(file);
    }
  });
});
