// useTravelMap's strings (docs/API.md "Strings"): a tie waits for the server's string, untying
// shows at once and is put back if the server says no
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useTravelMap from '@/hooks/useTravelMap';
import * as api from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({
  getMap: vi.fn(),
  getMapTrips: vi.fn(),
  getMapStats: vi.fn(),
  putVisit: vi.fn(),
  deleteVisit: vi.fn(),
  updateMap: vi.fn(),
  tickLandmark: vi.fn(),
  untickLandmark: vi.fn(),
  tieMapString: vi.fn(),
  tieAutoMapStrings: vi.fn(),
  untieMapString: vi.fn(),
  untieAllMapStrings: vi.fn(),
  createTraveller: vi.fn(),
  updateTraveller: vi.fn(),
  deleteTraveller: vi.fn(),
  createTrip: vi.fn(),
  removeTripFromMap: vi.fn(),
}));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));

const STRINGS = [
  { id: 's1', from: 'FR', to: 'JP' },
  { id: 's2', from: 'BR', to: 'PE' },
];
const mapOf = (strings = STRINGS) => ({ id: 'm1', name: 'Our map', visits: [], stats: {}, travellers: [], tickedLandmarkIds: [], designs: {}, strings });

async function loaded(strings) {
  api.getMap.mockResolvedValue({ map: mapOf(strings) });
  api.getMapTrips.mockResolvedValue({ trips: [] });
  const hook = renderHook(() => useTravelMap('m1'));
  await waitFor(() => expect(hook.result.current.map).not.toBeNull());
  return hook;
}
const ids = (result) => result.current.map.strings.map((s) => s.id);

describe('useTravelMap: strings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ties one once the server has it, never twice', async () => {
    const { result } = await loaded();
    api.tieMapString.mockResolvedValue({ string: { id: 's3', from: 'DE', to: 'IT' } });
    let string;
    await act(async () => {
      string = await result.current.tieString('IT', 'DE');
    });
    expect(api.tieMapString).toHaveBeenCalledWith('m1', 'IT', 'DE', 'VISITED');
    expect(string).toEqual({ id: 's3', from: 'DE', to: 'IT' });
    expect(ids(result)).toEqual(['s1', 's2', 's3']);
    // The server gives back one already tied
    api.tieMapString.mockResolvedValue({ string: STRINGS[0] });
    await act(() => result.current.tieString('JP', 'FR'));
    expect(ids(result)).toEqual(['s1', 's2', 's3']);
  });

  it('leaves the strings as they were when a tie is refused', async () => {
    const { result } = await loaded();
    api.tieMapString.mockRejectedValue(new Error('no'));
    await act(async () => {
      await expect(result.current.tieString('DE', 'IT')).rejects.toThrow('no');
    });
    expect(ids(result)).toEqual(['s1', 's2']);
  });

  it('takes the automatic ones from the server’s answer', async () => {
    const { result } = await loaded([]);
    api.tieAutoMapStrings.mockResolvedValue({ strings: STRINGS, added: 2, full: false });
    let answer;
    await act(async () => {
      answer = await result.current.tieAutoStrings();
    });
    expect(answer).toMatchObject({ added: 2, full: false });
    expect(ids(result)).toEqual(['s1', 's2']);
  });

  it('unties one at once, and puts it back if the server says no', async () => {
    const { result } = await loaded();
    let finish;
    api.untieMapString.mockReturnValue(new Promise((resolve, reject) => (finish = { resolve, reject })));
    let untying;
    act(() => {
      untying = result.current.untieString(STRINGS[0]);
    });
    expect(ids(result)).toEqual(['s2']);
    expect(api.untieMapString).toHaveBeenCalledWith('m1', 's1');
    await act(async () => {
      finish.reject(new Error('no'));
      await expect(untying).rejects.toThrow('no');
    });
    expect(ids(result)).toEqual(['s2', 's1']);
  });

  it('unties them all at once, and puts them back if the server says no', async () => {
    const { result } = await loaded();
    api.untieAllMapStrings.mockRejectedValue(new Error('no'));
    await act(async () => {
      await expect(result.current.untieAllStrings()).rejects.toThrow('no');
    });
    expect(ids(result)).toEqual(['s1', 's2']);
    api.untieAllMapStrings.mockResolvedValue({ removed: 2 });
    await act(() => result.current.untieAllStrings());
    expect(result.current.map.strings).toEqual([]);
    expect(api.untieAllMapStrings).toHaveBeenCalledWith('m1', 'VISITED');
  });

  // Planned strings (25 Nov 2026, the user's wish): their own kind, in their own set
  it('ties a planned string, and takes off every one of a kind, leaving the other kind', async () => {
    const planned = { id: 'p1', kind: 'PLANNED', from: 'IS', to: 'JP' };
    const { result } = await loaded([...STRINGS, planned]);
    api.tieMapString.mockResolvedValue({ string: { id: 'p2', kind: 'PLANNED', from: 'JP', to: 'PE' } });
    await act(() => result.current.tieString('PE', 'JP', 'PLANNED'));
    expect(api.tieMapString).toHaveBeenCalledWith('m1', 'PE', 'JP', 'PLANNED');
    expect(ids(result)).toEqual(['s1', 's2', 'p1', 'p2']);

    api.untieAllMapStrings.mockResolvedValue({ removed: 2 });
    await act(() => result.current.untieAllStrings('PLANNED'));
    expect(api.untieAllMapStrings).toHaveBeenCalledWith('m1', 'PLANNED');
    expect(ids(result)).toEqual(['s1', 's2']);

    api.tieAutoMapStrings.mockResolvedValue({ strings: [...STRINGS, planned], added: 1, full: false });
    await act(() => result.current.tieAutoStrings('PLANNED'));
    expect(api.tieAutoMapStrings).toHaveBeenCalledWith('m1', 'PLANNED');
    expect(ids(result)).toEqual(['s1', 's2', 'p1']);
  });
});
