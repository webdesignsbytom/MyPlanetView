import { useCallback, useEffect, useState } from 'react';
// Api
import { getThemeAlbumPage } from '@/api/themesApi';

const PAGE = 30;

/**
 * A map's album for one monthly theme (docs/API.md, "Photo themes"): its photos, newest
 * entry first, page by page. `reload()` starts again from the first page (after a photo
 * goes in or out); `removePhoto(id)` drops one at once.
 * -> `{ photos, loading, error, nextCursor, loadMore, reload, removePhoto, replacePhoto }`
 */
export default function useThemeAlbum({ mapId = null, shareCode = null, themeId }) {
  const [state, setState] = useState({ photos: [], loading: true, error: null, nextCursor: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getThemeAlbumPage({ mapId, shareCode }, themeId, { limit: PAGE }).then(
      ({ photos, nextCursor }) => {
        if (!cancelled) setState({ photos: photos ?? [], loading: false, error: null, nextCursor: nextCursor ?? null });
      },
      (err) => {
        if (!cancelled) setState({ photos: [], loading: false, error: err.friendlyMessage || 'The album could not be loaded.', nextCursor: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [mapId, shareCode, themeId, version]);

  const loadMore = useCallback(() => {
    setState((prev) => {
      if (!prev.nextCursor || prev.loading) return prev;
      getThemeAlbumPage({ mapId, shareCode }, themeId, { cursor: prev.nextCursor, limit: PAGE }).then(
        ({ photos, nextCursor }) =>
          setState((now) => ({ ...now, loading: false, photos: [...now.photos, ...(photos ?? [])], nextCursor: nextCursor ?? null })),
        (err) => setState((now) => ({ ...now, loading: false, error: err.friendlyMessage || 'More photos could not be loaded.' })),
      );
      return { ...prev, loading: true };
    });
  }, [mapId, shareCode, themeId]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const removePhoto = useCallback((photoId) => setState((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== photoId) })), []);
  const replacePhoto = useCallback(
    (photo) => setState((prev) => ({ ...prev, photos: prev.photos.map((p) => (p.id === photo.id ? { ...p, ...photo } : p)) })),
    [],
  );

  return { ...state, loadMore, reload, removePhoto, replacePhoto };
}
