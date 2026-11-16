import React from 'react';
// Hooks
import useMapPanel from '@/hooks/useMapPanel';
// Components
import CloseStamp from '@/components/common/CloseStamp';

// Where the perforation meets the ticket's top and bottom edges: half-circle punches,
// clipped by the ticket, in the poster red of the home page's frame (as the sign-in
// pages' TravelTicket notches are), whatever the map style. Their left edge sits on the
// stub's width (6.5rem on phones, 15rem from md up) less half a punch.
const PUNCH = 'pointer-events-none absolute h-5 w-5 rounded-full border-2 border-poster-brown bg-poster-red left-[5.875rem] md:left-[14.375rem]';

/**
 * A country's card on the map, styled as a boarding pass like the sign-in pages'
 * TravelTicket: the `stub` (the country's poster, CountryTicketStub) on the left behind a
 * dashed perforation, an aged-parchment header with a `kicker` line and the country's
 * name in the travel face, and the content on cream paper. With no stub it's the same
 * ticket in one piece (the country list, CountryListPanel). Behaves like every map panel
 * (useMapPanel): a non-modal dialog named by its heading, focus to the heading on
 * opening, Escape closes, "Close <title>" stamp. The map page centres it on wide
 * screens; on phones it fills the screen below the Menu button, the stub still on the left.
 */
function CountryTicket({ title, kicker, stub = null, onClose, children }) {
  const { titleId, headingRef, panelProps } = useMapPanel(onClose);
  const columns = stub ? 'grid-cols-[6.5rem_minmax(0,1fr)] md:grid-cols-[15rem_minmax(0,1fr)]' : 'grid-cols-1';
  // A country's ticket is wider than the list's (16 Nov 2026): its forms (notes, moments)
  // set fields side by side
  const width = stub ? 'md:w-[min(56rem,calc(100vw_-_12rem))]' : 'md:w-[min(46rem,calc(100vw_-_12rem))]';
  // On a phone, while a form that needs the room is open (marked `data-ticket-form`: a
  // moment's), the stub steps aside and the content takes the ticket's whole width
  const formTakesStub = 'max-md:group-has-[[data-ticket-form]]:hidden';

  return (
    <section
      {...panelProps}
      className={`ticket-edge paper-fields group pointer-events-auto relative grid h-full w-full ${columns} grid-rows-[minmax(0,1fr)] overflow-hidden rounded-lg bg-paper-cream text-colour4 md:h-auto md:max-h-full ${width} ${
        stub ? 'max-md:has-[[data-ticket-form]]:grid-cols-1' : ''
      }`}
    >
      {stub ? <div className={`contents ${formTakesStub}`}>{stub}</div> : null}
      <div className='grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]'>
        <header className='paper-aged grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b-2 border-dashed border-poster-brown py-4 pl-5 pr-4 text-poster-ink'>
          <div className='grid min-w-0 gap-1'>
            {kicker ? <div className='font-travel text-sm uppercase tracking-xl text-poster-brown'>{kicker}</div> : null}
            <h2
              id={titleId}
              ref={headingRef}
              tabIndex={-1}
              className='-rotate-1 break-words font-travel text-3xl uppercase leading-none text-poster-red text-stroke-poster focus:outline-none md:text-4xl'
            >
              {title}
            </h2>
          </div>
          <CloseStamp label={`Close ${title}`} onClick={onClose} />
        </header>
        <div className='grid content-start gap-4 overflow-y-auto px-5 py-4'>{children}</div>
      </div>
      {stub ? (
        <>
          <span aria-hidden='true' className={`${PUNCH} -top-2.5 ${formTakesStub}`} />
          <span aria-hidden='true' className={`${PUNCH} -bottom-2.5 ${formTakesStub}`} />
        </>
      ) : null}
    </section>
  );
}

export default CountryTicket;
