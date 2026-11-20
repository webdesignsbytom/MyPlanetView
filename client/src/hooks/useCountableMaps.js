import { useEffect, useState } from 'react';
// Api
import { getMyMaps } from '@/api/travelApi';

/**
 * The maps someone can count in a friends challenge (docs/API.md, "Friends challenges"):
 * the ones they own or edit, as `[{ value, label }]` for a dropdown ("My map", "Our map
 * (you edit it)"). Nothing loads while `enabled` is false (signed out).
 * -> `{ options, loading, error }`
 */
export default function useCountableMaps({ enabled = true } = {}) {
  // `loading` is worked out, not stored: still loading whenever enabled and nothing has
  // come back yet, so turning on (once the session is read) never shows "no maps" for a
  // moment before they arrive (19 Nov 2026, the audit)
  const [state, setState] = useState({ options: [], loaded: false, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    getMyMaps()
      .then(({ maps }) => {
        if (cancelled) return;
        const options = (maps || [])
          .filter((map) => map.role === 'OWNER' || map.role === 'CO_OWNER' || map.role === 'EDITOR')
          .map((map) => ({
            value: map.id,
            label: map.role === 'OWNER' ? map.name : `${map.name} (${map.role === 'CO_OWNER' ? 'you co-own it' : 'you edit it'})`,
          }));
        setState({ options, loaded: true, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ options: [], loaded: true, error: err.friendlyMessage || 'Your maps could not be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { options: state.options, error: state.error, loading: enabled && !state.loaded };
}
