import { useCallback, useSyncExternalStore } from 'react';

const listFor = (query) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query) : null);

/**
 * Whether a media query matches, following it as the window changes. False until the page
 * can tell (and outside a browser), so a first render never depends on the window.
 */
export default function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = listFor(query);
      list?.addEventListener('change', onChange);
      return () => list?.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => Boolean(listFor(query)?.matches), () => false);
}
