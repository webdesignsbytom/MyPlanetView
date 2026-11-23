import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useCountableMaps from '@/hooks/useCountableMaps';
import { getMyMaps } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ getMyMaps: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

describe('useCountableMaps', () => {
  it('offers the maps someone owns, co-owns or edits, saying which', async () => {
    getMyMaps.mockResolvedValue({
      maps: [
        { id: 'm1', name: 'My map', role: 'OWNER' },
        { id: 'm2', name: 'Our map', role: 'CO_OWNER' },
        { id: 'm3', name: 'Jo’s map', role: 'EDITOR' },
        { id: 'm4', name: 'Sam’s map', role: 'VIEWER' },
      ],
    });
    const { result } = renderHook(() => useCountableMaps());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options).toEqual([
      { value: 'm1', label: 'My map' },
      { value: 'm2', label: 'Our map (you co-own it)' },
      { value: 'm3', label: 'Jo’s map (you edit it)' },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('asks nothing and isn’t loading while disabled (signed out)', () => {
    const { result } = renderHook(() => useCountableMaps({ enabled: false }));
    expect(result.current.loading).toBe(false);
    expect(getMyMaps).not.toHaveBeenCalled();
  });

  it('is loading as soon as it is turned on, never showing “no maps” first', async () => {
    getMyMaps.mockResolvedValue({ maps: [] });
    const { result, rerender } = renderHook(({ enabled }) => useCountableMaps({ enabled }), { initialProps: { enabled: false } });
    rerender({ enabled: true });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options).toEqual([]);
  });

  it('says why the maps couldn’t be loaded', async () => {
    getMyMaps.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useCountableMaps());
    await waitFor(() => expect(result.current.error).toBe('Your maps could not be loaded.'));
    expect(result.current.options).toEqual([]);
  });
});
