import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/travelApi', () => ({ getYearRecap: vi.fn() }));

import { getYearRecap } from '@/api/travelApi';

let recap;
beforeEach(async () => {
  // The session's recaps are kept in the module: each test starts afresh
  vi.resetModules();
  getYearRecap.mockReset();
  recap = await import('@/utils/recap/recap');
});

const year = (extra = {}) => ({
  year: 2025,
  places: ['FR', 'IT'],
  countries: 2,
  newCountries: ['IT'],
  photos: 4,
  videos: 0,
  stamps: { count: 4 },
  trips: [{ id: 't1' }],
  moments: 1,
  ...extra,
});
const empty = () => year({ places: [], countries: 0, newCountries: [], photos: 0, videos: 0, stamps: { count: 0 }, trips: [], moments: 0 });

describe('which year, and when', () => {
  it('shows last year in January, this year otherwise', () => {
    expect(recap.recapYearFor(new Date(2027, 0, 31))).toBe(2026);
    expect(recap.recapYearFor(new Date(2026, 1, 1))).toBe(2026);
    expect(recap.recapYearFor(new Date(2026, 11, 31))).toBe(2026);
  });

  it('offers the recap in December and January only', () => {
    expect(recap.isRecapSeason(new Date(2026, 11, 1))).toBe(true);
    expect(recap.isRecapSeason(new Date(2027, 0, 15))).toBe(true);
    expect(recap.isRecapSeason(new Date(2026, 10, 30))).toBe(false);
    expect(recap.isRecapSeason(new Date(2026, 1, 1))).toBe(false);
  });
});

describe('recapHasAnything and recapSlides', () => {
  it('knows a year with nothing in it', () => {
    expect(recap.recapHasAnything(empty())).toBe(false);
    expect(recap.recapHasAnything(null)).toBe(false);
    expect(recap.recapHasAnything({ ...empty(), videos: 1 })).toBe(true);
    expect(recap.recapHasAnything({ ...empty(), moments: 2 })).toBe(true);
    expect(recap.recapSlides(empty())).toEqual([]);
  });

  it('gives only the slides with something to show, the share card last', () => {
    expect(recap.recapSlides(year())).toEqual(['cover', 'places', 'photos', 'stamps', 'trips', 'share']);
    expect(recap.recapSlides({ ...empty(), videos: 2 })).toEqual(['cover', 'photos', 'share']);
    expect(recap.recapSlides({ ...empty(), moments: 1, stamps: undefined })).toEqual(['cover', 'trips', 'share']);
  });
});

describe('recapCardOptions', () => {
  it('makes the year’s card with three numbers, in the shown design’s colours', () => {
    expect(recap.recapCardOptions(year(), { name: 'Our map', splitUk: true }, { countries: { FR: '#112233' } })).toEqual({
      kicker: 'Our map',
      title: '2025 in travel',
      highlight: ['FR', 'IT'],
      stats: [
        { value: 2, label: 'countries' },
        { value: 1, label: 'new country' },
        { value: 4, label: 'photos' },
      ],
      splitUk: true,
      colours: { FR: '#112233' },
      fileName: 'my-planet-view-2025.png',
      shareText: 'My 2025 in travel: 2 countries.',
    });
  });

  it('fills the numbers with stamps, then trips, when there are fewer', () => {
    const options = recap.recapCardOptions(year({ countries: 1, newCountries: [], photos: 0, stamps: { count: 1 }, trips: [{}, {}] }), { name: 'M' });
    expect(options.stats).toEqual([
      { value: 1, label: 'country' },
      { value: 1, label: 'landmark' },
      { value: 2, label: 'trips' },
    ]);
    expect(options).toMatchObject({ colours: null, splitUk: false, shareText: 'My 2025 in travel: 1 country.' });
  });
});

describe('loadYearRecap', () => {
  it('asks once per map and year in a session', async () => {
    getYearRecap.mockResolvedValue({ recap: year() });
    const first = await recap.loadYearRecap('m1', 2025);
    const again = await recap.loadYearRecap('m1', 2025);
    expect(first).toEqual(year());
    expect(again).toBe(first);
    expect(getYearRecap).toHaveBeenCalledTimes(1);
    await recap.loadYearRecap('m1', 2024);
    await recap.loadYearRecap('m2', 2025);
    expect(getYearRecap).toHaveBeenCalledTimes(3);
  });

  it('asks again after a failure', async () => {
    getYearRecap.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ recap: year() });
    await expect(recap.loadYearRecap('m1', 2025)).rejects.toThrow('offline');
    await expect(recap.loadYearRecap('m1', 2025)).resolves.toEqual(year());
    expect(getYearRecap).toHaveBeenCalledTimes(2);
  });
});
