import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { getMomentPage } from '@/api/travelApi';
// Utils
import { compareMoments } from '@/utils/moments/momentDates';
import { inFlight, prefetch, recall, remember, rememberIfMissing } from '@/utils/data/panelCache';

const keyOf = ({ mapId, tripId, shareCode, country, limit = 30 }) =>
  JSON.stringify([mapId || null, tripId || null, shareCode || null, country || null, limit]);
// A list's place in the panel cache (utils/data/panelCache.js): the moments it had and where
// its next page starts, kept as the list changes, so it opens again at once
const cacheKey = (filters) => `moments:${keyOf(filters)}`;
const asList = (page) => ({ moments: page.moments || [], nextCursor: page.nextCursor || null });

/**
 * Start fetching a list's first page now and keep it (the map page, once it has drawn; a
 * country hovered): the useMomentPage with the same filters shows it at once.
 */
export function preloadMomentPage(filters) {
  return prefetch(cacheKey(filters), () => getMomentPage({ ...filters, cursor: undefined, limit: filters.limit ?? 30 }), asList);
}

/** A list's place in the panel cache, for a fetch that brings several at once: `{ key, toValue }`. */
export const momentPageCacheEntry = (filters) => ({ key: cacheKey(filters), toValue: asList });

/** A list the map's counts say has no moments: kept empty, so it opens without a spinner. */
export function rememberEmptyMomentPage(filters) {
  rememberIfMissing(cacheKey(filters), { moments: [], nextCursor: null });
}

/**
 * Moments of a map, a trip or a share link, a page at a time, in date order (oldest
 * first, undated last). Filters: `country`, and on a map or a share link `tripId`.
 * Nothing loads while `enabled` is false. After a change, `saved(moment)` puts it in its
 * place and `removed(id)` takes it out; with more pages to come, the list is loaded
 * again instead, as the moment's place may be on a page not loaded yet. A list kept from
 * before (panelCache) shows at once while a fresh first page loads quietly behind it.
 */
export default function useMomentPage({ mapId, tripId, shareCode, country, limit = 30, enabled = true }) {
  const [moments, setMoments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Bumped on every reset, so a slow reply for old filters is dropped
  const generationRef = useRef(0);
  // Whether the list on screen is a real one (fetched, or kept from before), worth keeping
  const readyRef = useRef(false);

  // `quiet`: a fresh first page behind a kept list, with no spinner and no error
  const fetchPage = useCallback(
    async (cursor, quiet = false) => {
      const generation = generationRef.current;
      if (!quiet) {
        setLoading(true);
        setError(null);
      }
      try {
        const filters = { mapId, tripId, shareCode, country, limit };
        const page = await ((!cursor && inFlight(cacheKey(filters))) || getMomentPage({ ...filters, cursor }));
        if (generation !== generationRef.current) return;
        readyRef.current = true;
        setMoments((prev) => (cursor ? [...prev, ...(page.moments || [])] : page.moments || []));
        setNextCursor(page.nextCursor || null);
      } catch (err) {
        if (!quiet && generation === generationRef.current) setError(err.friendlyMessage || 'Moments could not be loaded.');
      } finally {
        if (!quiet && generation === generationRef.current) setLoading(false);
      }
    },
    [mapId, tripId, shareCode, country, limit],
  );

  // A kept list shows at once; without one, the same list loaded again stays on screen
  // until the new page arrives
  const listKeyRef = useRef(null);
  const reload = useCallback(() => {
    generationRef.current += 1;
    // A page still on its way is dropped, and its spinner with it (a quiet refresh never
    // clears `loading`; 19 Nov 2026, the audit). A fetch below that isn't quiet sets it again.
    setLoading(false);
    setError(null);
    const filters = { mapId, tripId, shareCode, country, limit };
    const key = enabled ? keyOf(filters) : null;
    const kept = enabled ? recall(cacheKey(filters)) : null;
    if (kept) {
      setMoments(kept.moments);
      setNextCursor(kept.nextCursor);
    } else {
      if (key === null || key !== listKeyRef.current) setMoments([]);
      setNextCursor(null);
    }
    listKeyRef.current = key;
    readyRef.current = Boolean(kept);
    if (enabled) fetchPage(null, Boolean(kept));
  }, [enabled, fetchPage, mapId, tripId, shareCode, country, limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  // The list as it stands goes into the panel cache: after a page, a save, a removal
  useEffect(() => {
    if (readyRef.current && listKeyRef.current) remember(`moments:${listKeyRef.current}`, { moments, nextCursor });
  }, [moments, nextCursor]);

  // A quiet refresh still on its way is dropped: it would replace the pages added here
  const loadMore = useCallback(() => {
    if (!nextCursor || loading) return;
    generationRef.current += 1;
    fetchPage(nextCursor);
  }, [nextCursor, loading, fetchPage]);

  const saved = useCallback(
    (moment) => {
      if (nextCursor) {
        reload();
        return;
      }
      setMoments((prev) => [...prev.filter((m) => m.id !== moment.id), moment].sort(compareMoments));
    },
    [nextCursor, reload],
  );
  const removed = useCallback((momentId) => {
    setMoments((prev) => prev.filter((m) => m.id !== momentId));
  }, []);

  return { moments, nextCursor, loading, error, loadMore, reload, saved, removed };
}
