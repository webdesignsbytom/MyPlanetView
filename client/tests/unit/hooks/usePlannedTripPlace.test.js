import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
import { getTrip } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ getTrip: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

// Whole trips are kept for the session by id and version, so each test uses its own ids
const summary = (id, extra = {}) => ({ id, status: 'PLANNED', startDate: '2027-03-01', endDate: '2027-03-10', stopCount: 2, ...extra });
const fullTrip = (id) => ({
  id,
  startDate: '2027-03-01',
  endDate: '2027-03-10',
  stops: [
    { position: 2, countryCode: 'JP', landmarkName: 'Mount Fuji' },
    { position: 1, countryCode: 'KR', landmarkName: null },
  ],
});

describe('usePlannedTripPlace', () => {
  it('reads a whole trip (the trip page) without asking', () => {
    const { result } = renderHook(() => usePlannedTripPlace(fullTrip('t1')));
    expect(result.current).toEqual({
      tripId: 't1',
      from: '2027-03-01',
      to: '2027-03-10',
      stops: [
        { countryCode: 'KR', destination: 'South Korea' },
        { countryCode: 'JP', destination: 'Mount Fuji' },
      ],
    });
    expect(getTrip).not.toHaveBeenCalled();
  });

  it('uses a group trip’s countries as they are', () => {
    const { result } = renderHook(() => usePlannedTripPlace(summary('t2', { linked: true, countryCodes: ['PE'] })));
    expect(result.current.stops).toEqual([{ countryCode: 'PE', destination: 'Peru' }]);
    expect(getTrip).not.toHaveBeenCalled();
  });

  it('is null for no trip, or a trip that goes nowhere yet', () => {
    expect(renderHook(() => usePlannedTripPlace(null)).result.current).toBeNull();
    expect(renderHook(() => usePlannedTripPlace({ ...fullTrip('t3'), stops: [] })).result.current).toBeNull();
  });

  it('fetches a map’s own trip for its stops: undefined until it’s here', async () => {
    getTrip.mockResolvedValue({ trip: fullTrip('t4') });
    const { result } = renderHook(() => usePlannedTripPlace(summary('t4')));
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current?.stops).toHaveLength(2));
    expect(getTrip).toHaveBeenCalledWith('t4');
  });

  it('fetches a trip once for everyone asking about the same version of it', async () => {
    getTrip.mockResolvedValue({ trip: fullTrip('t5') });
    const a = renderHook(() => usePlannedTripPlace(summary('t5')));
    const b = renderHook(() => usePlannedTripPlace(summary('t5')));
    await waitFor(() => expect(a.result.current).toBeTruthy());
    await waitFor(() => expect(b.result.current).toBeTruthy());
    expect(getTrip).toHaveBeenCalledTimes(1);
  });

  it('fetches again when the trip changes (another stop)', async () => {
    getTrip.mockResolvedValue({ trip: fullTrip('t6') });
    const { result, rerender } = renderHook(({ trip }) => usePlannedTripPlace(trip), { initialProps: { trip: summary('t6') } });
    await waitFor(() => expect(result.current).toBeTruthy());
    rerender({ trip: summary('t6', { stopCount: 3 }) });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeTruthy());
    expect(getTrip).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['through a share link', { canFetch: false }, {}],
    ['while disabled', { enabled: false }, {}],
    ['for a trip the viewer can’t open', {}, { canOpen: false }],
  ])('fetches nothing %s', (_when, options, extra) => {
    const { result } = renderHook(() => usePlannedTripPlace(summary('t7', extra), options));
    expect(result.current).toBeNull();
    expect(getTrip).not.toHaveBeenCalled();
  });

  it('is null when the trip couldn’t be fetched, and asks again next time', async () => {
    getTrip.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePlannedTripPlace(summary('t8')));
    await waitFor(() => expect(result.current).toBeNull());
    getTrip.mockResolvedValueOnce({ trip: fullTrip('t8') });
    const again = renderHook(() => usePlannedTripPlace(summary('t8')));
    await waitFor(() => expect(again.result.current).toBeTruthy());
  });
});
