import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useTravelMap from '@/hooks/useTravelMap';
import * as api from '@/api/travelApi';
import { forgetMapLists } from '@/utils/map/mapListCache';

vi.mock('@/api/travelApi', () => ({
  getMap: vi.fn(),
  getMapTrips: vi.fn(),
  getMapStats: vi.fn(),
  putVisit: vi.fn(),
  deleteVisit: vi.fn(),
  updateMap: vi.fn(),
  tickLandmark: vi.fn(),
  untickLandmark: vi.fn(),
  createTraveller: vi.fn(),
  updateTraveller: vi.fn(),
  deleteTraveller: vi.fn(),
  createTrip: vi.fn(),
  removeTripFromMap: vi.fn(),
}));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));

const visit = (countryCode, status = 'VISITED') => ({ countryCode, status, source: 'MANUAL', firstVisitedOn: null, notes: null });
const mapOf = (id = 'm1', extra = {}) => ({
  id,
  name: 'Our map',
  visits: [visit('FR'), visit('JP', 'WANT_TO_GO')],
  stats: { countries: 1 },
  travellers: [{ id: 't1', name: 'Sam' }],
  tickedLandmarkIds: [],
  designs: {},
  ads: { every: 12 },
  ...extra,
});
const codes = (result) =>
  Object.fromEntries(result.current.map.visits.map((v) => [v.countryCode, v.status]).sort(([a], [b]) => a.localeCompare(b)));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function open(options) {
  const hook = renderHook(({ mapId, opts }) => useTravelMap(mapId, opts), { initialProps: { mapId: 'm1', opts: options } });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  vi.resetAllMocks();
  api.getMap.mockImplementation(async (id) => ({ map: mapOf(id) }));
  api.getMapTrips.mockResolvedValue({ trips: [{ id: 'trip1' }] });
  api.getMapStats.mockResolvedValue({ stats: { countries: 2 } });
  api.putVisit.mockResolvedValue({ visit: {}, implied: [] });
  api.deleteVisit.mockResolvedValue({});
});

describe('useTravelMap: loading', () => {
  it('loads the map and its trips', async () => {
    const { result } = await open();
    expect(result.current.map.id).toBe('m1');
    expect(result.current.trips).toEqual([{ id: 'trip1' }]);
    expect(result.current.error).toBeNull();
  });

  it('says why the map couldn’t be loaded', async () => {
    api.getMap.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Resource not found.' }));
    const { result } = await open();
    expect(result.current.error).toBe('Resource not found.');
    expect(result.current.map).toBeNull();
  });

  it('never lets a slower answer for the last map replace the one that’s open', async () => {
    const slow = deferred();
    api.getMap.mockReturnValueOnce(slow.promise);
    const { result, rerender } = renderHook(({ mapId }) => useTravelMap(mapId), { initialProps: { mapId: 'remembered' } });
    rerender({ mapId: 'm2' });
    await waitFor(() => expect(result.current.map?.id).toBe('m2'));
    await act(async () => slow.resolve({ map: mapOf('remembered') }));
    expect(result.current.map.id).toBe('m2');
  });

  it('refreshes quietly, keeping the map on screen', async () => {
    const { result } = await open();
    api.getMap.mockResolvedValue({ map: mapOf('m1', { name: 'Renamed' }) });
    let refreshing;
    act(() => {
      refreshing = result.current.refresh();
    });
    expect(result.current.loading).toBe(false);
    await act(async () => refreshing);
    expect(result.current.map.name).toBe('Renamed');
  });
});

