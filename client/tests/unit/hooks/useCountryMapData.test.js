import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useCountryMapData from '@/hooks/useCountryMapData';
import { clearSubdivision, getPins, getSubdivisions, setSubdivision } from '@/api/travelApi';
import { loadCountryMap } from '@/utils/map/countryMapGeo';

vi.mock('@/api/travelApi', () => ({
  getSubdivisions: vi.fn(),
  getPins: vi.fn(),
  setSubdivision: vi.fn(),
  clearSubdivision: vi.fn(),
}));
vi.mock('@/utils/map/countryMapGeo', () => ({ loadCountryMap: vi.fn() }));

const GEO = { code: 'US', areas: [] };

beforeEach(() => {
  vi.resetAllMocks();
  loadCountryMap.mockResolvedValue(GEO);
  getSubdivisions.mockResolvedValue({ subdivisions: [{ code: 'US-NY', status: 'VISITED' }] });
  getPins.mockResolvedValue({ pins: [{ id: 'p1' }] });
});

const open = (props = {}) =>
  renderHook((p) => useCountryMapData(p), { initialProps: { source: { mapId: 'm1' }, code: 'US', ...props } });

describe('useCountryMapData', () => {
  it('loads the outlines, the states marked and the pins', async () => {
    const { result } = open();
    await waitFor(() => expect(result.current.geo).toBe(GEO));
    expect(result.current.statuses.get('US-NY')).toBe('VISITED');
    await waitFor(() => expect(result.current.pins).toEqual([{ id: 'p1' }]));
    expect(loadCountryMap).toHaveBeenCalledWith('US');
    expect(getSubdivisions).toHaveBeenCalledWith({ mapId: 'm1' }, 'US');
    expect(getPins).toHaveBeenCalledWith({ mapId: 'm1' }, 'US');
  });

  it('reads through a share link', async () => {
    const { result } = open({ source: { shareCode: 'ABC' } });
    await waitFor(() => expect(result.current.geo).toBe(GEO));
    expect(getSubdivisions).toHaveBeenCalledWith({ shareCode: 'ABC' }, 'US');
    expect(getPins).toHaveBeenCalledWith({ shareCode: 'ABC' }, 'US');
  });

  it('says when the map couldn’t be loaded', async () => {
    getSubdivisions.mockRejectedValue(new Error('x'));
    const { result } = open();
    await waitFor(() => expect(result.current.error).toBe('This country’s map could not be loaded.'));
  });

  it('reloads only the pins when their version goes up', async () => {
    const { result, rerender } = open();
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    getPins.mockResolvedValue({ pins: [{ id: 'p1' }, { id: 'p2' }] });
    rerender({ source: { mapId: 'm1' }, code: 'US', pinsVersion: 1 });
    await waitFor(() => expect(result.current.pins).toHaveLength(2));
    expect(getSubdivisions).toHaveBeenCalledTimes(1);
  });

  it('marks a state at once and hands back the visits it brought', async () => {
    const { result } = open();
    await waitFor(() => expect(result.current.geo).toBe(GEO));
    let answer;
    setSubdivision.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    let saving;
    act(() => {
      saving = result.current.setStatus('US-MA', 'LIVED');
    });
    expect(result.current.statuses.get('US-MA')).toBe('LIVED');
    await act(async () => {
      answer({ implied: [{ countryCode: 'US', status: 'VISITED' }] });
      expect(await saving).toEqual([{ countryCode: 'US', status: 'VISITED' }]);
    });
    expect(setSubdivision).toHaveBeenCalledWith('m1', 'US-MA', 'LIVED');
  });

  it('clears a state', async () => {
    const { result } = open();
    await waitFor(() => expect(result.current.geo).toBe(GEO));
    clearSubdivision.mockResolvedValue({});
    await act(async () => expect(await result.current.setStatus('US-NY', null)).toEqual([]));
    expect(result.current.statuses.has('US-NY')).toBe(false);
    expect(clearSubdivision).toHaveBeenCalledWith('m1', 'US-NY');
  });

  it('puts a state back as it was when the server refuses', async () => {
    const { result } = open();
    await waitFor(() => expect(result.current.geo).toBe(GEO));
    setSubdivision.mockRejectedValue(new Error('Forbidden'));
    await act(async () => expect(result.current.setStatus('US-NY', 'WANT_TO_GO')).rejects.toThrow('Forbidden'));
    expect(result.current.statuses.get('US-NY')).toBe('VISITED');
    await act(async () => expect(result.current.setStatus('US-CA', 'VISITED')).rejects.toThrow('Forbidden'));
    expect(result.current.statuses.has('US-CA')).toBe(false);
  });
});
