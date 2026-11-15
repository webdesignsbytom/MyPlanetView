import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// A lazy page's code can take a moment to arrive; stop looking for a #hash target after this
const HASH_WAIT_MS = 5000;

const focusMain = () => document.getElementById('main-content')?.focus({ preventScroll: true });

function hashTarget(hash) {
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep it as written
  }
  return id ? document.getElementById(id) : null;
}

/**
 * After a route change, focus #main-content (screen readers start on the new page) and
 * scroll to the top. With a #hash (/user-agreements#privacy-policy, /about#how-it-works,
 * the skip link), scroll to that element instead, once the page has drawn it: the one
 * place hash links are handled. A hash link to the page you're on scrolls again, and
 * the first load scrolls to its hash without taking focus.
 */
export default function useFocusMainOnRouteChange() {
  const { pathname, hash, key } = useLocation();
  const isFirstRender = useRef(true);
  // Every click on a hash link counts (the same one twice, or on the same page)
  const hashVisit = hash ? key : '';

  useEffect(() => {
    const first = isFirstRender.current;
    isFirstRender.current = false;

    if (!hash) {
      if (first) return undefined;
      // small delay so content exists
      const timer = setTimeout(() => {
        focusMain();
        window.scrollTo(0, 0);
      }, 0);
      return () => clearTimeout(timer);
    }

    const started = performance.now();
    let frame = 0;
    const seek = () => {
      const target = hashTarget(hash);
      if (target) {
        if (!first) focusMain();
        target.scrollIntoView({ block: 'start' });
      } else if (performance.now() - started < HASH_WAIT_MS) {
        frame = requestAnimationFrame(seek);
      }
    };
    frame = requestAnimationFrame(seek);
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, hashVisit]);
}