describe('useTravelMap: visits', () => {
  it('shows a visit at once, then the server’s stats', async () => {
    const { result } = await open();
    const saving = deferred();
    api.putVisit.mockReturnValue(saving.promise);
    let change;
    act(() => {
      change = result.current.setVisit('PE', 'VISITED', { firstVisitedOn: '2019-01-01' });
    });
    expect(codes(result).PE).toBe('VISITED');
    expect(result.current.map.visits.find((v) => v.countryCode === 'PE').firstVisitedOn).toBe('2019-01-01');
    expect(api.putVisit).toHaveBeenCalledWith('m1', 'PE', { status: 'VISITED', firstVisitedOn: '2019-01-01' });
    await act(async () => {
      saving.resolve({ implied: [] });
      await change;
    });
    await waitFor(() => expect(result.current.map.stats).toEqual({ countries: 2 }));
  });

  it('keeps a visit’s source and note when its status changes', async () => {
    api.getMap.mockResolvedValue({ map: mapOf('m1', { visits: [{ ...visit('FR'), source: 'PHOTO', notes: 'Paris' }] }) });
    const { result } = await open();
    await act(async () => result.current.setVisit('FR', 'LIVED'));
    expect(result.current.map.visits[0]).toMatchObject({ countryCode: 'FR', status: 'LIVED', source: 'PHOTO', notes: 'Paris' });
  });

  // A place's strings follow the order places were marked (25 Nov 2026): the server's time for it
  it('keeps when the server says a place was marked', async () => {
    const { result } = await open();
    api.putVisit.mockResolvedValueOnce({ visit: { countryCode: 'CA', status: 'WANT_TO_GO', markedAt: '2026-11-25T10:00:00.000Z' }, implied: [] });
    await act(async () => result.current.setVisit('CA', 'WANT_TO_GO'));
    expect(result.current.map.visits.find((v) => v.countryCode === 'CA')).toMatchObject({ status: 'WANT_TO_GO', markedAt: '2026-11-25T10:00:00.000Z' });
  });

  it('clears a country', async () => {
    const { result } = await open();
    await act(async () => result.current.setVisit('JP', null));
    expect(codes(result)).toEqual({ FR: 'VISITED' });
    expect(api.deleteVisit).toHaveBeenCalledWith('m1', 'JP');
  });

  it('undoes only that country when the server refuses', async () => {
    const { result } = await open();
    const refused = deferred();
    api.putVisit.mockReturnValueOnce(refused.promise);
    let failing;
    act(() => {
      failing = result.current.setVisit('JP', 'VISITED');
    });
    await act(async () => result.current.setVisit('PE', 'LIVED'));
    await act(async () => {
      refused.reject(new Error('Forbidden'));
      await expect(failing).rejects.toThrow('Forbidden');
    });
    expect(codes(result)).toEqual({ FR: 'VISITED', JP: 'WANT_TO_GO', PE: 'LIVED' });
  });

  it('shows the South Pole with Antarctica, and takes both back together', async () => {
    const { result } = await open();
    const refused = deferred();
    api.putVisit.mockReturnValueOnce(refused.promise);
    let failing;
    act(() => {
      failing = result.current.setVisit('XS', 'VISITED');
    });
    expect(codes(result)).toMatchObject({ XS: 'VISITED', AQ: 'VISITED' });
    await act(async () => {
      refused.reject(new Error('x'));
      await failing.catch(() => {});
    });
    expect(codes(result)).toEqual({ FR: 'VISITED', JP: 'WANT_TO_GO' });
  });

  it('adds what the server says the change brought', async () => {
    const { result } = await open();
    api.putVisit.mockResolvedValueOnce({ implied: [visit('ID')] });
    await act(async () => result.current.setVisit('XB', 'VISITED'));
    expect(codes(result)).toMatchObject({ XB: 'VISITED', ID: 'VISITED' });
  });

  it('waits for the server when not optimistic (an unverified address)', async () => {
    const { result } = await open({ optimistic: false });
    const saving = deferred();
    api.putVisit.mockReturnValue(saving.promise);
    let change;
    act(() => {
      change = result.current.setVisit('PE', 'VISITED');
    });
    expect(codes(result).PE).toBeUndefined();
    await act(async () => {
      saving.resolve({ implied: [] });
      await change;
    });
    expect(codes(result).PE).toBe('VISITED');
  });

  it('keeps the visits on screen when a refresh answers while one is saving, then reads again', async () => {
    const { result } = await open();
    const saving = deferred();
    api.putVisit.mockReturnValue(saving.promise);
    let change;
    act(() => {
      change = result.current.setVisit('PE', 'VISITED');
    });
    // The server's copy from before the change was saved
    api.getMap.mockResolvedValue({ map: mapOf('m1', { name: 'Fresh' }) });
    await act(async () => result.current.refresh());
    expect(result.current.map.name).toBe('Fresh');
    expect(codes(result).PE).toBe('VISITED');
    const readsBefore = api.getMap.mock.calls.length;
    api.getMap.mockResolvedValue({ map: mapOf('m1', { visits: [visit('FR'), visit('JP', 'WANT_TO_GO'), visit('PE')] }) });
    await act(async () => {
      saving.resolve({ implied: [] });
      await change;
    });
    await waitFor(() => expect(api.getMap.mock.calls.length).toBe(readsBefore + 1));
  });
});

