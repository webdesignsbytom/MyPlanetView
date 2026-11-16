import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
};
const getSnapshot = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY).matches : false);
// At build (pre-rendering) and before hydration: no preference known, so no motion is assumed
const getServerSnapshot = () => true;

/** Whether the viewer asked for less motion (the OS setting), following it as it changes. */
export default function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
