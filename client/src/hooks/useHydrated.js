import { useSyncExternalStore } from 'react';

const never = () => () => {};

/**
 * False in the first render (the build's pre-render, and hydration, which must draw the same),
 * true from then on in the browser. For markup a pre-rendered page mustn't carry: the
 * dropdowns' `<button><selectedcontent>` (customizable select), which a browser without it
 * drops from the HTML, so hydrating it failed (19 Nov 2026, the audit).
 */
export default function useHydrated() {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}
