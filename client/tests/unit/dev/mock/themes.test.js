import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_THEMES,
  THEME_LIMITS,
  addMonths,
  ensureThemes,
  exampleThemeEntries,
  exampleThemes,
  monthOf,
  parseThemeInput,
  photoThemes,
  themeId,
  themeView,
} from '@/dev/mock/themes';
import * as server from '../../../../../server/src/utils/themes.js';

const now = new Date('2026-11-23T12:00:00Z');

describe('months', () => {
  it('names a month and moves through the year', () => {
    expect(monthOf(now)).toBe('2026-11');
    expect(addMonths('2026-11', 1)).toBe('2026-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(themeId('2026-11')).toBe('theme-2026-11');
  });

  it('keeps the server’s limits', () => {
    for (const key of ['title', 'blurb', 'entriesPerMap', 'recent']) expect(THEME_LIMITS[key]).toBe(server.THEME_LIMITS[key]);
  });
});

describe('themeView', () => {
  it('sends a theme as the server does', () => {
    for (const month of ['2026-10', '2026-11', '2026-12']) {
      const theme = { id: themeId(month), month, title: 'Doors', blurb: null };
      expect(themeView(theme, now)).toEqual(server.themeView({ ...theme, month: new Date(`${month}-01T00:00:00Z`) }, now));
    }
    expect(themeView({ id: 'x', month: '2026-11', title: 'Doors' }, now)).toMatchObject({
      startsAt: '2026-11-01T00:00:00.000Z',
      endsAt: '2026-12-01T00:00:00.000Z',
      running: true,
    });
  });
});

describe('the example year', () => {
  it('runs from last month to ten months on, so one is always running', () => {
    const themes = exampleThemes(now);
    expect(themes).toHaveLength(EXAMPLE_THEMES.length);
    expect(themes.map((t) => t.month).slice(0, 3)).toEqual(['2026-10', '2026-11', '2026-12']);
    expect(themes[0]).toMatchObject({ id: 'theme-2026-10', title: 'Doors' });
    expect(themes[1].title).toBe('Worst weather');
  });

  it('enters the seed’s photos in this month’s theme and last month’s', () => {
    const entries = exampleThemeEntries(now, { mapId: 'm', userId: 'u', current: ['a', 'b'], last: ['c'] });
    expect(entries.map((e) => [e.themeId, e.photoId])).toEqual([
      ['theme-2026-11', 'a'],
      ['theme-2026-11', 'b'],
      ['theme-2026-10', 'c'],
    ]);
    expect(entries.every((e) => e.enteredAt < now.toISOString())).toBe(true);
  });

  it('gives an older store the months it lacks, and nothing it has', () => {
    const db = { themes: [{ id: 'mine', month: '2026-11', title: 'Mine' }] };
    ensureThemes(db, now);
    expect(db.themeEntries).toEqual([]);
    expect(db.themes.filter((t) => t.month === '2026-11').map((t) => t.id)).toEqual(['mine']);
    expect(db.themes).toHaveLength(EXAMPLE_THEMES.length);
    const bare = {};
    ensureThemes(bare, now);
    expect(bare.themes).toHaveLength(EXAMPLE_THEMES.length);
  });
});

describe('parseThemeInput', () => {
  it('reads an admin’s theme, cleaned', () => {
    expect(parseThemeInput({ month: '2026-12', title: ' <i>Night</i>  owls ', blurb: ' After dark ' }, { now })).toEqual({
      ok: true,
      data: { month: '2026-12', title: 'Night owls', blurb: 'After dark' },
    });
    expect(parseThemeInput({ month: '2026-11', title: 'This month' }, { now }).data.blurb).toBeNull();
  });

  it('refuses what the server refuses', () => {
    const bodies = [
      null,
      [],
      { month: '2026-13', title: 'x' },
      { month: '1999-12', title: 'x' },
      { month: '2026-10', title: 'x' },
      { month: '2026-12', title: '' },
      { month: '2026-12', title: 'x'.repeat(61) },
      { month: '2026-12', title: 'x', blurb: 5 },
      { month: '2026-12', title: 'x', blurb: 'x'.repeat(301) },
    ];
    for (const body of bodies) {
      const mock = parseThemeInput(body, { now });
      const real = server.parseThemeInput(body, { now });
      expect(mock.ok).toBe(real.ok);
      expect(real.message.toLowerCase()).toBe(`theme${mock.message}`.toLowerCase());
    }
  });

  it('checks only what a change sends', () => {
    expect(parseThemeInput({ title: 'New' }, { existing: { month: '2020-01' }, now })).toEqual({ ok: true, data: { title: 'New' } });
  });
});

describe('photoThemes', () => {
  it('lists a photo’s themes, newest month first', () => {
    const db = {
      themes: exampleThemes(now),
      themeEntries: [
        { themeId: 'theme-2026-10', photoId: 'p' },
        { themeId: 'theme-2026-11', photoId: 'p' },
        { themeId: 'theme-2026-11', photoId: 'q' },
      ],
    };
    expect(photoThemes(db, 'p').map((t) => t.month)).toEqual(['2026-11', '2026-10']);
    expect(photoThemes(db, 'none')).toEqual([]);
    expect(photoThemes({}, 'p')).toEqual([]);
  });
});
