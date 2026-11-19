import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Every request is numbered and only the newest one's answer counts: a reload still on its
  // way when the map changes never lands on the next map (19 Nov 2026, the audit)
  const runRef = useRef(0);

  const load = useCallback(() => {
    const run = ++runRef.current;
    return getMapThemes({ mapId, shareCode }).then(
      (themes) => {
        if (run === runRef.current) setState({ themes, loading: false, error: null });
      },
      (err) => {
        if (run === runRef.current) setState((prev) => ({ ...prev, loading: false, error: err.friendlyMessage || 'The monthly theme could not be loaded.' }));
      },
    );
  }, [mapId, shareCode]);

  useEffect(() => {
    if (!enabled || (!mapId && !shareCode)) return undefined;
    const run = ++runRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getMapThemes({ mapId, shareCode }).then(
      (themes) => {
        if (run === runRef.current) setState({ themes, loading: false, error: null });
      },
      (err) => {
        if (run === runRef.current) setState({ themes: null, loading: false, error: err.friendlyMessage || 'The monthly theme could not be loaded.' });
      },
    );
    return () => {
      runRef.current += 1;
    };
  }, [mapId, shareCode, enabled]);

  return { ...state, reload: load };
}
