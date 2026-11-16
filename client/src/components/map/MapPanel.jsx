import React from 'react';
// Hooks
import useMapPanel from '@/hooks/useMapPanel';
// Components
import PaperStripHeader from '@/components/common/PaperStripHeader';

/**
 * The shell every map overlay uses (stats, settings, the trips...), as travel paperwork:
 * cream paper in the ticket edge, an aged-parchment title strip over a dashed
 * perforation and a round close stamp. The same in every map style. A floating card on
 * wide screens (the map page centres it, as it does the country tickets; the map switcher
 * drops from the title instead), on phones the whole screen below the Menu button; it doesn't block the
 * map. Focus, Escape and giving focus back on closing come from useMapPanel (shared with
 * the country's ticket, CountryTicket). On wide screens it's at most as tall as the map
 * page's panel wrapper, which has a definite height.
 */
function MapPanel({ title, onClose, children, footer = null, wide = false }) {
  const { titleId, headingRef, panelProps } = useMapPanel(onClose);
  // `wide`: the map's Photos panel, 80% of a large screen (16 Nov 2026, the user's wish:
  // five or six photos across, not three); the rest are 26rem
  const width = wide ? 'md:w-full lg:w-[80vw] lg:max-w-full' : 'md:w-[26rem]';

  return (
    <section
      {...panelProps}
      className={`ticket-edge paper-fields pointer-events-auto grid h-full w-full grid-rows-a1a overflow-hidden bg-paper-cream text-colour4 md:h-auto md:max-h-full ${width}`}
    >
      <PaperStripHeader titleId={titleId} title={title} headingRef={headingRef} onClose={onClose} closeLabel={`Close ${title}`} />
      <div className='grid content-start gap-4 overflow-y-auto px-5 py-4'>{children}</div>
      {footer ? <footer className='border-t-2 border-dashed border-poster-brown/50 px-5 py-3'>{footer}</footer> : <span />}
    </section>
  );
}

export default MapPanel;