describe('useTravelMap: the map’s details, style and design', () => {
  it('saves the details, keeping how often cards show, and forgets the map lists', async () => {
    const { result } = await open();
    api.updateMap.mockResolvedValue({ map: mapOf('m1', { name: 'New name', ads: undefined }) });
    await act(async () => result.current.saveMapDetails({ name: 'New name' }));
    expect(api.updateMap).toHaveBeenCalledWith('m1', { name: 'New name' });
    expect(result.current.map.name).toBe('New name');
    expect(result.current.map.ads).toEqual({ every: 12 });
    expect(forgetMapLists).toHaveBeenCalled();
  });

  it('shows a new style at once and saves it', async () => {
    const { result } = await open();
    api.updateMap.mockResolvedValue({});
    await act(async () => result.current.setMapStyle('starry'));
    expect(result.current.map.style).toBe('starry');
    expect(api.updateMap).toHaveBeenCalledWith('m1', { style: 'starry' });
  });

  it('reads the map again when the style couldn’t be saved', async () => {
    const { result } = await open();
    api.updateMap.mockRejectedValue(new Error('Forbidden'));
    api.getMap.mockResolvedValue({ map: mapOf('m1', { style: 'old-map' }) });
    await act(async () => result.current.setMapStyle('starry'));
    await waitFor(() => expect(result.current.map.style).toBe('old-map'));
  });

  // How the places been to show: the map's own, in every style (25 Nov 2026, the user's wish)
  it('shows a new visited look at once and saves it with the map', async () => {
    const { result } = await open();
    api.updateMap.mockResolvedValue({});
    await act(async () => result.current.setVisitedLook({ visitedLook: 'COLOUR', visitedFinish: 'GOLD' }));
    expect(result.current.map).toMatchObject({ visitedLook: 'COLOUR', visitedFinish: 'GOLD' });
    expect(api.updateMap).toHaveBeenCalledWith('m1', { visitedLook: 'COLOUR', visitedFinish: 'GOLD' });
  });

  it('reads the map again when the visited look couldn’t be saved, and says so', async () => {
    const { result } = await open();
    api.updateMap.mockRejectedValue(new Error('Forbidden'));
    api.getMap.mockResolvedValue({ map: mapOf('m1', { visitedLook: 'BADGE' }) });
    let thrown = null;
    await act(async () => result.current.setVisitedLook({ visitedLook: 'BOTH' }).catch((err) => (thrown = err)));
    expect(thrown?.message).toBe('Forbidden');
    await waitFor(() => expect(result.current.map.visitedLook).toBe('BADGE'));
  });

  it('keeps one design per style', async () => {
    const { result } = await open();
    const design = { shown: true, countries: { FR: '#112233' } };
    act(() => result.current.setDesign('mono', design));
    act(() => result.current.setDesign('starry', { shown: false }));
    expect(result.current.map.designs).toEqual({ mono: design, starry: { shown: false } });
    act(() => result.current.setDesign('mono', null));
    expect(result.current.map.designs).toEqual({ starry: { shown: false } });
  });
});

