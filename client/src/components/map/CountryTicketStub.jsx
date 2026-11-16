import React from 'react';
import { Link } from 'react-router-dom';
import { FaBookOpen } from 'react-icons/fa';
// Components
import PosterImage from './PosterImage';
import PosterPlaceholder from './PosterPlaceholder';
// Data
import { postersFor } from '@/utils/map/posterData';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
// Utils
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';
import { countryPagePath } from '@/utils/constants/routes';
import { countryOf } from '@/utils/map/ukNations';
import { formatDay } from '@/utils/functions/dates';

// The country ticket's stub (CountryTicket): the country's travel poster, always (a
// placeholder card for a country without one), then a round rubber stamp with how the
// map stands with it and, once visited, when they first went. The stamp and the date
// repeat what the ticket's fields say, so they're hidden from screen readers. At the
// bottom, a link to the country's guide, `/countries/<slug>` (a UK nation's is the UK's),
// on every ticket: the guides are being written, and a guide not in this build yet opens
// the site's "not found" page (the guides use the country list's slugs).
function CountryTicketStub({ code, countryName, status, firstVisitedOn }) {
  const [poster] = postersFor(code);
  const guideSlug = COUNTRY_BY_CODE[countryOf(code)]?.slug;
  const visited = countsAsVisited(status);
  const stampWords = status ? VISIT_STATUS_LABELS[status] : 'Not been yet';

  return (
    <aside
      className={`paper-aged grid min-h-0 gap-4 overflow-hidden border-r-2 border-dashed border-poster-brown p-2 md:p-4 ${
        guideSlug ? 'grid-rows-[minmax(0,1fr)_auto]' : ''
      }`}
    >
      <div className='grid min-h-0 content-start justify-items-center gap-4'>
        <figure className='grid w-full gap-1'>
          {poster ? (
            <PosterImage
              poster={poster}
              alt={`Travel poster for ${countryName}`}
              // No cream border: the posters have their own printed one (17 Nov 2026)
              className='overflow-hidden shadow-paper'
            />
          ) : (
            <PosterPlaceholder countryName={countryName} compact />
          )}
          {visited ? null : (
            <figcaption className='text-center font-travel text-xs uppercase tracking-wide text-poster-brown'>Somewhere to go next?</figcaption>
          )}
        </figure>
        <span
          aria-hidden='true'
          className={`grid h-20 w-20 -rotate-12 place-content-center rounded-full border-4 border-double p-1 text-center font-travel text-xs uppercase leading-tight ${
            visited ? 'border-poster-red text-poster-red' : 'border-poster-brown text-poster-brown'
          }`}
        >
          {stampWords}
        </span>
        {visited && firstVisitedOn ? (
          <p aria-hidden='true' className='grid w-full text-center font-travel text-2xs uppercase text-poster-brown [overflow-wrap:anywhere] md:text-xs md:tracking-wide'>
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
          <FaBookOpen aria-hidden='true' className='hidden h-4 w-4 self-center md:block' />
          Country guide
        </Link>
      ) : null}
    </aside>
  );
}

export default CountryTicketStub;
