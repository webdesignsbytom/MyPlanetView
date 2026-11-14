import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Focus #main-content on route change (skips initial load)
export default function useFocusMainOnRouteChange() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // small delay so content exists
    const timer = setTimeout(() => {
      const el = document.getElementById('main-content');
      if (el) el.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);
}
