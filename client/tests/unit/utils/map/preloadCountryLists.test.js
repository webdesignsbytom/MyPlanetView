// @vitest-environment node
// Every country ticket's lists, ready before it opens (src/utils/map/preloadCountryLists.js):
// one request for them all, the lists' own requests six at a time only if it fails, and the
// empty ones kept empty without asking. The hooks' cache helpers, the panel cache and the API
// are mocked.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { countryListsOf, countryMomentFilters, countryPhotoFilters, preloadCountryLists } from '@/utils/map/preloadCountryLists';
import { photoPageCacheEntry, preloadPhotoPage, rememberEmptyPhotoPage } from '@/hooks/usePhotoPage';
import { momentPageCacheEntry, preloadMomentPage, rememberEmptyMomentPage } from '@/hooks/useMomentPage';
import { getCountryLists } from '@/api/travelApi';
import { prefetchMany } from '@/utils/data/panelCache';
import { PLAIN_COUNTRIES, SPECIAL_PLACES } from '@/utils/map/countries';

vi.mock('@/hooks/usePhotoPage', () => ({
  photoPageCacheEntry: vi.fn((filters) => ({ key: `photos:${filters.country}`, toValue: 'asList' })),
  preloadPhotoPage: vi.fn(),
  rememberEmptyPhotoPage: vi.fn(),
}));
vi.mock('@/hooks/useMomentPage', () => ({
  momentPageCacheEntry: vi.fn((filters) => ({ key: `moments:${filters.country}`, toValue: 'asList' })),
  preloadMomentPage: vi.fn(),
  rememberEmptyMomentPage: vi.fn(),
}));
vi.mock('@/api/travelApi', () => ({ getCountryLists: vi.fn() }));
vi.mock('@/utils/data/panelCache', () => ({ prefetchMany: vi.fn() }));

const SOURCE = { mapId: 'm1' };
const ALL_PLACES = PLAIN_COUNTRIES.length + SPECIAL_PLACES.length;
const countriesOf = (mock) => mock.mock.calls.map(([filters]) => filters.country);

beforeEach(() => {
  for (const fn of [preloadPhotoPage, preloadMomentPage, rememberEmptyPhotoPage, rememberEmptyMomentPage, getCountryLists, prefetchMany]) fn.mockReset();
  prefetchMany.mockResolvedValue(true);
  preloadPhotoPage.mockResolvedValue(undefined);
  preloadMomentPage.mockResolvedValue(undefined);
});

describe('the lists’ filters', () => {
  it('are the country ticket’s own, photos with their screen-sized copies', () => {
    expect(countryPhotoFilters(SOURCE, 'FR')).toEqual({ mapId: 'm1', country: 'FR', limit: 12, display: true });
    expect(countryMomentFilters({ shareCode: 'ABCD' }, 'JP')).toEqual({ shareCode: 'ABCD', country: 'JP' });
  });
});

describe('countryListsOf', () => {
  const owner = { photoCounts: { FR: 3 }, videoCounts: { JP: 1 }, momentCountsByCountry: { IT: 2 }, visits: [] };

  it('says “some” where the map’s counts have photos or videos, else “none”', () => {
    expect(countryListsOf(owner, 'FR').photos).toBe('some');
    expect(countryListsOf(owner, 'JP').photos).toBe('some');
    expect(countryListsOf(owner, 'IT').photos).toBe('none');
  });

  it('says “some” moments only where the map counts them', () => {
    expect(countryListsOf(owner, 'IT').moments).toBe('some');
    expect(countryListsOf(owner, 'FR').moments).toBe('none');
    expect(countryListsOf({ visits: [] }, 'FR').moments).toBe('none');
  });

  it('says “maybe” for a visited place’s photos with no counts (viewers and share links)', () => {
    const viewer = { visits: [{ countryCode: 'FR', status: 'VISITED' }, { countryCode: 'ES', status: 'LIVED' }, { countryCode: 'JP', status: 'WANT_TO_GO' }] };
    expect(countryListsOf(viewer, 'FR').photos).toBe('maybe');
    expect(countryListsOf(viewer, 'ES').photos).toBe('maybe');
    expect(countryListsOf(viewer, 'JP').photos).toBe('none');
    expect(countryListsOf(viewer, 'IT').photos).toBe('none');
  });

  it('counts a zero as none', () => {
    expect(countryListsOf({ photoCounts: { FR: 0 }, momentCountsByCountry: { FR: 0 } }, 'FR')).toEqual({ photos: 'none', moments: 'none' });
  });
});

