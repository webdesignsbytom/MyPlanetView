import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// A lazy page's code can take a moment to arrive; stop looking for a #hash target, or
// waiting for the page to be tall enough to scroll back to, after this
const HASH_WAIT_MS = 5000;

// How far down each history entry was scrolled (location.key → scrollY), for back and
// forward. The browser's own restoring comes at popstate, before a lazy page has drawn,
// so it lands short or at the top
const scrollByEntry = new Map();

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
 * scroll to the top; back and forward return to where that page was scrolled instead,
 * once it's tall enough. With a #hash (/user-agreements#privacy-policy, /about#how-it-works,
 * the skip link), scroll to that element instead, once the page has drawn it: the one
 * place hash links are handled. A hash link to the page you're on scrolls again, and
 * the first load scrolls to its hash without taking focus.
 */
export default function useFocusMainOnRouteChange() {
  const { pathname, hash, key } = useLocation();
  const navType = useNavigationType(); // 'POP' for back and forward
  const isFirstRender = useRef(true);
  // Every click on a hash link counts (the same one twice, or on the same page)
  const hashVisit = hash ? key : '';
  // Every step back or forward counts too
  const popVisit = navType === 'POP' ? key : '';

  // Note this entry's scroll as the person scrolls. A layout effect, so it stops listening
  // during the commit that leaves the page, before the next page's height can move the
  // scroll and overwrite where this one was
  useLayoutEffect(() => {
    const note = () => scrollByEntry.set(key, window.scrollY);
    window.addEventListener('scroll', note, { passive: true });
    return () => window.removeEventListener('scroll', note);
  }, [key]);

  useEffect(() => {
    const first = isFirstRender.current;
    isFirstRender.current = false;

    if (!hash && popVisit) {
      if (first) return undefined;
      const y = scrollByEntry.get(popVisit) || 0;
      const started = performance.now();
      let frame = 0;
      const restore = () => {
        const room = document.documentElement.scrollHeight - window.innerHeight;
        if (room >= y || performance.now() - started >= HASH_WAIT_MS) {
          focusMain();
          window.scrollTo(0, y);
        } else {
          frame = requestAnimationFrame(restore);
        }
      };
      frame = requestAnimationFrame(restore);
      return () => cancelAnimationFrame(frame);
    }

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
  }, [pathname, hash, hashVisit, popVisit]);
}
