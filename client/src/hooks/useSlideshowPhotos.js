import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { getPhotoPage } from '@/api/travelApi';
// Utils
import { SLIDE_PAGE_SIZE } from '@/utils/photos/slideshow';

const START = { photos: [], nextCursor: null, loading: true, error: null, complete: false, stale: false };
// A video plays only once Cloudflare has converted it (docs/API.md "Videos"): its editors'
// lists also hold ones still converting, or failed, with nothing to play, so the show skips them
const playable = (photo) => photo.kind !== 'VIDEO' || Boolean(photo.videoUrl);

/**
 * The photos a slideshow plays (docs/API.md, "Slideshows"): a map's (`mapId`), a trip's
 * (`tripId`) or a share link's (`shareCode`), optionally one `country`'s, oldest taken
 * first (`order: 'taken'`) or shuffled by `seed` (`order: 'shuffle'`), each with its
 * display copy, a page at a time. `run` starts it again from the first page. `stale`: the
 * server no longer had the last photo in its shuffled order (deleted or hidden meanwhile),
 * so the show has to start again.
 */
export default function useSlideshowPhotos({ mapId, tripId, shareCode, country, order, seed, run = 0 }) {
  const [state, setState] = useState(START);
  const generationRef = useRef(0);

  const fetchPage = useCallback(
    async (cursor) => {
      const generation = generationRef.current;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const page = await getPhotoPage({ mapId, tripId, shareCode, country, order, seed, display: true, limit: SLIDE_PAGE_SIZE, cursor });
        if (generation !== generationRef.current) return;
        const photos = (page.photos || []).filter(playable);
        setState((prev) => ({
          ...prev,
          photos: cursor ? [...prev.photos, ...photos] : photos,
          nextCursor: page.nextCursor || null,
          complete: !page.nextCursor,
          loading: false,
        }));
      } catch (err) {
        if (generation !== generationRef.current) return;
        const stale = Boolean(cursor) && order === 'shuffle' && err.response?.status === 400;
        setState((prev) => ({ ...prev, loading: false, stale, error: stale ? null : err.friendlyMessage || 'The photos could not be loaded.' }));
      }
    },
    [mapId, tripId, shareCode, country, order, seed],
  );

  useEffect(() => {
    generationRef.current += 1;
    setState(START);
    fetchPage(null);
  }, [fetchPage, run]);

  const { nextCursor, loading } = state;
  const loadMore = useCallback(() => {
    if (nextCursor && !loading) fetchPage(nextCursor);
  }, [nextCursor, loading, fetchPage]);

  return { ...state, loadMore };
}
