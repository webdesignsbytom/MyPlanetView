// @vitest-environment node
// The map list and the trips shared with you, kept for the session per user
// (src/utils/map/mapListCache.js). The API is mocked.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetMapLists, myMaps, sharedTrips } from '@/utils/map/mapListCache';
import { getMyMaps, getTripsSharedWithMe } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ getMyMaps: vi.fn(), getTripsSharedWithMe: vi.fn() }));

// A promise settled by hand
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  forgetMapLists();
  vi.mocked(getMyMaps).mockReset();
  vi.mocked(getTripsSharedWithMe).mockReset();
});

describe('myMaps', () => {
  it('has nothing to show before the first load', () => {
    expect(myMaps.peek('u1')).toBeNull();
  });

  it('keeps the loaded list for the user who loaded it', async () => {
    getMyMaps.mockResolvedValue({ maps: [{ id: 'm1' }] });
    await expect(myMaps.load('u1')).resolves.toEqual([{ id: 'm1' }]);
    expect(myMaps.peek('u1')).toEqual([{ id: 'm1' }]);
    expect(myMaps.peek('u2')).toBeNull();
  });

  it('takes a reply with no maps as an empty list', async () => {
    getMyMaps.mockResolvedValue({});
    await expect(myMaps.load('u1')).resolves.toEqual([]);
  });

  it('asks once while a load is on its way, and shares its answer', async () => {
    const reply = deferred();
    getMyMaps.mockReturnValue(reply.promise);
    const first = myMaps.load('u1');
    const second = myMaps.load('u1');
    expect(second).toBe(first);
    expect(getMyMaps).toHaveBeenCalledTimes(1);
    reply.resolve({ maps: [{ id: 'm1' }] });
    await expect(second).resolves.toEqual([{ id: 'm1' }]);
  });

  it('asks again for each load once the last has finished, so the copy refreshes', async () => {
    getMyMaps.mockResolvedValueOnce({ maps: [{ id: 'm1' }] }).mockResolvedValueOnce({ maps: [{ id: 'm1' }, { id: 'm2' }] });
    await myMaps.load('u1');
    await myMaps.load('u1');
    expect(getMyMaps).toHaveBeenCalledTimes(2);
    expect(myMaps.peek('u1')).toHaveLength(2);
  });

  it('asks afresh for another user, and keeps only the newest user’s list', async () => {
    const first = deferred();
    getMyMaps.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ maps: [{ id: 'theirs' }] });
    const mine = myMaps.load('u1');
    await myMaps.load('u2');
    first.resolve({ maps: [{ id: 'mine' }] });
    await expect(mine).resolves.toEqual([{ id: 'mine' }]);
    // The first user's answer came after the second user's load: it isn't kept
    expect(myMaps.peek('u2')).toEqual([{ id: 'theirs' }]);
    expect(myMaps.peek('u1')).toBeNull();
  });

  it('keeps nothing when the load fails, and tries again next time', async () => {
    getMyMaps.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ maps: [{ id: 'm1' }] });
    await expect(myMaps.load('u1')).rejects.toThrow('offline');
    expect(myMaps.peek('u1')).toBeNull();
    await expect(myMaps.load('u1')).resolves.toEqual([{ id: 'm1' }]);
    expect(getMyMaps).toHaveBeenCalledTimes(2);
  });
});

describe('sharedTrips', () => {
  it('keeps the trips shared with you, an empty list for none', async () => {
    getTripsSharedWithMe.mockResolvedValueOnce({ trips: [{ id: 't1' }] }).mockResolvedValueOnce({});
    await expect(sharedTrips.load('u1')).resolves.toEqual([{ id: 't1' }]);
    expect(sharedTrips.peek('u1')).toEqual([{ id: 't1' }]);
    await expect(sharedTrips.load('u1')).resolves.toEqual([]);
  });
});

describe('forgetMapLists', () => {
  it('forgets both lists', async () => {
    getMyMaps.mockResolvedValue({ maps: [{ id: 'm1' }] });
    getTripsSharedWithMe.mockResolvedValue({ trips: [{ id: 't1' }] });
    await Promise.all([myMaps.load('u1'), sharedTrips.load('u1')]);
    forgetMapLists();
    expect(myMaps.peek('u1')).toBeNull();
    expect(sharedTrips.peek('u1')).toBeNull();
  });

  it('drops a load still on its way, whose answer may be out of date', async () => {
    const reply = deferred();
    getMyMaps.mockReturnValueOnce(reply.promise).mockResolvedValueOnce({ maps: [{ id: 'renamed' }] });
    const stale = myMaps.load('u1');
    forgetMapLists();
    // A new load asks again rather than waiting on the old one
    const fresh = myMaps.load('u1');
    expect(fresh).not.toBe(stale);
    await fresh;
    reply.resolve({ maps: [{ id: 'old name' }] });
    await stale;
    expect(myMaps.peek('u1')).toEqual([{ id: 'renamed' }]);
  });
});
