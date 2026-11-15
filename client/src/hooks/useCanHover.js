import { useSyncExternalStore } from 'react';

// Whether any pointer here can hover (a mouse, a trackpad, a pen). Phones and tablets
// without one never hover, so nothing that only shows on hover is fetched for them.
const QUERY = '(any-hover: hover)';

const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null);

/** The same answer outside React (e.g. to preload before a component mounts). */
export const canHover = () => Boolean(media()?.matches);

const subscribe = (onChange) => {
  const list = media();
  list?.addEventListener('change', onChange);
  return () => list?.removeEventListener('change', onChange);
};

export default function useCanHover() {
  return useSyncExternalStore(subscribe, canHover, () => false);
}
