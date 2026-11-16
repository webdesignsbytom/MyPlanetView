import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { getPhoto, getPhotoPage, movePhoto as movePhotoRequest } from '@/api/travelApi';

// The list with `photoId` moved to straight after `afterId` (first when it's null)
const placeAfter = (list, photoId, afterId) => {
  const moving = list.find((p) => p.id === photoId);
  if (!moving) return list;
  const rest = list.filter((p) => p.id !== photoId);
  const at = afterId ? rest.findIndex((p) => p.id === afterId) + 1 : 0;
  return [...rest.slice(0, at), moving, ...rest.slice(at)];
};

// First pages asked for before their list mounted (MapPage starts the map's lists alongside
// the map itself). Each is taken once, by the first list with the same filters, while fresh.
const preloaded = new Map();
const PRELOAD_FRESH_MS = 30000;
// Videos Cloudflare is still converting (editors only; docs/API.md "Videos"): each is
// asked about again (the server then asks Stream) after these waits, then every last one,
// for as long as the list is open and the tab is showing, up to VIDEO_CHECK_FOR_MS.
const VIDEO_CHECK_WAITS_MS = [5000, 10000, 20000, 30000];
const VIDEO_CHECK_FOR_MS = 20 * 60 * 1000;
const isProcessingVideo = (photo) => photo.kind === 'VIDEO' && photo.videoState === 'PROCESSING';

// `display` is part of the key: a page fetched without the screen-sized copies (the hover
// postcards' early page) must never stand in for one that wants them (the photo album)
const keyOf = ({ mapId, tripId, shareCode, country, unplaced = false, limit = 30, display = false }) =>
  JSON.stringify([mapId || null, tripId || null, shareCode || null, country || null, Boolean(unplaced), limit, Boolean(display)]);

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
 * Photos of a map, a trip, or a share link, a page at a time, in the gallery's order
 * (a country's or a trip's as its editors arranged it; the whole map's newest first).
 * Filters: `country` (ISO code), or `unplaced` (only the photos with no country), and,
 * on a map, `tripId`. `display`: each photo also carries its screen-sized copy (displayUrl),
 * for a viewer that shows the list full screen (the photo album). Nothing loads while
 * `enabled` is false.
 */
export default function usePhotoPage({ mapId, tripId, shareCode, country, unplaced = false, limit = 30, display = false, enabled = true }) {
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
        const filters = { mapId, tripId, shareCode, country, unplaced, limit, display };
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
    [mapId, tripId, shareCode, country, unplaced, limit, display],
  );

  // Which list is on screen. Loading the same one again (after a change in the viewer, say)
  // keeps it there until the new page arrives, so its thumbnails stay mounted and the one
  // the viewer was opened from can take focus back; other filters start from an empty list.
  const listKeyRef = useRef(null);
  const reload = useCallback(() => {
    generationRef.current += 1;
    const key = enabled ? keyOf({ mapId, tripId, shareCode, country, unplaced, limit, display }) : null;
    if (key === null || key !== listKeyRef.current) setPhotos([]);
    listKeyRef.current = key;
    setNextCursor(null);
    if (enabled) fetchPage(null);
  }, [enabled, fetchPage, mapId, tripId, shareCode, country, unplaced, limit, display]);

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
  // New photos go first, as the server puts them
  const addPhotos = useCallback((added) => {
    setPhotos((prev) => [...added, ...prev.filter((p) => !added.some((a) => a.id === p.id))]);
  }, []);

  // A video being converted turns into a playable one (or a failed one) by itself
  const processingIds = photos.filter(isProcessingVideo).map((p) => p.id).join(',');
  useEffect(() => {
    if (!processingIds || shareCode) return undefined;
    let timer = null;
    let round = 0;
    let stopped = false;
    const started = Date.now();
    const check = async () => {
      if (document.visibilityState === 'visible') {
        const ids = processingIds.split(',');
        const answers = await Promise.allSettled(ids.map((id) => getPhoto(id)));
        if (stopped) return;
        answers.forEach((answer) => {
          const photo = answer.status === 'fulfilled' ? answer.value?.photo : null;
          if (photo && !isProcessingVideo(photo)) replacePhoto(photo);
        });
      }
      round += 1;
      if (!stopped && Date.now() - started < VIDEO_CHECK_FOR_MS) schedule();
    };
    const schedule = () => {
      timer = window.setTimeout(check, VIDEO_CHECK_WAITS_MS[Math.min(round, VIDEO_CHECK_WAITS_MS.length - 1)]);
    };
    schedule();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [processingIds, shareCode, replacePhoto]);

  // Rearranging (editors): the list moves at once, then the server is told. If it says
  // no, the list is loaded again, so it shows the order that was really saved; the
  // error is thrown on for the grid to show.
  const movePhoto = useCallback(
    async (photoId, afterId, gallery) => {
      setPhotos((prev) => placeAfter(prev, photoId, afterId));
      try {
        await movePhotoRequest(photoId, { gallery, afterId });
      } catch (err) {
        reload();
        throw err;
      }
    },
    [reload],
  );

  return { photos, nextCursor, loading, error, loadMore, reload, replacePhoto, removePhoto, addPhotos, movePhoto };
}
