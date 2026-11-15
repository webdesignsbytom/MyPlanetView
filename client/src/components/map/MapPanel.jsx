import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
// Components
import PaperStripHeader from '@/components/common/PaperStripHeader';

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
 * The shell every map overlay uses (stats, settings, a country, the trips...), as travel
 * paperwork: cream paper in the ticket edge, an aged-parchment title strip over a dashed
 * perforation and a round close stamp. The same in every map style. A floating card on
 * wide screens, a sheet above the toolbar on phones; it doesn't block the map. Focus
 * moves to its heading when it opens; Escape closes it (unless it's closing an open
 * dropdown list inside it). Closing gives focus back to what
 * opened it (when that's still on the page and focus would otherwise be lost). On wide
 * screens its height leaves `--map-panel-top` above it (8rem; the map page sets more
 * when the verify-email banner is showing).
 */
function MapPanel({ title, onClose, children, footer = null }) {
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
      // By now the panel is gone: focus that was in it has dropped to the page
      const active = document.activeElement;
      const lost = !active || active === document.body;
      if (lost && opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [opener]);

  return (
    <section
      ref={panelRef}
      data-map-panel=''
      role='dialog'
      aria-modal='false'
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !e.defaultPrevented && !inOpenDropdown(e.target)) {
          e.stopPropagation();
          onClose();
        }
      }}
      className='ticket-edge paper-fields pointer-events-auto grid max-h-[62vh] w-full grid-rows-a1a overflow-hidden bg-paper-cream text-colour4 md:max-h-[calc(100dvh_-_var(--map-panel-top,8rem)_-_1rem)] md:w-[26rem]'
    >
      <PaperStripHeader titleId={titleId} title={title} headingRef={headingRef} onClose={onClose} closeLabel={`Close ${title}`} />
      <div className='grid content-start gap-4 overflow-y-auto px-5 py-4'>{children}</div>
      {footer ? <footer className='border-t-2 border-dashed border-poster-brown/50 px-5 py-3'>{footer}</footer> : <span />}
    </section>
  );
}

export default MapPanel;
