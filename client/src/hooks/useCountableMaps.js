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
  const [state, setState] = useState({ options: [], loading: enabled, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    getMyMaps()
      .then(({ maps }) => {
        if (cancelled) return;
        const options = (maps || [])
          .filter((map) => map.role === 'OWNER' || map.role === 'EDITOR')
          .map((map) => ({ value: map.id, label: map.role === 'OWNER' ? map.name : `${map.name} (you edit it)` }));
        setState({ options, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ options: [], loading: false, error: err.friendlyMessage || 'Your maps could not be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
