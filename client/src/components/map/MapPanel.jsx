import React from 'react';
// Hooks
import useMapPanel from '@/hooks/useMapPanel';
// Components
import PaperStripHeader from '@/components/common/PaperStripHeader';

/**
 * The shell every map overlay uses (stats, settings, the trips...), as travel paperwork:
 * cream paper in the ticket edge, an aged-parchment title strip over a dashed
 * perforation and a round close stamp. The same in every map style. A floating card on
 * wide screens, a sheet above the toolbar on phones; it doesn't block the map. Focus,
 * Escape and giving focus back on closing come from useMapPanel (shared with the
 * country's ticket, CountryTicket). On wide screens its height leaves `--map-panel-top`
 * above it (8rem; the map page sets more when the verify-email banner is showing).
 */
function MapPanel({ title, onClose, children, footer = null }) {
  const { titleId, headingRef, panelProps } = useMapPanel(onClose);

  return (
    <section
      {...panelProps}
      className='ticket-edge paper-fields pointer-events-auto grid max-h-[62vh] w-full grid-rows-a1a overflow-hidden bg-paper-cream text-colour4 md:max-h-[calc(100dvh_-_var(--map-panel-top,8rem)_-_1rem)] md:w-[26rem]'
    >
      <PaperStripHeader titleId={titleId} title={title} headingRef={headingRef} onClose={onClose} closeLabel={`Close ${title}`} />
      <div className='grid content-start gap-4 overflow-y-auto px-5 py-4'>{children}</div>
      {footer ? <footer className='border-t-2 border-dashed border-poster-brown/50 px-5 py-3'>{footer}</footer> : <span />}
    </section>
  );
}

export default MapPanel;
