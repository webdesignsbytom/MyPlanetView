import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_STATUSES,
  FACT_FIELDS,
  MONTH_NAMES,
  MONTH_SHORT,
  RATINGS,
  RATING_LABELS,
  RATING_MEANINGS,
  bestMonthsText,
  formatDay,
  formatMonthRuns,
  isCheckedContent,
  monthNumbersText,
  monthRuns,
  monthsRatedText,
} from '@/utils/countries/countryContent';
import { countryContentProblems } from '@/utils/countries/countryContentChecks';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

// A small file that passes every check, for the problems to start from
function validContent() {
  return {
    code: 'ES',
    slug: 'spain',
    status: 'draft',
    lastChecked: null,
    stamp: ['¡Hola!', 'España'],
    summary: 'Sun, cities and long evenings.',
    overview: ['A paragraph.'],
    whenToGo: {
      months: ['good', 'good', 'good', 'best', 'best', 'best', 'good', 'avoid', 'best', 'best', 'good', 'good'],
      seasons: [
        { name: 'Spring', months: [3, 4, 5], text: 'Mild.' },
        { name: 'Summer', months: [6, 7, 8], text: 'Hot.' },
      ],
      weather: 'Varied.',
      festivals: [{ name: 'La Tomatina', when: 'Usually the last Wednesday of August', months: [8], text: 'Tomatoes.' }],
    },
    culture: {
      greetings: 'Two kisses.',
      etiquette: ['Dinner is late.'],
      tipping: 'Round up.',
      dress: 'Smart casual.',
      food: [{ name: 'Paella', text: 'Rice.' }],
      phrases: { language: 'Spanish', items: [{ phrase: 'Hola', meaning: 'Hello' }] },
    },
    facts: {
      wikidata: 'Q29',
      queried: '2026-11-16',
      items: FACT_FIELDS.map((field) => ({ key: field.key, text: 'Something', sources: [{ property: field.properties[0], values: ['Q1'] }] })),
    },
  };
}

describe('the content format', () => {
  it('names the months and ratings', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_SHORT.slice(0, 3)).toEqual(['Jan', 'Feb', 'Mar']);
    expect(RATINGS).toEqual(['best', 'good', 'avoid']);
    for (const rating of RATINGS) {
      expect(RATING_LABELS[rating]).toBeTruthy();
      expect(RATING_MEANINGS[rating]).toBeTruthy();
    }
    expect(CONTENT_STATUSES).toEqual(['draft', 'checked']);
  });

  it('knows a checked page', () => {
    expect(isCheckedContent({ status: 'checked' })).toBe(true);
    expect(isCheckedContent({ status: 'draft' })).toBe(false);
    expect(isCheckedContent(null)).toBe(false);
  });
});

describe('monthRuns', () => {
  const on = (months) => (_, index) => months.includes(index);

  it('finds runs of months in calendar order', () => {
    expect(monthRuns(MONTH_NAMES, on([3, 4, 5, 8, 9]))).toEqual([
      [3, 5],
      [8, 9],
    ]);
  });

  it('keeps a run over the new year as one', () => {
    expect(monthRuns(MONTH_NAMES, on([11, 0, 1, 6]))).toEqual([
      [6, 6],
      [11, 1],
    ]);
  });

  it('gives the whole year, or nothing', () => {
    expect(monthRuns(MONTH_NAMES, () => true)).toEqual([[0, 11]]);
    expect(monthRuns(MONTH_NAMES, () => false)).toEqual([]);
  });
});

describe('the months in words', () => {
  it('writes runs long and short', () => {
    expect(formatMonthRuns([[3, 5], [8, 9]])).toBe('April to June and September to October');
    expect(formatMonthRuns([[3, 5], [8, 9]], { short: true })).toBe('Apr–Jun, Sep–Oct');
    expect(formatMonthRuns([[0, 0], [4, 4], [11, 1]])).toBe('January, May and December to February');
    expect(formatMonthRuns([[0, 11]])).toBe('all year round');
    expect(formatMonthRuns([[0, 11]], { short: true })).toBe('All year');
    expect(formatMonthRuns([])).toBe('');
  });

  it('names the months with a rating', () => {
    const months = validContent().whenToGo.months;
    expect(bestMonthsText(months)).toBe('April to June and September to October');
    expect(monthsRatedText(months, 'avoid')).toBe('August');
    expect(monthsRatedText(months, 'avoid', { short: true })).toBe('Aug');
    expect(bestMonthsText(Array(12).fill('good'))).toBe('');
  });

  it('turns month numbers into words', () => {
    expect(monthNumbersText([12, 1, 2])).toBe('December to February');
    expect(monthNumbersText([3])).toBe('March');
    expect(monthNumbersText([6, 7, 8], { short: true })).toBe('Jun–Aug');
  });

  it('writes a day without Date, the same at build and in the browser', () => {
    expect(formatDay('2026-11-16')).toBe('16 November 2026');
    expect(formatDay('2026-01-05')).toBe('5 January 2026');
    expect(formatDay('16/11/2026')).toBe('');
    expect(formatDay(null)).toBe('');
  });
});

