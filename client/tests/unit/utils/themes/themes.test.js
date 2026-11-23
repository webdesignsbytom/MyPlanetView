import { describe, expect, it } from 'vitest';
import {
  THEME_BLURB_MAX,
  THEME_TITLE_MAX,
  addMonths,
  emptyThemeForm,
  monthOf,
  monthsWithoutTheme,
  themeBodyFrom,
  themeFormFrom,
} from '@/utils/themes/themeForm';
import { lastDayLabel, monthLabel, monthThemeLabel, photoCount } from '@/utils/themes/themeWords';
import { THEME_LIMITS, parseThemeInput } from '../../../../../server/src/utils/themes.js';

describe('themeForm', () => {
  it('has the server’s limits', () => {
    expect(THEME_TITLE_MAX).toBe(THEME_LIMITS.title);
    expect(THEME_BLURB_MAX).toBe(THEME_LIMITS.blurb);
  });

  it('names months in UTC and moves them across years', () => {
    expect(monthOf(new Date('2026-11-30T23:30:00Z'))).toBe('2026-11');
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-05', 0)).toBe('2026-05');
  });

  it('starts a form empty, or from a theme', () => {
    expect(emptyThemeForm('2027-01')).toEqual({ month: '2027-01', title: '', blurb: '' });
    expect(emptyThemeForm()).toEqual({ month: '', title: '', blurb: '' });
    expect(themeFormFrom({ month: '2027-01', title: 'Doors', blurb: null })).toEqual({ month: '2027-01', title: 'Doors', blurb: '' });
  });

  it('makes a new theme’s body, tidied, which the server takes', () => {
    const result = themeBodyFrom({ month: ' 2026-12 ', title: '  Worst   weather ', blurb: '  ' }, { thisMonth: '2026-11' });
    expect(result).toEqual({ ok: true, body: { month: '2026-12', title: 'Worst weather', blurb: null } });
    expect(parseThemeInput(result.body, { now: new Date('2026-11-22T00:00:00Z') }).ok).toBe(true);
  });

  it('says what’s wrong with each field', () => {
    expect(themeBodyFrom({ month: '2026-13', title: '', blurb: 'x'.repeat(301) }, { thisMonth: '2026-11' })).toEqual({
      ok: false,
      errors: { month: 'Choose a month (YYYY-MM).', title: 'Give it a title.', blurb: 'At most 300 characters.' },
    });
    expect(themeBodyFrom({ month: '2026-10', title: 'x'.repeat(61), blurb: '' }, { thisMonth: '2026-11' }).errors).toEqual({
      month: 'Choose this month or a later one.',
      title: 'At most 60 characters.',
    });
  });

  it('takes the years the server takes, 2000 to 2999', () => {
    const now = new Date('2026-11-22T00:00:00Z');
    for (const month of ['3000-01', '9999-12']) {
      expect(themeBodyFrom({ month, title: 'Doors', blurb: '' }, { thisMonth: '2026-11' }).errors.month).toBe('Choose a month (YYYY-MM).');
      expect(parseThemeInput({ month, title: 'Doors' }, { now }).ok).toBe(false);
    }
    expect(themeBodyFrom({ month: '2999-12', title: 'Doors', blurb: '' }, { thisMonth: '2026-11' }).ok).toBe(true);
    expect(parseThemeInput({ month: '2999-12', title: 'Doors' }, { now }).ok).toBe(true);
  });

  it('agrees with the server about a month that’s over', () => {
    const now = new Date('2026-11-22T00:00:00Z');
    expect(themeBodyFrom({ month: '2026-10', title: 'Doors', blurb: '' }, { thisMonth: monthOf(now) }).ok).toBe(false);
    expect(parseThemeInput({ month: '2026-10', title: 'Doors' }, { now })).toEqual({ ok: false, message: 'themeMonthPast' });
    expect(themeBodyFrom({ month: '2026-11', title: 'Doors', blurb: '' }, { thisMonth: monthOf(now) }).ok).toBe(true);
    expect(parseThemeInput({ month: '2026-11', title: 'Doors' }, { now }).ok).toBe(true);
  });

  it('sends only what changed, and keeps a past theme’s own month', () => {
    const existing = { month: '2026-10', title: 'Doors', blurb: null };
    expect(themeBodyFrom({ month: '2026-10', title: 'Old doors', blurb: '' }, { existing, thisMonth: '2026-11' })).toEqual({
      ok: true,
      body: { title: 'Old doors' },
    });
    expect(themeBodyFrom({ month: '2026-10', title: 'Doors', blurb: 'Knock' }, { existing, thisMonth: '2026-11' }).body).toEqual({ blurb: 'Knock' });
    expect(themeBodyFrom(themeFormFrom(existing), { existing, thisMonth: '2026-11' })).toEqual({ ok: true, body: {} });
  });

  it('lists the coming months that have no theme', () => {
    const themes = [{ month: '2026-11' }, { month: '2027-01' }];
    expect(monthsWithoutTheme(themes, '2026-11', 4)).toEqual(['2026-12', '2027-02']);
    expect(monthsWithoutTheme([], '2026-11')).toHaveLength(12);
  });
});

describe('themeWords', () => {
  it('names a theme’s month', () => {
    expect(monthLabel('2026-11')).toBe('November 2026');
    expect(monthLabel('2026-13')).toBe('2026-13');
    expect(monthThemeLabel('2027-01')).toBe('January’s theme');
    expect(monthThemeLabel('nonsense')).toBe('A monthly theme');
  });

  it('gives a theme’s last day from when it ends', () => {
    expect(lastDayLabel('2026-12-01T00:00:00.000Z')).toBe('30 November');
    expect(lastDayLabel('2027-03-01T00:00:00Z')).toBe('28 February');
    expect(lastDayLabel('soon')).toBe('');
  });

  it('counts photos', () => {
    expect(photoCount(0)).toBe('No photos');
    expect(photoCount(undefined)).toBe('No photos');
    expect(photoCount(1)).toBe('1 photo');
    expect(photoCount(1200)).toBe('1,200 photos');
  });
});
