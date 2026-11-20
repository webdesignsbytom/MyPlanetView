import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

// What every map overlay does, whatever it looks like (MapPanel, the country ticket):
// focus moves to its heading when it opens; Escape closes it (unless it's closing an
// open dropdown list inside it); closing gives focus back to what opened it, when that's
// still on the page and focus would otherwise be lost.

// Each open panel's opener. A panel opened from inside another (a country from the
// list, the unplaced photos from the stats) inherits that panel's opener, as the
// first panel is gone by the time the second closes.
const openers = new WeakMap();

// Escape pressed in a dropdown whose list is open (a customizable select, where the
// options take focus) only closes that list
function inOpenDropdown(target) {
  const select = target?.closest?.('select');
  if (!select) return false;
  try {
    return select.matches(':open');
  } catch {
    return false; // a browser without :open draws its own list, which keeps the key
  }
}

function currentOpener() {
  if (typeof document === 'undefined') return null;
  const active = document.activeElement;
  if (!active || active === document.body) return null;
  const panel = active.closest?.('[data-map-panel]');
  return panel ? openers.get(panel) || null : active;
}

/**
 * -> `{ titleId, headingRef, panelProps }`: spread `panelProps` on the panel's element
 * (a non-modal dialog labelled by the heading with `titleId`), and put `headingRef` on
 * that heading (with tabIndex -1).
 */
export default function useMapPanel(onClose) {
  const titleId = useId();
  const headingRef = useRef(null);
  const panelRef = useRef(null);
  // Read before the panel draws, so nothing inside it has taken focus yet
  const [opener] = useState(currentOpener);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel && opener) openers.set(panel, opener);
  }, [opener]);

  useEffect(() => {
    headingRef.current?.focus();
    return () => {
      // By now the panel is gone: focus that was in it has dropped to the page. Back to the
      // opener, or, when there's none left (a panel whose code arrived after the one that
      // opened it had gone, or an opener that went with its panel), to the map itself, so
      // focus never starts again from the top of the page (19 Nov 2026, the audit)
      const active = document.activeElement;
      const lost = !active || active === document.body;
      if (!lost) return;
      const target = opener?.isConnected ? opener : document.querySelector('#main-content [role="application"]');
      target?.focus({ preventScroll: true });
    };
  }, [opener]);

  const panelProps = {
    ref: panelRef,
    'data-map-panel': '',
    role: 'dialog',
    'aria-modal': 'false',
    'aria-labelledby': titleId,
    onKeyDown: (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !inOpenDropdown(e.target)) {
        e.stopPropagation();
        onClose();
      }
    },
  };

  return { titleId, headingRef, panelProps };
}
