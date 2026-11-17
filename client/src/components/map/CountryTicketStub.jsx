import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBookOpen } from 'react-icons/fa';
// Components
import PosterImage from './PosterImage';
import PosterPlaceholder from './PosterPlaceholder';
import PosterViewer from './PosterViewer';
// Data
import { postersFor } from '@/utils/map/posterData';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
// Utils
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';
import { countryPagePath } from '@/utils/constants/routes';
import { countryOf } from '@/utils/map/ukNations';
import { formatDay } from '@/utils/functions/dates';

// The country ticket's stub (CountryTicket): the country's travel poster, always (a
// placeholder card for a country without one), then either `controls` (an editor's
// "Been there?" and "First went", on wide screens: CountryPanel, 17 Nov 2026) or, for
// everyone else, a round rubber stamp with how the map stands with it and, once visited,
// when they first went (hidden from screen readers: they repeat the ticket's own line).
// With the controls the poster shrinks on a short window so they still fit under it, and
// the top part scrolls should it still not fit, so they're never cut off. At the
// bottom, a link to the country's guide, `/countries/<slug>` (a UK nation's is the UK's),
// on every ticket: the guides are being written, and a guide not in this build yet opens
// the site's "not found" page (the guides use the country list's slugs). A tap on the
// poster shows it full screen (PosterViewer; 17 Nov 2026, the user's wish).
function CountryTicketStub({ code, countryName, status, firstVisitedOn, controls = null }) {
  const [poster] = postersFor(code);
  const [viewing, setViewing] = useState(false);
  const guideSlug = COUNTRY_BY_CODE[countryOf(code)]?.slug;
  const visited = countsAsVisited(status);
  const stampWords = status ? VISIT_STATUS_LABELS[status] : 'Not been yet';
  // With the controls under it: no taller than the window leaves room for (2:3 posters; the
  // panel's offsets, the stub's padding, the guide link and the controls with a date take
  // about 28rem), at least 6rem wide
  const posterWidth = controls ? 'w-[clamp(6rem,calc((100svh_-_28rem)_/_1.5),100%)]' : 'w-full';

  return (
    <aside
      className={`paper-aged grid min-h-0 gap-4 overflow-hidden border-r-2 border-dashed border-poster-brown p-2 nophone:p-4 ${
        guideSlug ? 'grid-rows-[minmax(0,1fr)_auto]' : ''
      }`}
    >
      {/* -m-2 p-2: the scrolling box reaches into the stub's padding, so the poster's
          shadow and a field's focus ring aren't clipped by it */}
      <div className='-m-2 grid min-h-0 content-start justify-items-center gap-4 overflow-y-auto p-2'>
        <figure className={`grid gap-1 ${posterWidth}`}>
          {poster ? (
            <button
              type='button'
              onClick={() => setViewing(true)}
              aria-label={`Show the travel poster for ${countryName} full screen`}
              className='grid cursor-zoom-in transition hover:brightness-105'
            >
              <PosterImage
                poster={poster}
                alt=''
                // No cream border: the posters have their own printed one (17 Nov 2026)
                className='overflow-hidden shadow-paper'
              />
            </button>
          ) : (
            <PosterPlaceholder countryName={countryName} compact />
          )}
          {visited ? null : (
            <figcaption className='text-center font-travel text-xs uppercase tracking-wide text-poster-brown'>Somewhere to go next?</figcaption>
          )}
        </figure>
        {controls || (
          <span
            aria-hidden='true'
            className={`grid h-20 w-20 -rotate-12 place-content-center rounded-full border-4 border-double p-1 text-center font-travel text-xs uppercase leading-tight ${
              visited ? 'border-poster-red text-poster-red' : 'border-poster-brown text-poster-brown'
            }`}
          >
            {stampWords}
          </span>
        )}
        {visited && firstVisitedOn && !controls ? (
          <p aria-hidden='true' className='grid w-full text-center font-travel text-2xs uppercase text-poster-brown [overflow-wrap:anywhere] nophone:text-xs nophone:tracking-wide'>
            <span>First went</span>
            <span>{formatDay(firstVisitedOn)}</span>
          </p>
        ) : null}
      </div>
      {guideSlug ? (
        <Link
          to={countryPagePath(guideSlug)}
          className='btn-paper w-full grid-flow-col justify-center gap-2 text-center [grid-auto-columns:minmax(0,max-content)] [--btn-leading:1.25rem] [--btn-pad-x:0.5rem] [--btn-pad-y:0.25rem] [--btn-size:0.9375rem]'
        >
          <FaBookOpen aria-hidden='true' className='hidden h-4 w-4 self-center nophone:block' />
          Country guide
        </Link>
      ) : null}
      {viewing && poster ? <PosterViewer poster={poster} countryName={countryName} onClose={() => setViewing(false)} /> : null}
    </aside>
  );
}

export default CountryTicketStub;
