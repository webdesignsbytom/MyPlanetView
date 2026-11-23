import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useMapTravelCopies from '@/hooks/useMapTravelCopies';
import { continueTravelCopy, getMapTravelCopies } from '@/api/travelCopiesApi';

vi.mock('@/api/travelCopiesApi', () => ({ getMapTravelCopies: vi.fn(), continueTravelCopy: vi.fn() }));

const request = (id, status, done = 0) => ({ id, status, progress: { done, total: 10 } });

beforeEach(() => {
  vi.resetAllMocks();
  getMapTravelCopies.mockResolvedValue({ incoming: [request('r1', 'PENDING')], outgoing: [request('r2', 'DONE', 10)] });
});

afterEach(() => vi.useRealTimers());

describe('useMapTravelCopies', () => {
  it('loads the requests from and onto the map', async () => {
    const { result } = renderHook(() => useMapTravelCopies('m1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.incoming).toEqual([request('r1', 'PENDING')]);
    expect(result.current.outgoing).toEqual([request('r2', 'DONE', 10)]);
    expect(getMapTravelCopies).toHaveBeenCalledWith('m1');
  });

  it('asks nothing while disabled', () => {
    const { result } = renderHook(() => useMapTravelCopies('m1', { enabled: false }));
    expect(result.current.loading).toBe(false);
    expect(getMapTravelCopies).not.toHaveBeenCalled();
  });

  it('says why they couldn’t be loaded', async () => {
    getMapTravelCopies.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMapTravelCopies('m1'));
    await waitFor(() => expect(result.current.error).toBe('The requests couldn’t be loaded.'));
  });

  it('puts a changed request in its list', async () => {
    const { result } = renderHook(() => useMapTravelCopies('m1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.put({ id: 'r1', status: 'DECLINED' }));
    expect(result.current.incoming).toEqual([{ ...request('r1', 'PENDING'), status: 'DECLINED' }]);
    expect(result.current.outgoing).toEqual([request('r2', 'DONE', 10)]);
  });

  it('carries an approved copy on, a run after another, until it’s done', async () => {
    getMapTravelCopies.mockResolvedValue({ incoming: [request('r1', 'APPROVED', 0)], outgoing: [] });
    continueTravelCopy.mockResolvedValueOnce({ request: request('r1', 'APPROVED', 5) });
    continueTravelCopy.mockResolvedValueOnce({ request: request('r1', 'DONE', 10) });
    const { result } = renderHook(() => useMapTravelCopies('m1'));
    await waitFor(() => expect(result.current.incoming[0].status).toBe('DONE'));
    expect(continueTravelCopy).toHaveBeenCalledTimes(2);
    expect(continueTravelCopy).toHaveBeenCalledWith('r1');
  });

  it('waits a moment before asking again when a run made no progress', async () => {
    vi.useFakeTimers();
    getMapTravelCopies.mockResolvedValue({ incoming: [], outgoing: [request('r3', 'APPROVED', 4)] });
    continueTravelCopy.mockResolvedValueOnce({ request: request('r3', 'APPROVED', 4) });
    continueTravelCopy.mockResolvedValueOnce({ request: request('r3', 'DONE', 10) });
    renderHook(() => useMapTravelCopies('m1'));
    await act(async () => vi.advanceTimersByTimeAsync(0));
    expect(continueTravelCopy).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1999));
    expect(continueTravelCopy).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(continueTravelCopy).toHaveBeenCalledTimes(2);
  });

  it('leaves a copy for later when a run fails', async () => {
    getMapTravelCopies.mockResolvedValue({ incoming: [request('r1', 'APPROVED', 0)], outgoing: [] });
    continueTravelCopy.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useMapTravelCopies('m1'));
    await waitFor(() => expect(continueTravelCopy).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(continueTravelCopy).toHaveBeenCalledTimes(1);
    expect(result.current.incoming[0].status).toBe('APPROVED');
  });
});
