import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPanelCache, inFlight, prefetch, prefetchMany, recall, remember, rememberIfMissing } from '@/utils/data/panelCache';

const MINUTE = 60 * 1000;
// A promise to settle by hand
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('panelCache', () => {
  beforeEach(() => {
    clearPanelCache();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-23T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('remember and recall', () => {
    it('shows what was kept for 20 minutes, then nothing', () => {
      remember('photos:FR', ['p1']);
      expect(recall('photos:FR')).toEqual(['p1']);
      vi.setSystemTime(Date.now() + 20 * MINUTE - 1);
      expect(recall('photos:FR')).toEqual(['p1']);
      vi.setSystemTime(Date.now() + 1);
      expect(recall('photos:FR')).toBeNull();
    });

    it('is null for a key never kept, and keeps a falsy value apart from nothing', () => {
      expect(recall('nothing')).toBeNull();
      remember('count', 0);
      expect(recall('count')).toBe(0);
    });

    it('forgets everything on sign-in or out', () => {
      remember('a', 1);
      remember('b', 2);
      clearPanelCache();
      expect([recall('a'), recall('b')]).toEqual([null, null]);
    });
  });

  describe('prefetch', () => {
    it('fetches once, keeps the answer as `toValue` makes it, and settles without a value', async () => {
      const fetcher = vi.fn(() => Promise.resolve({ photos: ['p1'], nextCursor: null }));
      const done = await prefetch('photos:FR', fetcher, (reply) => reply.photos);
      expect(done).toBeUndefined();
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(recall('photos:FR')).toEqual(['p1']);
      expect(inFlight('photos:FR')).toBeNull();
    });

    it('shares a fetch already on its way instead of asking twice', async () => {
      const reply = deferred();
      const fetcher = vi.fn(() => reply.promise);
      const first = prefetch('k', fetcher);
      expect(inFlight('k')).toBe(reply.promise);
      const second = prefetch('k', fetcher);
      reply.resolve('answer');
      await Promise.all([first, second]);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(recall('k')).toBe('answer');
    });

    it('doesn’t fetch again while the copy is fresh, and does once it isn’t', async () => {
      const fetcher = vi.fn(() => Promise.resolve('v'));
      await prefetch('k', fetcher);
      await prefetch('k', fetcher);
      expect(fetcher).toHaveBeenCalledTimes(1);
      vi.setSystemTime(Date.now() + 20 * MINUTE);
      await prefetch('k', fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('never rejects, and a failure with nothing kept leaves nothing', async () => {
      await expect(prefetch('none', () => Promise.reject(new Error('offline')))).resolves.toBeUndefined();
      expect(recall('none')).toBeNull();
      expect(inFlight('none')).toBeNull();
    });

    it('leaves the old copy, with its own time, when a refresh fails', async () => {
      const keptAt = Date.now();
      remember('k', 'old');
      vi.setSystemTime(keptAt + 20 * MINUTE);
      const fetcher = vi.fn(() => Promise.reject(new Error('offline')));
      await prefetch('k', fetcher);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(inFlight('k')).toBeNull();
      expect(recall('k')).toBeNull();
      vi.setSystemTime(keptAt + 1);
      expect(recall('k')).toBe('old');
    });

    it('keeps no late answer after the cache was cleared (an account change)', async () => {
      const reply = deferred();
      const pending = prefetch('k', () => reply.promise);
      clearPanelCache();
      reply.resolve('someone else’s');
      await pending;
      await flush();
      expect(recall('k')).toBeNull();
    });

    it('lets a newer fetch’s answer win over an older one still on its way', async () => {
      const older = deferred();
      prefetch('k', () => older.promise);
      clearPanelCache();
      const newer = deferred();
      const pending = prefetch('k', () => newer.promise);
      newer.resolve('newer');
      await pending;
      older.resolve('older');
      await flush();
      expect(recall('k')).toBe('newer');
    });

    it('keeps a value remembered while a fetch is on its way, until the answer replaces it', async () => {
      const reply = deferred();
      const pending = prefetch('k', () => reply.promise);
      remember('k', 'edited');
      expect(recall('k')).toBe('edited');
      expect(inFlight('k')).toBe(reply.promise);
      reply.resolve('fresh');
      await pending;
      expect(recall('k')).toBe('fresh');
    });
  });

  describe('prefetchMany', () => {
    it('asks once for the keys that need it, and keeps each one’s part', async () => {
      remember('fresh', 'here');
      const fetchAll = vi.fn(async (todo) => ({ FR: ['f1'], JP: ['j1'], asked: todo.map((item) => item.key) }));
      const wanted = [
        { key: 'fresh', pick: (reply) => reply.FR },
        { key: 'photos:FR', pick: (reply) => reply.FR, toValue: (part) => ({ photos: part }) },
        { key: 'photos:JP', pick: (reply) => reply.JP },
      ];

      await expect(prefetchMany(wanted, fetchAll)).resolves.toBe(true);

      expect(fetchAll).toHaveBeenCalledTimes(1);
      expect(fetchAll.mock.calls[0][0].map((item) => item.key)).toEqual(['photos:FR', 'photos:JP']);
      expect(recall('photos:FR')).toEqual({ photos: ['f1'] });
      expect(recall('photos:JP')).toEqual(['j1']);
      expect(recall('fresh')).toBe('here');
    });

    it('leaves out a key whose fetch is on its way, and asks for nothing when all are fresh', async () => {
      prefetch('busy', () => new Promise(() => {}));
      remember('fresh', 1);
      const fetchAll = vi.fn();
      await expect(prefetchMany([{ key: 'busy', pick: () => 1 }, { key: 'fresh', pick: () => 1 }], fetchAll)).resolves.toBe(true);
      expect(fetchAll).not.toHaveBeenCalled();
    });

    it('counts a key missing from the reply as failed, alone', async () => {
      await prefetchMany(
        [
          { key: 'a', pick: (reply) => reply.a },
          { key: 'b', pick: (reply) => reply.b },
        ],
        async () => ({ a: 'yes' }),
      );
      await flush();
      expect(recall('a')).toBe('yes');
      expect(recall('b')).toBeNull();
      expect(inFlight('b')).toBeNull();
    });

    it('settles to false when the shared request fails, keeping nothing', async () => {
      const result = await prefetchMany([{ key: 'a', pick: (reply) => reply.a }], () => Promise.reject(new Error('down')));
      await flush();
      expect(result).toBe(false);
      expect(recall('a')).toBeNull();
    });

    it('makes each key wait on the shared request, as a prefetch would', async () => {
      const reply = deferred();
      prefetchMany([{ key: 'a', pick: (r) => r.a }], () => reply.promise);
      const waiting = inFlight('a');
      expect(waiting).toBeInstanceOf(Promise);
      reply.resolve({ a: 'part' });
      await expect(waiting).resolves.toBe('part');
    });
  });

  describe('rememberIfMissing', () => {
    it('keeps an empty list only where nothing is kept or on its way', () => {
      rememberIfMissing('empty', []);
      expect(recall('empty')).toEqual([]);

      remember('full', ['p1']);
      rememberIfMissing('full', []);
      expect(recall('full')).toEqual(['p1']);

      prefetch('loading', () => new Promise(() => {}));
      rememberIfMissing('loading', []);
      expect(recall('loading')).toBeNull();
    });
  });
});
