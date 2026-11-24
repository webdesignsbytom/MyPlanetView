import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useOneShots from '@/hooks/useOneShots';
import { deleteOneShot, getOneShots, saveOneShot } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ getOneShots: vi.fn(), saveOneShot: vi.fn(), deleteOneShot: vi.fn() }));

const tick = (itemKey, extra = {}) => ({ id: `t-${itemKey}`, itemKey, seenOn: null, datePrecision: null, countryCode: null, travellerIds: [], photo: null, ...extra });
const EQUATOR = { itemKey: 'equator', seenOn: '2019-03-02', from: 'FLIGHT', flight: { id: 'f1', fromAirport: 'LHR', toAirport: 'NBO', flownOn: '2019-03-02' } };

beforeEach(() => {
  vi.resetAllMocks();
  getOneShots.mockResolvedValue({ oneShots: [tick('puffin')], suggestions: [EQUATOR] });
});

describe('useOneShots', () => {
  it('loads a map’s ticks and suggestions, or a share link’s', async () => {
    const { result } = renderHook(() => useOneShots({ mapId: 'm1' }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.oneShots).toEqual([tick('puffin')]);
    expect(result.current.suggestions).toEqual([EQUATOR]);
    expect(getOneShots).toHaveBeenCalledWith({ mapId: 'm1', shareCode: null });

    renderHook(() => useOneShots({ shareCode: 'ABCD' }));
    await waitFor(() => expect(getOneShots).toHaveBeenCalledWith({ mapId: null, shareCode: 'ABCD' }));
  });

  it('asks for nothing with neither', () => {
    const { result } = renderHook(() => useOneShots({}));
    expect(result.current.loading).toBe(false);
    expect(getOneShots).not.toHaveBeenCalled();
  });

  it('says when they couldn’t be loaded', async () => {
    getOneShots.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    const { result } = renderHook(() => useOneShots({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.error).toBe('Offline.'));
    expect(result.current.loading).toBe(false);
  });

  it('puts a saved tick first, in place of the old one, and drops its suggestion', async () => {
    const { result } = renderHook(() => useOneShots({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const saved = tick('equator', { seenOn: '2019-03-02', source: 'FLIGHT' });
    saveOneShot.mockResolvedValue({ oneShot: saved, created: true, countryCode: null });
    let answer;
    await act(async () => {
      answer = await result.current.save('equator', { seenOn: '2019-03-02', source: 'FLIGHT' });
    });
    expect(saveOneShot).toHaveBeenCalledWith('m1', 'equator', { seenOn: '2019-03-02', source: 'FLIGHT' });
    expect(answer.created).toBe(true);
    expect(result.current.oneShots.map((t) => t.itemKey)).toEqual(['equator', 'puffin']);
    expect(result.current.suggestions).toEqual([]);

    saveOneShot.mockResolvedValue({ oneShot: tick('puffin', { notes: 'Skelligs' }), created: false, countryCode: null });
    await act(async () => {
      await result.current.save('puffin', { notes: 'Skelligs' });
    });
    expect(result.current.oneShots.map((t) => [t.itemKey, t.notes])).toEqual([
      ['puffin', 'Skelligs'],
      ['equator', undefined],
    ]);
  });

  it('takes one off at once, puts it back when the server says no, and reads again after', async () => {
    const { result } = renderHook(() => useOneShots({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    deleteOneShot.mockRejectedValueOnce(new Error('Forbidden'));
    await act(async () => expect(result.current.remove('puffin')).rejects.toThrow('Forbidden'));
    expect(result.current.oneShots.map((t) => t.itemKey)).toEqual(['puffin']);

    deleteOneShot.mockResolvedValue({ itemKey: 'puffin', ticked: false });
    getOneShots.mockResolvedValue({ oneShots: [], suggestions: [EQUATOR] });
    await act(async () => {
      await result.current.remove('puffin');
    });
    expect(result.current.oneShots).toEqual([]);
    // Read on loading, after the refusal (the tick came back) and after taking it off
    expect(getOneShots).toHaveBeenCalledTimes(3);
  });
});
