import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { getMomentPage } from '@/api/travelApi';
// Utils
import { compareMoments } from '@/utils/moments/momentDates';

/**
 * Moments of a map, a trip or a share link, a page at a time, in date order (oldest
 * first, undated last). Filters: `country`, and on a map or a share link `tripId`.
 * Nothing loads while `enabled` is false. After a change, `saved(moment)` puts it in its
 * place and `removed(id)` takes it out; with more pages to come, the list is loaded
 * again instead, as the moment's place may be on a page not loaded yet.
 */
export default function useMomentPage({ mapId, tripId, shareCode, country, limit = 30, enabled = true }) {
  const [moments, setMoments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Bumped on every reset, so a slow reply for old filters is dropped
  const generationRef = useRef(0);

  const fetchPage = useCallback(
    async (cursor) => {
      const generation = generationRef.current;
      setLoading(true);
      setError(null);
      try {
        const page = await getMomentPage({ mapId, tripId, shareCode, country, cursor, limit });
        if (generation !== generationRef.current) return;
        setMoments((prev) => (cursor ? [...prev, ...(page.moments || [])] : page.moments || []));
        setNextCursor(page.nextCursor || null);
      } catch (err) {
        if (generation === generationRef.current) setError(err.friendlyMessage || 'Moments could not be loaded.');
      } finally {
        if (generation === generationRef.current) setLoading(false);
      }
    },
    [mapId, tripId, shareCode, country, limit],
  );

  // The same list loaded again stays on screen until the new page arrives
  const listKeyRef = useRef(null);
  const reload = useCallback(() => {
    generationRef.current += 1;
    const key = enabled ? JSON.stringify([mapId, tripId, shareCode, country, limit]) : null;
    if (key === null || key !== listKeyRef.current) setMoments([]);
    listKeyRef.current = key;
    setNextCursor(null);
    if (enabled) fetchPage(null);
  }, [enabled, fetchPage, mapId, tripId, shareCode, country, limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loading) fetchPage(nextCursor);
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
