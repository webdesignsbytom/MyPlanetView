import { useCallback, useEffect, useState } from 'react';
// Api
import { getMapThemes } from '@/api/themesApi';

/**
 * A map's monthly themes (docs/API.md, "Photo themes"): `{ current, albums, entriesPerMap }`
 * from GET /maps/:mapId/themes, or through a map's share link. `reload()` asks again
 * without the loading state (after photos are entered or taken out).
 * -> `{ themes, loading, error, reload }`
 */
export default function useMapThemes({ mapId = null, shareCode = null, enabled = true }) {
  const [state, setState] = useState({ themes: null, loading: Boolean(enabled), error: null });

  const load = useCallback(
    () =>
      getMapThemes({ mapId, shareCode }).then(
        (themes) => setState({ themes, loading: false, error: null }),
        (err) => setState((prev) => ({ ...prev, loading: false, error: err.friendlyMessage || 'The monthly theme could not be loaded.' })),
      ),
    [mapId, shareCode],
  );

  useEffect(() => {
    if (!enabled || (!mapId && !shareCode)) return undefined;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getMapThemes({ mapId, shareCode }).then(
      (themes) => {
        if (!cancelled) setState({ themes, loading: false, error: null });
      },
      (err) => {
        if (!cancelled) setState({ themes: null, loading: false, error: err.friendlyMessage || 'The monthly theme could not be loaded.' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [mapId, shareCode, enabled]);

  return { ...state, reload: load };
}
