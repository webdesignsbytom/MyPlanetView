import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { getThemeAlbumPage } from '@/api/themesApi';

const PAGE = 30;

// A page added to the list: only the photos it doesn't hold already
const appendPage = (photos, page) => {
  const have = new Set(photos.map((p) => p.id));
  return [...photos, ...(page ?? []).filter((p) => !have.has(p.id))];
};

/**
 * A map's album for one monthly theme (docs/API.md, "Photo themes"): its photos, newest
 * entry first, page by page. `reload()` starts again from the first page (after a photo
 * goes in or out); `removePhoto(id)` drops one at once.
 * -> `{ photos, loading, error, nextCursor, loadMore, reload, removePhoto, replacePhoto }`
 */
export default function useThemeAlbum({ mapId = null, shareCode = null, themeId }) {
  const [state, setState] = useState({ photos: [], loading: true, error: null, nextCursor: null });
  const [version, setVersion] = useState(0);
  // Bumped whenever the list starts again, so a page asked for before then is dropped
  const generationRef = useRef(0);
  // The list as last drawn, for loadMore to read its cursor without a state updater
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const generation = ++generationRef.current;
    const current = () => generation === generationRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getThemeAlbumPage({ mapId, shareCode }, themeId, { limit: PAGE }).then(
      ({ photos, nextCursor }) => {
        if (current()) setState({ photos: photos ?? [], loading: false, error: null, nextCursor: nextCursor ?? null });
      },
      (err) => {
        if (current()) setState({ photos: [], loading: false, error: err.friendlyMessage || 'The album could not be loaded.', nextCursor: null });
      },
    );
    return () => {
      generationRef.current += 1;
    };
  }, [mapId, shareCode, themeId, version]);

  const loadMore = useCallback(() => {
    const { nextCursor: cursor, loading } = stateRef.current;
    if (!cursor || loading) return;
    const generation = generationRef.current;
    const current = () => generation === generationRef.current;
    stateRef.current = { ...stateRef.current, loading: true };
    setState((prev) => ({ ...prev, loading: true }));
    getThemeAlbumPage({ mapId, shareCode }, themeId, { cursor, limit: PAGE }).then(
      ({ photos, nextCursor }) => {
        if (current()) setState((now) => ({ ...now, loading: false, photos: appendPage(now.photos, photos), nextCursor: nextCursor ?? null }));
      },
      (err) => {
        if (current()) setState((now) => ({ ...now, loading: false, error: err.friendlyMessage || 'More photos could not be loaded.' }));
      },
    );
  }, [mapId, shareCode, themeId]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const removePhoto = useCallback((photoId) => setState((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== photoId) })), []);
  const replacePhoto = useCallback(
    (photo) => setState((prev) => ({ ...prev, photos: prev.photos.map((p) => (p.id === photo.id ? { ...p, ...photo } : p)) })),
    [],
  );

  return { ...state, loadMore, reload, removePhoto, replacePhoto };
}
