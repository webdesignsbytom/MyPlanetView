import React from 'react';
// Components
import PosterImage from './PosterImage';
import PosterPlaceholder from './PosterPlaceholder';
// Data
import { postersFor } from '@/utils/map/posterData';
// Utils
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';
import { formatDay } from '@/utils/functions/dates';

// The country ticket's stub (CountryTicket): the country's travel poster, always (a
// placeholder card for a country without one), then a round rubber stamp with how the
// map stands with it and, once visited, when they first went. The stamp and the date
// repeat what the ticket's fields say, so they're hidden from screen readers.
function CountryTicketStub({ code, countryName, status, firstVisitedOn }) {
  const [poster] = postersFor(code);
  const visited = countsAsVisited(status);
  const stampWords = status ? VISIT_STATUS_LABELS[status] : 'Not been yet';

  return (
    <aside className='paper-aged grid min-h-0 content-start justify-items-center gap-4 overflow-hidden border-r-2 border-dashed border-poster-brown p-2 md:p-4'>
      <figure className='grid w-full gap-1'>
        {poster ? (
          <PosterImage
            poster={poster}
            alt={`Travel poster for ${countryName}`}
            className='overflow-hidden border-4 border-poster-cream shadow-paper md:border-8'
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
    </aside>
  );
}

export default CountryTicketStub;
