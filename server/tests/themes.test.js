import { describe, expect, it } from 'vitest';
import { THEME_LIMITS, isRunning, monthKey, monthStart, nextMonth, parseMonth, parseThemeInput, themeView } from '../src/utils/themes.js';

const NOW = new Date('2026-11-16T12:00:00.000Z');

describe('theme months', () => {
  it('reads YYYY-MM as the first day of the month in UTC, and nothing else', () => {
    expect(parseMonth('2026-11')?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    for (const bad of ['2026-13', '2026-1', '26-11', '2026-11-01', '', null, 202611, '1999-12']) expect(parseMonth(bad), String(bad)).toBeNull();
  });

  it('knows the month a moment falls in, and the next', () => {
    expect(monthStart(new Date('2026-12-31T23:59:59.000Z')).toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(nextMonth(parseMonth('2026-12')).toISOString()).toBe('2027-01-01T00:00:00.000Z');
    expect(monthKey(parseMonth('2027-02'))).toBe('2027-02');
  });

  it('runs a theme for its calendar month only (UTC)', () => {
    const theme = { id: 't', month: parseMonth('2026-11'), title: 'Doors', blurb: null };
    expect(isRunning(theme, NOW)).toBe(true);
    expect(isRunning(theme, new Date('2026-12-01T00:00:00.000Z'))).toBe(false);
    expect(isRunning(theme, new Date('2026-10-31T23:59:59.999Z'))).toBe(false);
    expect(themeView(theme, NOW)).toEqual({
      id: 't',
      month: '2026-11',
      title: 'Doors',
      blurb: null,
      startsAt: '2026-11-01T00:00:00.000Z',
      endsAt: '2026-12-01T00:00:00.000Z',
      running: true,
    });
  });
});

describe('an admin’s theme', () => {
  it('cleans a new theme and allows the current month', () => {
    expect(parseThemeInput({ month: '2026-11', title: '  Street   food ', blurb: '<b>Snacks</b> from stalls' }, { now: NOW })).toEqual({
      ok: true,
      data: { month: parseMonth('2026-11'), title: 'Street food', blurb: 'Snacks from stalls' },
    });
  });

  it('refuses a month that’s over, a missing or long title, and a long blurb', () => {
    expect(parseThemeInput({ month: '2026-10', title: 'Doors' }, { now: NOW })).toEqual({ ok: false, message: 'themeMonthPast' });
    expect(parseThemeInput({ month: '2026-12' }, { now: NOW })).toEqual({ ok: false, message: 'themeInvalid' });
    expect(parseThemeInput({ month: '2026-12', title: 'x'.repeat(THEME_LIMITS.title + 1) }, { now: NOW }).ok).toBe(false);
    expect(parseThemeInput({ month: '2026-12', title: 'Doors', blurb: 'x'.repeat(THEME_LIMITS.blurb + 1) }, { now: NOW }).ok).toBe(false);
    expect(parseThemeInput(null).ok).toBe(false);
  });

  it('checks only what a change sends', () => {
    const existing = { id: 't', month: parseMonth('2026-12'), title: 'Doors' };
    expect(parseThemeInput({ blurb: null }, { existing, now: NOW })).toEqual({ ok: true, data: { blurb: null } });
    expect(parseThemeInput({ title: 'Lost' }, { existing, now: NOW })).toEqual({ ok: true, data: { title: 'Lost' } });
  });
});