describe('countryContentProblems', () => {
  it('passes a good file', () => {
    expect(countryContentProblems(validContent())).toEqual([]);
  });

  it('refuses what isn’t an object', () => {
    expect(countryContentProblems(null)).toEqual(['not an object']);
    expect(countryContentProblems('spain')).toEqual(['not an object']);
  });

  it('wants a code on the map and its own slug', () => {
    expect(countryContentProblems({ ...validContent(), code: 'ZZ' })).toContain('code "ZZ" isn\'t in utils/map/countries.js');
    expect(countryContentProblems({ ...validContent(), slug: 'espana' })).toContain('slug "espana" should be "spain" (utils/map/countries.js)');
  });

  it('wants a known status, and a checked page dated', () => {
    expect(countryContentProblems({ ...validContent(), status: 'done' })).toContain('status must be one of draft, checked');
    expect(countryContentProblems({ ...validContent(), status: 'checked' })).toContain('a checked page needs lastChecked (YYYY-MM-DD)');
    expect(countryContentProblems({ ...validContent(), status: 'checked', lastChecked: '2026-11-16' })).toEqual([]);
    expect(countryContentProblems({ ...validContent(), lastChecked: 'yesterday' })).toContain('lastChecked must be null or YYYY-MM-DD');
  });

  it('names unknown fields wherever they are', () => {
    const content = validContent();
    content.extra = 1;
    content.whenToGo.bestBeach = 'yes';
    content.culture.music = 'flamenco';
    expect(countryContentProblems(content)).toEqual([
      'top level: unknown field "extra"',
      'whenToGo: unknown field "bestBeach"',
      'culture: unknown field "music"',
    ]);
  });

  it('checks the stamp and the paragraphs', () => {
    expect(countryContentProblems({ ...validContent(), stamp: ['A very long stamp line'] })).toContain('stamp: 1–3 lines of up to 14 characters');
    expect(countryContentProblems({ ...validContent(), stamp: ['a', 'b', 'c', 'd'] })).toContain('stamp: 1–3 lines of up to 14 characters');
    expect(countryContentProblems({ ...validContent(), summary: '  ' })).toContain('summary is missing');
    expect(countryContentProblems({ ...validContent(), overview: ['a', 'b', 'c', 'd', 'e'] })).toContain('overview: 1–4 paragraphs');
  });

  it('checks when to go: twelve ratings, two seasons, festivals and the regions’ own strips', () => {
    const content = validContent();
    content.whenToGo.months = content.whenToGo.months.slice(0, 11);
    content.whenToGo.seasons = [{ name: 'All', months: [13], text: 'x' }];
    content.whenToGo.festivals = [{ name: 'Fiesta', months: [], text: 'x', place: 7 }];
    content.whenToGo.regions = [{ name: 'Canaries', text: 'Warm', months: ['best'] }];
    content.whenToGo.stripLabel = '';
    expect(countryContentProblems(content)).toEqual([
      'whenToGo.stripLabel must be text',
      'whenToGo.months: 12 ratings (best, good, avoid), January first',
      'whenToGo.seasons: needs at least 2 item(s)',
      'whenToGo.festivals[0]: needs name, when and text',
      'whenToGo.festivals[0]: place must be text',
      'whenToGo.festivals[0]: months must be month numbers 1–12',
      'whenToGo.regions[0]: months must be 12 ratings',
    ]);
  });

  it('checks the culture section', () => {
    const content = validContent();
    content.culture = { greetings: 'Hi', etiquette: [], tipping: '', dress: 'Any', food: [{ name: 'Tapas' }], phrases: { items: [{ phrase: 'Hola', meaning: 'Hello', say: 3 }] } };
    expect(countryContentProblems(content)).toEqual([
      'culture.tipping is missing',
      'culture.etiquette: at least one line',
      'culture.food[0]: needs name and text',
      'culture.phrases.language is missing',
      'culture.phrases.items[0]: say must be text',
    ]);
  });

  it('wants one of each practical fact, resting on its own Wikidata properties', () => {
    const content = validContent();
    content.facts.wikidata = '29';
    content.facts.queried = 'today';
    content.facts.items = content.facts.items.filter((item) => item.key !== 'plugs');
    content.facts.items.push({ key: 'currency', text: 'Euro', sources: [] });
    content.facts.items.find((item) => item.key === 'driving').sources = [{ property: 'P38', values: [] }];
    content.facts.items.push({ key: 'weather', text: 'x', sources: [] });
    expect(countryContentProblems(content)).toEqual([
      "facts.wikidata: the country's Wikidata item (Q…)",
      'facts.queried: the date the Wikidata query was run (YYYY-MM-DD)',
      'facts.items: needs one "currency" (found 2)',
      'facts.items: needs one "plugs" (found 0)',
      "facts driving: property P38 isn't one of P1622",
      'facts driving: P38 needs its values',
      'facts.items: unknown key "weather"',
    ]);
  });

  it('takes a fact with no Wikidata statement only with a note saying where it comes from', () => {
    const content = validContent();
    const plugs = content.facts.items.find((item) => item.key === 'plugs');
    plugs.sources = [];
    expect(countryContentProblems(content)).toContain(
      'facts plugs: sources are missing (or, with no Wikidata statement, a note saying where it comes from)',
    );
    plugs.note = 'The territory’s own utility says so.';
    expect(countryContentProblems(content)).toEqual([]);
  });
});

describe('every country guide in src/content/countries', () => {
  const dir = path.resolve(process.cwd(), 'src/content/countries');
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));

  it('is there for every country on the map', () => {
    expect(files.length).toBeGreaterThanOrEqual(226);
  });

  it('passes every check, in a file named by its code', { timeout: 20000 }, () => {
    const problems = [];
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (file !== `${String(content.code).toLowerCase()}.json`) problems.push(`${file}: code ${content.code}`);
      for (const problem of countryContentProblems(content)) problems.push(`${file}: ${problem}`);
      if (!COUNTRY_BY_CODE[content.code]) problems.push(`${file}: not a place on the map`);
    }
    expect(problems).toEqual([]);
  });
});
