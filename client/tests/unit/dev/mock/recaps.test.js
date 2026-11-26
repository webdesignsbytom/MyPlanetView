import { beforeEach, describe, expect, it } from 'vitest';
import { parseRecapYear, yearRecap } from '@/dev/mock/recaps';
import { HOME_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const home = () => db().maps.find((m) => m.id === HOME_MAP);

describe('parseRecapYear', () => {
  it('takes a year from 1900 to next year', () => {
    const now = new Date('2026-11-23T00:00:00Z');
    expect(parseRecapYear('2025', now)).toBe(2025);
    expect(parseRecapYear('1900', now)).toBe(1900);
    expect(parseRecapYear('2027', now)).toBe(2027);
    for (const bad of ['2028', '1899', '25', 'abcd', '2025.5', null, undefined]) expect(parseRecapYear(bad, now)).toBeNull();
  });
});

describe('yearRecap', () => {
  it('gives the test user’s 2025: France and Italy, 4 photos, 4 stamps, Paris again and the Italian trip, and a moment', () => {
    const recap = yearRecap(home(), 'OWNER', 2025);
    expect(recap.places).toEqual(['FR', 'IT']);
    expect(recap.countries).toBe(2);
    expect(recap.newCountries).toEqual(['IT']);
    expect(recap.photos).toBe(4);
    expect(recap.videos).toBe(0);
    expect(recap.stamps.count).toBe(4);
    expect(recap.trips.map((t) => t.title)).toEqual(['Paris again', 'Italian summer']);
    expect(recap.moments).toBe(1);
    expect(recap.continents).toBe(1);
    expect(recap.topCountries[0]).toEqual({ countryCode: 'IT', photos: 3 });
    expect(recap.highlights.map((h) => h.countryCode)).toEqual(['IT', 'FR']);
    expect(recap.highlights[0].displayUrl).toMatch(/display\.webp$/);
  });

  it('lists the years with something in them, newest first, never a planned trip’s', () => {
    const { years } = yearRecap(home(), 'OWNER', 2025);
    // Venice and Vienna in 2026; Japan, planned for 2027, isn't one
    expect(years[0]).toBe(2026);
    expect(years).toContain(2014);
    expect(years).not.toContain(2027);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it('counts only what the caller may see', () => {
    // The hidden photo of Belém is 2021's, and the hidden party moment is undated
    expect(yearRecap(home(), 'OWNER', 2021).photos - yearRecap(home(), 'VIEWER', 2021).photos).toBe(1);
  });

  it('is empty for a year with nothing in it', () => {
    const recap = yearRecap(home(), 'OWNER', 1950);
    expect(recap).toMatchObject({ places: [], countries: 0, photos: 0, moments: 0, trips: [], stamps: { count: 0, landmarks: [] }, highlights: [] });
  });
});
