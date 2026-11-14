import { useEffect, useState } from 'react';
// Api
import { getLandmarks } from '@/api/travelApi';

// Landmarks are reference data: fetched once per country (or once for all) per page load
const cache = new Map();
const ALL = '__all__';

function loadLandmarks(countryCode) {
  const key = countryCode || ALL;
  if (!cache.has(key)) {
    cache.set(
      key,
      getLandmarks(countryCode)
        .then(({ landmarks }) => landmarks || [])
        .catch((err) => {
          cache.delete(key);
          throw err;
        }),
    );
  }
  return cache.get(key);
}

/** Landmarks in one country, or every landmark when `countryCode` is empty. */
export default function useLandmarks(countryCode, { enabled = true } = {}) {
  const [state, setState] = useState({ landmarks: [], loading: false, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loadLandmarks(countryCode)
      .then((landmarks) => {
        if (!cancelled) setState({ landmarks, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ landmarks: [], loading: false, error: err.friendlyMessage || 'Landmarks could not be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, enabled]);

  return state;
}
