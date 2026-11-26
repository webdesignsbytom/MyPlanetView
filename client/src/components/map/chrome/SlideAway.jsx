import React, { useLayoutEffect, useRef, useState } from 'react';
// Hooks
import useMapChrome from '@/hooks/useMapChrome';
// Utils
import { exitOffset } from '@/utils/map/slideAway';

/**
 * A piece of the map page's furniture (a menu, a tag, the zoom stamps, a panel) that slides off
 * the screen by its closest side while the menus are hidden (useMapChrome; 25 Nov 2026, the
 * user's wish), and back again; a jump with reduced motion. It's a plain `div` with the
 * `className` and other props given, so it can stand in for the wrapper that places the piece.
 * `measure`: a selector for the part whose place decides the way out (a centred panel inside a
 * wrapper as big as the screen), else the wrapper itself. `toward` forces a side, and `margin`
 * how far past the edge it goes (the toolbar goes right by its own width, so the tab on its left
 * stays on the screen's edge). Hidden, it's `inert`, out of the keyboard's and screen readers'
 * way, unless `interactive` (the toolbar's wrapper, which holds the tab).
 */
function SlideAway({ children, className = '', measure = null, toward = null, margin = 24, interactive = false, ...rest }) {
  const { hidden } = useMapChrome();
  const ref = useRef(null);
  const [offset, setOffset] = useState(null);

  // Measured where it stands (any move taken off first), again as the window changes
  useLayoutEffect(() => {
    if (!hidden) {
      setOffset(null);
      return undefined;
    }
    const place = () => {
      const box = ref.current;
      if (!box) return;
      const target = (measure && box.querySelector(measure)) || box;
      const moved = box.style.transform;
      box.style.transform = '';
      const rect = target.getBoundingClientRect();
      box.style.transform = moved;
      setOffset(exitOffset(rect, { width: window.innerWidth, height: window.innerHeight }, { margin, toward }));
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [hidden, measure, toward, margin]);

  return (
    <div
      ref={ref}
      {...rest}
      inert={hidden && !interactive ? true : undefined}
      data-slid-away={hidden ? (offset?.side ?? '') : undefined}
      className={`${className} motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-in-out`}
      style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
    >
      {children}
    </div>
  );
}

export default SlideAway;
