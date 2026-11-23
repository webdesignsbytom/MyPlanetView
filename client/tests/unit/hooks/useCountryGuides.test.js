import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { loadCountryIndex } from '@/utils/countries/countryPages';

vi.mock('@/utils/countries/countryPages', () => ({
  COUNTRY_PAGES: [{ code: 'FR' }, { code: 'JP' }, { code: 'GB' }, { code: 'PE' }],
  loadCountryIndex: vi.fn(),
}));

const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, rating: 'good' }));
const ROWS = [
  { code: 'FR', slug: 'france', months },
  { code: 'JP', slug: 'japan', months },
  { code: 'GB', slug: 'united-kingdom', months },
  // A guide without its twelve months has no "When to go"
  { code: 'PE', slug: 'peru', months: months.slice(0, 6) },
];

// The index is kept for the session (a module variable): a fresh module each test
let useCountryGuides;
beforeEach(async () => {
  vi.resetAllMocks();
  loadCountryIndex.mockResolvedValue(ROWS);
  vi.resetModules();
  ({ default: useCountryGuides } = await import('@/hooks/useCountryGuides'));
});

describe('useCountryGuides', () => {
  it('gives the guides in the order asked, leaving out countries with none', async () => {
    const { result } = renderHook(() => useCountryGuides(['JP', 'BR', 'FR']));
    expect(result.current).toEqual([]);
    await waitFor(() => expect(result.current.map((g) => g.code)).toEqual(['JP', 'FR']));
  });

  it('takes a UK nation’s guide as the UK’s, once', async () => {
    const { result } = renderHook(() => useCountryGuides(['XE', 'XC']));
    await waitFor(() => expect(result.current.map((g) => g.code)).toEqual(['GB']));
  });

  it('leaves out a guide without twelve months', async () => {
    const { result } = renderHook(() => useCountryGuides(['PE', 'FR']));
    await waitFor(() => expect(result.current.map((g) => g.code)).toEqual(['FR']));
  });

  it('loads nothing when no country asked about has a guide, or while disabled', async () => {
    renderHook(() => useCountryGuides(['BR', 'AR']));
    renderHook(() => useCountryGuides(['FR'], { enabled: false }));
    renderHook(() => useCountryGuides(null));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(loadCountryIndex).not.toHaveBeenCalled();
  });

  it('loads the index once for every user of it', async () => {
    const a = renderHook(() => useCountryGuides(['FR']));
    const b = renderHook(() => useCountryGuides(['JP']));
    await waitFor(() => expect(a.result.current).toHaveLength(1));
    await waitFor(() => expect(b.result.current).toHaveLength(1));
    expect(loadCountryIndex).toHaveBeenCalledTimes(1);
  });

  it('forgets a failed load, so the next use tries again', async () => {
    loadCountryIndex.mockRejectedValueOnce(new Error('offline'));
    const first = renderHook(() => useCountryGuides(['FR']));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(first.result.current).toEqual([]);
    const second = renderHook(() => useCountryGuides(['FR']));
    await waitFor(() => expect(second.result.current).toHaveLength(1));
    expect(loadCountryIndex).toHaveBeenCalledTimes(2);
  });

  it('gives no stale guides while new countries are looked up', async () => {
    const { result, rerender } = renderHook(({ codes }) => useCountryGuides(codes), { initialProps: { codes: ['FR'] } });
    await waitFor(() => expect(result.current).toHaveLength(1));
    rerender({ codes: ['BR'] });
    expect(result.current).toEqual([]);
  });
});
