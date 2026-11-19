import React, { useMemo } from 'react';
// Icons
import { FaPlane } from 'react-icons/fa';
// Hooks
import useOffers from '@/hooks/useOffers';
import useCountryGuides from '@/hooks/useCountryGuides';
// Components
import Modal from '@/components/common/Modal';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import TravelDeskShelf from './TravelDeskShelf';
import TravelDeskWhenToGo from './TravelDeskWhenToGo';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDayRange } from '@/utils/functions/dates';
import { deskShelves } from '@/utils/offers/offerContext';
import { PARTNER_OFFERS_NOTE } from '@/utils/offers/offerKinds';

// "Japan", "Italy and France", "Spain, Portugal and Morocco"
const placesWords = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] || '');

/**
 * The Travel Desk (docs/FEATURE-PLAN.md, "Travel Desk"): partner offers for a place,
 * opened only when asked, on every plan, signed in or not. A travel agent's brochure rack:
 * the label saying they're partner offers, when to go (a country guide's month strip, where
 * the country has one), then a shelf per kind of offer (places to stay, tours, flights…),
 * the countries' own first, then the general ones.
 * - `countryCodes`: the place (a country, or a trip's countries in stop order);
 * - `trip`: a tripPlace (utils/offers/offerContext.js) when it's for a trip: links carry
 *   its stops' places, and its dates when it has them (an upcoming trip);
 * - `guideOnPage`: the country guide being read (no link to itself).
 */
function TravelDeskDialog({ countryCodes, trip = null, guideOnPage = null, onClose }) {
  const { offers, loading, error } = useOffers();
  const guides = useCountryGuides(guideOnPage ? [] : countryCodes);
  const shelves = useMemo(() => deskShelves(offers, countryCodes), [offers, countryCodes]);
  const place = placesWords(countryCodes.map(countryName));
  const dates = trip?.from || trip?.to ? formatDayRange(trip.from, trip.to) : '';

  return (
    <Modal title='Travel Desk' onClose={onClose} wide>
      <div className='grid gap-2'>
        <p className='grid grid-cols-reg items-center gap-2 font-travel text-lg uppercase leading-tight tracking-wide text-poster-brown'>
          <FaPlane aria-hidden='true' />
          <span>{[place ? `For ${place}` : 'For your travels', dates].filter(Boolean).join(' · ')}</span>
        </p>
        <p className='justify-self-start -rotate-1 border-2 border-dashed border-poster-red-deep px-3 py-1.5 text-sm font-semibold text-poster-red-deep'>
          {PARTNER_OFFERS_NOTE}
        </p>
      </div>

      {(guideOnPage ? [guideOnPage] : guides).map((guide) => (
        <TravelDeskWhenToGo key={guide.code} guide={guide} linkToGuide={!guideOnPage} onLeave={onClose} />
      ))}

      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {loading && !offers.length ? (
        <div className='grid place-items-center py-6' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Fetching the offers…</span>
        </div>
      ) : null}
      {!loading && !error && !shelves.length ? (
        <p className='text-sm'>No partner offers for {place || 'this trip'} yet. Have a look another time.</p>
      ) : null}

      {shelves.length ? (
        // The rack: up to three columns of shelves, each as wide as its brochures
        <div className='grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3'>
          {shelves.map((shelf) => (
            <TravelDeskShelf key={shelf.kind} kind={shelf.kind} offers={shelf.offers} countryCodes={countryCodes} trip={trip} />
          ))}
        </div>
      ) : null}
    </Modal>
  );
}

export default TravelDeskDialog;
