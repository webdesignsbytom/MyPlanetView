import { describe, expect, it } from 'vitest';
import { THEME_IDEAS, suggestThemes } from '../src/utils/themeIdeas.js';
import { THEME_LIMITS, monthKey } from '../src/utils/themes.js';

// The suggested monthly photo themes (26 Nov 2026, the user's wish)
const NOW = new Date('2026-11-26T12:00:00Z');
const theme = (month, title) => ({ month: new Date(`${month}-01T00:00:00Z`), title });
const months = (list) => list.map((t) => monthKey(t.month));

describe('THEME_IDEAS', () => {
  it('are two years of themes, each within the admin form’s limits, no title twice', () => {
    expect(THEME_IDEAS.length).toBeGreaterThanOrEqual(24);
    expect(new Set(THEME_IDEAS.map((idea) => idea.title.toLowerCase())).size).toBe(THEME_IDEAS.length);
    for (const idea of THEME_IDEAS) {
      expect(idea.title.length).toBeGreaterThan(0);
      expect(idea.title.length).toBeLessThanOrEqual(THEME_LIMITS.title);
      expect(idea.blurb.length).toBeLessThanOrEqual(THEME_LIMITS.blurb);
      expect(idea.blurb).toMatch(/\.$/);
    }
  });
});

describe('suggestThemes', () => {
  it('fills this month and the eleven after it, in the list’s order, when none has a theme', () => {
    const out = suggestThemes([], NOW);
    expect(months(out)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09', '2027-10']);
    expect(out.map((t) => t.title)).toEqual(THEME_IDEAS.slice(0, 12).map((idea) => idea.title));
    expect(out[0].blurb).toBe(THEME_IDEAS[0].blurb);
  });

  it('skips the months that have a theme, and the titles used in the year before or ahead', () => {
    const existing = [theme('2026-03', 'Doors'), theme('2026-12', 'Lost'), theme('2027-05', 'Night'), theme('2025-06', 'Signs')];
    const out = suggestThemes(existing, NOW);
    expect(months(out)).not.toContain('2026-12');
    expect(months(out)).not.toContain('2027-05');
    expect(out).toHaveLength(10);
    const titles = out.map((t) => t.title);
    for (const used of ['Doors', 'Lost', 'Night']) expect(titles).not.toContain(used);
    // Signs was used over a year ago, so it's back in
    expect(titles).toContain('Signs');
  });

  it('matches titles whatever their case or spaces', () => {
    expect(suggestThemes([theme('2026-10', '  doors ')], NOW).map((t) => t.title)).not.toContain('Doors');
  });

  it('when the fresh ideas run out, reuses the ones used only in the year before, never one set ahead', () => {
    const ideas = [{ title: 'A', blurb: 'a.' }, { title: 'B', blurb: 'b.' }, { title: 'C', blurb: 'c.' }];
    const existing = [theme('2026-05', 'A'), theme('2027-02', 'B')];
    const out = suggestThemes(existing, NOW, ideas);
    expect(out.map((t) => t.title)).toEqual(['C', 'A']);
    expect(months(out)).toEqual(['2026-11', '2026-12']);
  });

  it('adds nothing when every month ahead has a theme', () => {
    const existing = Array.from({ length: 12 }, (_, i) => ({ month: new Date(Date.UTC(2026, 10 + i, 1)), title: `T${i}` }));
    expect(suggestThemes(existing, NOW)).toEqual([]);
  });
});