describe('preloadCountryLists', () => {
  const ownersMap = { photoCounts: { FR: 2, AQ: 1 }, videoCounts: {}, momentCountsByCountry: { IT: 1 }, visits: [], splitUk: false };

  it('asks for every list with something in it in one request', async () => {
    await preloadCountryLists(ownersMap, SOURCE);
    expect(prefetchMany).toHaveBeenCalledTimes(1);
    const [wanted, fetchAll] = prefetchMany.mock.calls[0];
    expect(wanted.map(({ kind, code, key }) => [kind, code, key])).toEqual([
      ['photos', 'FR', 'photos:FR'],
      ['moments', 'IT', 'moments:IT'],
      ['photos', 'AQ', 'photos:AQ'],
    ]);
    expect(photoPageCacheEntry).toHaveBeenCalledWith(countryPhotoFilters(SOURCE, 'FR'));
    expect(momentPageCacheEntry).toHaveBeenCalledWith(countryMomentFilters(SOURCE, 'IT'));

    fetchAll(wanted);
    expect(getCountryLists).toHaveBeenCalledWith(SOURCE, { photos: ['FR', 'AQ'], moments: ['IT'], limit: 12, display: true, momentLimit: 30 });
  });

  it('picks each list’s own part of the reply', async () => {
    await preloadCountryLists(ownersMap, SOURCE);
    const [wanted] = prefetchMany.mock.calls[0];
    const reply = { photos: { FR: { photos: [1] }, AQ: { photos: [2] } }, moments: { IT: { moments: [3] } } };
    expect(wanted.map((item) => item.pick(reply))).toEqual([{ photos: [1] }, { moments: [3] }, { photos: [2] }]);
    expect(wanted[0].pick(null)).toBeUndefined();
  });

  it('keeps every other place’s lists empty at once, without asking', async () => {
    await preloadCountryLists(ownersMap, SOURCE);
    expect(rememberEmptyPhotoPage).toHaveBeenCalledTimes(ALL_PLACES - 2);
    expect(rememberEmptyMomentPage).toHaveBeenCalledTimes(ALL_PLACES - 1);
    expect(countriesOf(rememberEmptyPhotoPage)).not.toContain('FR');
    expect(countriesOf(rememberEmptyMomentPage)).not.toContain('IT');
    expect(rememberEmptyPhotoPage).toHaveBeenCalledWith(countryPhotoFilters(SOURCE, 'DE'));
  });

  it('neither asks for nor empties a visited place’s photos when there are no counts', async () => {
    await preloadCountryLists({ visits: [{ countryCode: 'FR', status: 'VISITED' }] }, { shareCode: 'ABCD' });
    expect(prefetchMany.mock.calls[0][0]).toEqual([]);
    expect(countriesOf(rememberEmptyPhotoPage)).not.toContain('FR');
    expect(rememberEmptyPhotoPage).toHaveBeenCalledTimes(ALL_PLACES - 1);
  });

  it('goes through the UK’s nations on a map that splits it, not the UK', async () => {
    await preloadCountryLists({ ...ownersMap, splitUk: true, photoCounts: { XC: 1 } }, SOURCE);
    expect(prefetchMany.mock.calls[0][0].map((item) => item.code)).toEqual(['IT', 'XC']);
    expect(countriesOf(rememberEmptyMomentPage)).not.toContain('GB');
    expect(countriesOf(rememberEmptyMomentPage)).toContain('XE');
  });

  it('asks for nothing else once the one request has brought them', async () => {
    await preloadCountryLists(ownersMap, SOURCE);
    expect(preloadPhotoPage).not.toHaveBeenCalled();
    expect(preloadMomentPage).not.toHaveBeenCalled();
  });

  it('falls back to each list’s own request when the one request fails', async () => {
    prefetchMany.mockResolvedValue(false);
    await preloadCountryLists(ownersMap, SOURCE);
    expect(countriesOf(preloadPhotoPage)).toEqual(['FR', 'AQ']);
    expect(countriesOf(preloadMomentPage)).toEqual(['IT']);
  });

  it('runs at most six of those at once', async () => {
    prefetchMany.mockResolvedValue(false);
    const photoCounts = Object.fromEntries(PLAIN_COUNTRIES.slice(0, 20).map((c) => [c.code, 1]));
    let running = 0;
    let most = 0;
    preloadPhotoPage.mockImplementation(async () => {
      running += 1;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running -= 1;
    });
    await preloadCountryLists({ photoCounts, visits: [] }, SOURCE);
    expect(preloadPhotoPage).toHaveBeenCalledTimes(20);
    expect(most).toBe(6);
  });

  it('stops when the map page has gone', async () => {
    prefetchMany.mockResolvedValue(false);
    await preloadCountryLists(ownersMap, SOURCE, () => true);
    expect(preloadPhotoPage).not.toHaveBeenCalled();
    expect(preloadMomentPage).not.toHaveBeenCalled();
  });

  it('stops part of the way through when the map page goes then', async () => {
    prefetchMany.mockResolvedValue(false);
    const photoCounts = Object.fromEntries(PLAIN_COUNTRIES.slice(0, 20).map((c) => [c.code, 1]));
    let gone = false;
    preloadPhotoPage.mockImplementation(async () => {
      gone = true;
    });
    await preloadCountryLists({ photoCounts, visits: [] }, SOURCE, () => gone);
    // No worker starts another once it has gone
    expect(preloadPhotoPage.mock.calls.length).toBeLessThan(20);
    expect(preloadPhotoPage.mock.calls.length).toBeLessThanOrEqual(6);
  });
});
