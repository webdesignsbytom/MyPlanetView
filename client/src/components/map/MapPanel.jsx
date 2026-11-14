import React, { useEffect, useId, useRef } from 'react';
// Components
import PaperStripHeader from '@/components/common/PaperStripHeader';

/**
 * The shell every map overlay uses (stats, settings, a country, the trips...), as travel
 * paperwork: cream paper in the ticket edge, an aged-parchment title strip over a dashed
 * perforation and a round close stamp. The same in every map style. A floating card on
 * wide screens, a sheet above the toolbar on phones; it doesn't block the map. Focus
 * moves to its heading when it opens; Escape closes it.
 */
function MapPanel({ title, onClose, children, footer = null }) {
  const titleId = useId();
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      role='dialog'
      aria-modal='false'
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      className='ticket-edge paper-fields pointer-events-auto grid max-h-[62vh] w-full grid-rows-a1a overflow-hidden bg-paper-cream text-colour4 md:max-h-[calc(100dvh-9rem)] md:w-[26rem]'
    >
      <PaperStripHeader titleId={titleId} title={title} headingRef={headingRef} onClose={onClose} closeLabel={`Close ${title}`} />
      <div className='grid content-start gap-4 overflow-y-auto px-5 py-4'>{children}</div>
      {footer ? <footer className='border-t-2 border-dashed border-poster-brown/50 px-5 py-3'>{footer}</footer> : <span />}
    </section>
  );
}

export default MapPanel;
