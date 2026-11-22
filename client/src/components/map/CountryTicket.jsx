import React from 'react';
// Hooks
import useMapPanel from '@/hooks/useMapPanel';
// Components
import CloseStamp from '@/components/common/CloseStamp';

// Where the perforation meets the ticket's top and bottom edges: half-circle punches,
// clipped by the ticket, in the poster red of the home page's frame (as the sign-in
// pages' TravelTicket notches are), whatever the map style. Their left edge sits on the
// stub's width (6.5rem on phones, 15rem from md up) less half a punch.
const PUNCH = 'pointer-events-none absolute h-5 w-5 rounded-full border-2 border-poster-brown bg-poster-red left-[5.875rem] nophone:left-[14.375rem]';

// The header's layout. On phones and tablets the action and the close stamp share the
// kicker's row, and the name has the whole width under them (23 Nov 2026, the user's wish:
// a long name ran under them). From lg they stand beside the name, in the middle of the
// header's height (18 Nov 2026, the user's wish). A phone held sideways hides the kicker, so
// there they stand beside the name too, keeping that header slim.
const HEADER_AREAS =
  "[grid-template-areas:'kicker_actions'_'title_title'_'subtitle_subtitle'] lg:[grid-template-areas:'kicker_actions'_'title_actions'_'subtitle_actions'] sideways:[grid-template-areas:'title_actions'_'subtitle_actions']";

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
// `action`: a button in the header's row, before the close stamp ("Open country": CountryPanel);
// `subtitle`: a line under the title ("2 of 51 states visited")
function CountryTicket({ title, kicker, subtitle = null, stub = null, action = null, onClose, children }) {
  const { titleId, headingRef, panelProps } = useMapPanel(onClose);
  const columns = stub ? 'grid-cols-[6.5rem_minmax(0,1fr)] nophone:grid-cols-[15rem_minmax(0,1fr)]' : 'grid-cols-1';
  // A country's ticket is wider than the list's (16 Nov 2026): its forms (notes, moments)
  // set fields side by side
  const width = stub ? 'nophone:w-[min(56rem,calc(100vw_-_12rem))]' : 'nophone:w-[min(46rem,calc(100vw_-_12rem))]';
  // On a phone, while a form that needs the room is open (marked `data-ticket-form`: a
  // moment's), the stub steps aside and the content takes the ticket's whole width
  const formTakesStub = 'phone:group-has-[[data-ticket-form]]:hidden';

  return (
    <section
      {...panelProps}
      className={`ticket-edge paper-fields group pointer-events-auto relative grid h-full w-full ${columns} grid-rows-[minmax(0,1fr)] overflow-hidden rounded-lg bg-paper-cream text-colour4 nophone:h-auto nophone:max-h-full ${width} ${
        stub ? 'phone:has-[[data-ticket-form]]:grid-cols-1' : ''
      }`}
    >
      {stub ? <div className={`contents ${formTakesStub}`}>{stub}</div> : null}
      <div className='grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]'>
        {/* Slimmer on a phone held sideways (under 500px tall), where it took a third of the
            screen and left room for a row or two of the list (19 Nov 2026, the audit) */}
        <header
          className={`paper-aged grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b-2 border-dashed border-poster-brown py-4 pl-5 pr-4 text-poster-ink sideways:py-2 ${HEADER_AREAS}`}
        >
          {kicker ? (
            <div className='font-travel text-sm uppercase tracking-xl text-poster-brown [grid-area:kicker] sideways:hidden'>{kicker}</div>
          ) : null}
          {/* The name a size smaller on phones and tablets (23 Nov 2026, the user's wish) */}
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className='-rotate-1 break-words pt-1 font-travel text-2xl uppercase leading-none text-poster-red text-stroke-poster [grid-area:title] focus:outline-none md:text-3xl lg:text-4xl sideways:pt-0 sideways:text-xl'
          >
            {title}
          </h2>
          {subtitle ? <div className='pt-2 text-sm font-medium [grid-area:subtitle]'>{subtitle}</div> : null}
          {/* The action and the close stamp in one row, lined up on each other's middles */}
          <div className='grid grid-flow-col items-center gap-3 [grid-area:actions]' data-ticket-actions=''>
            {action}
            <CloseStamp label={`Close ${title}`} onClick={onClose} smallUntilLg />
          </div>
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
