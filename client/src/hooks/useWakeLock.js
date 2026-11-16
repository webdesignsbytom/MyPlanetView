import { useEffect } from 'react';

/**
 * Keeps the screen awake while `active` (the Screen Wake Lock API), as a slideshow plays.
 * The browser lets go of the lock when the tab is hidden, so it's asked for again when the
 * tab shows; it's released as soon as `active` turns false or the component goes. Where
 * the API is missing or says no (battery saver), nothing happens.
 */
export default function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock?.request) return undefined;
    let lock = null;
    let done = false;

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (done) {
          next.release().catch(() => {});
          return;
        }
        lock = next;
        lock.addEventListener('release', () => {
          if (lock === next) lock = null;
        });
      } catch {
        // Refused (a hidden tab, battery saver): the screen may sleep, nothing else changes
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lock) request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      done = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
      lock = null;
    };
  }, [active]);
}
