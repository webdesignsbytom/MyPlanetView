import { useEffect, useState } from 'react';
// Api
import { getOffers } from '@/api/offersApi';

const NONE = [];

/**
 * Every live travel offer (docs/API.md, "Travel offers"), fetched once per session and
 * shared by every card and the Travel Desk. Nothing loads while `enabled` is false.
 * The first render never has them, even when they're already here: the country pages are
 * pre-rendered, and their first render must match the build's, so the list always
 * arrives in an effect.
 * -> `{ offers, loading, error }`
 */
export default function useOffers({ enabled = true } = {}) {
  // Loading from the start when wanted, so nothing says "no offers" before the list is asked for
  const [state, setState] = useState(() => ({ offers: NONE, loading: enabled, error: null }));

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setState((prev) => (prev.offers.length ? prev : { ...prev, loading: true, error: null }));
    getOffers()
      .then((offers) => {
        if (!cancelled) setState({ offers, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ offers: NONE, loading: false, error: err.friendlyMessage || 'The travel offers could not be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