describe('useTravelMap: landmarks, travellers and trips', () => {
  it('ticks a landmark at once, then reads the map again quietly', async () => {
    const { result } = await open();
    const ticking = deferred();
    api.tickLandmark.mockReturnValue(ticking.promise);
    const reads = api.getMap.mock.calls.length;
    let tick;
    act(() => {
      tick = result.current.setLandmarkBeen('l1', true);
    });
    expect(result.current.map.tickedLandmarkIds).toEqual(['l1']);
    expect(api.tickLandmark).toHaveBeenCalledWith('m1', 'l1');
    // A tick can mark its country visited: the map is read again
    api.getMap.mockResolvedValue({ map: mapOf('m1', { tickedLandmarkIds: ['l1'], visits: [visit('FR'), visit('IT')] }) });
    let answer;
    await act(async () => {
      ticking.resolve({ landmarkId: 'l1', been: true, countryCode: 'IT' });
      answer = await tick;
    });
    // The server's answer comes back: the place it marked (the celebration's "on your map now")
    expect(answer).toEqual({ landmarkId: 'l1', been: true, countryCode: 'IT' });
    await waitFor(() => expect(api.getMap.mock.calls.length).toBe(reads + 1));
    await waitFor(() => expect(codes(result).IT).toBe('VISITED'));
  });

  it('unticks one, and puts a tick back when the server refuses', async () => {
    api.getMap.mockResolvedValue({ map: mapOf('m1', { tickedLandmarkIds: ['l1'] }) });
    const { result } = await open();
    api.untickLandmark.mockRejectedValue(new Error('Forbidden'));
    await act(async () => expect(result.current.setLandmarkBeen('l1', false)).rejects.toThrow('Forbidden'));
    expect(result.current.map.tickedLandmarkIds).toEqual(['l1']);
  });

  it('adds, changes and removes travellers', async () => {
    const { result } = await open();
    api.createTraveller.mockResolvedValue({ traveller: { id: 't2', name: 'Alex' } });
    api.updateTraveller.mockResolvedValue({ traveller: { id: 't1', name: 'Samantha' } });
    api.deleteTraveller.mockResolvedValue({});
    await act(async () => expect(await result.current.addTraveller({ name: 'Alex' })).toEqual({ id: 't2', name: 'Alex' }));
    await act(async () => result.current.editTraveller('t1', { name: 'Samantha' }));
    expect(result.current.map.travellers.map((t) => t.name)).toEqual(['Samantha', 'Alex']);
    await act(async () => result.current.removeTraveller('t2'));
    expect(api.deleteTraveller).toHaveBeenCalledWith('m1', 't2');
    expect(result.current.map.travellers).toEqual([{ id: 't1', name: 'Samantha' }]);
  });

  it('puts a new trip first and reads the stats again', async () => {
    const { result } = await open();
    api.createTrip.mockResolvedValue({ trip: { id: 'trip2' } });
    await act(async () => result.current.addTrip({ title: 'Peru' }));
    expect(result.current.trips.map((t) => t.id)).toEqual(['trip2', 'trip1']);
    expect(api.getMapStats).toHaveBeenCalledWith('m1');
  });

  it('takes a group trip off the map', async () => {
    const { result } = await open();
    api.removeTripFromMap.mockResolvedValue({});
    await act(async () => result.current.unlinkTrip('trip1'));
    expect(api.removeTripFromMap).toHaveBeenCalledWith('trip1', 'm1');
    expect(result.current.trips).toEqual([]);
    expect(forgetMapLists).toHaveBeenCalled();
  });
});
