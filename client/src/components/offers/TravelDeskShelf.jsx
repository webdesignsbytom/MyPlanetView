import React from 'react';
// Components
import OfferBrochure from './OfferBrochure';
// Api
import { offerClickUrl } from '@/api/offersApi';
// Utils
import { OFFER_SHELF_TITLES } from '@/utils/offers/offerKinds';
import { deskLink } from '@/utils/offers/offerContext';

// A shelf as wide as its brochures, up to the rack's three columns, so shelves of one
// brochure stand side by side instead of a long column of lone cards
const SHELF_SPAN = ['', 'sm:col-span-2', 'sm:col-span-2 lg:col-span-3'];
const SHELF_COLUMNS = ['', 'sm:grid-cols-2', 'sm:grid-cols-2 lg:grid-cols-3'];

/**
 * One shelf of the Travel Desk's brochure rack: one kind of offer ("Places to stay"),
 * its brochures side by side on a wooden ledge. Each link carries what the desk knows
 * (offerContext.js deskLink): the place, and a planned trip's dates.
 */
function TravelDeskShelf({ kind, offers, countryCodes, trip }) {
  const headingId = `travel-desk-${kind.toLowerCase()}`;
  const width = Math.min(offers.length, 3) - 1;
  return (
    <section aria-labelledby={headingId} className={`grid content-start gap-3 ${SHELF_SPAN[width]}`}>
      <h3 id={headingId} className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
        {OFFER_SHELF_TITLES[kind] || OFFER_SHELF_TITLES.OTHER}
      </h3>
      <ul className={`grid gap-3 border-b-4 border-double border-poster-brown pb-4 ${SHELF_COLUMNS[width]}`}>
        {offers.map((offer) => (
          <li key={offer.id} className='grid'>
            <OfferBrochure offer={offer} href={offerClickUrl(offer, { placement: 'TRAVEL_DESK', ...deskLink(offer, { countryCodes, trip }) })} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TravelDeskShelf;
