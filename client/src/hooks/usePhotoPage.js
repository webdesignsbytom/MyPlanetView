import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { getPhotoPage } from '@/api/travelApi';

// First pages asked for before their list mounted (MapPage starts the map's lists alongside
// the map itself). Each is taken once, by the first list with the same filters, while fresh.
const preloaded = new Map();
const PRELOAD_FRESH_MS = 30000;
const keyOf = ({ mapId, tripId, shareCode, country, unplaced = false, limit = 30 }) =>
  JSON.stringify([mapId || null, tripId || null, shareCode || null, country || null, Boolean(unplaced), limit]);

/** Start fetching a list's first page now; the usePhotoPage with the same filters uses it. */
export function preloadPhotoPage(filters) {
  const key = keyOf(filters);
  const hit = preloaded.get(key);
  if (hit && Date.now() - hit.at < PRELOAD_FRESH_MS) return;
  const promise = getPhotoPage({ ...filters, cursor: undefined });
  promise.catch(() => {}); // a failure is reported by the list, when it asks
  preloaded.set(key, { promise, at: Date.now() });
}

function takePreloaded(filters) {
  const key = keyOf(filters);
  const hit = preloaded.get(key);
  if (!hit) return null;
  preloaded.delete(key);
  return Date.now() - hit.at < PRELOAD_FRESH_MS ? hit.promise : null;
}

/**
 * Photos of a map, a trip, or a share link, newest first, a page at a time.
 * Filters: `country` (ISO code), or `unplaced` (only the photos with no country), and,
 * on a map, `tripId`. Nothing loads while `enabled` is false.
 */
export default function usePhotoPage({ mapId, tripId, shareCode, country, unplaced = false, limit = 30, enabled = true }) {
  const [photos, setPhotos] = useState([]);
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
        const filters = { mapId, tripId, shareCode, country, unplaced, limit };
        const page = await ((!cursor && takePreloaded(filters)) || getPhotoPage({ ...filters, cursor }));
        if (generation !== generationRef.current) return;
        setPhotos((prev) => (cursor ? [...prev, ...(page.photos || [])] : page.photos || []));
        setNextCursor(page.nextCursor || null);
      } catch (err) {
        if (generation === generationRef.current) setError(err.friendlyMessage || 'Photos could not be loaded.');
      } finally {
        if (generation === generationRef.current) setLoading(false);
      }
    },
    [mapId, tripId, shareCode, country, unplaced, limit],
  );

  const reload = useCallback(() => {
    generationRef.current += 1;
    setPhotos([]);
    setNextCursor(null);
    if (enabled) fetchPage(null);
  }, [enabled, fetchPage]);

  useEffect(() => {
    reload();
  }, [reload]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loading) fetchPage(nextCursor);
  }, [nextCursor, loading, fetchPage]);

  // Keep the list in step after a change in the viewer, without a refetch
  const replacePhoto = useCallback((photo) => {
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, ...photo } : p)));
  }, []);
  const removePhoto = useCallback((photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);
  const addPhotos = useCallback((added) => {
    setPhotos((prev) => [...added, ...prev.filter((p) => !added.some((a) => a.id === p.id))]);
  }, []);

  return { photos, nextCursor, loading, error, loadMore, reload, replacePhoto, removePhoto, addPhotos };
}
