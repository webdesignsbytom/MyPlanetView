import React from 'react';
// Hooks
import useGalleryOffers from '@/hooks/useGalleryOffers';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
// Components
import OfferBrochure from '@/components/offers/OfferBrochure';

// How many of the show's last photos say where it ended
const AROUND = 12;

/**
 * The one travel offer a slideshow shows (docs/API.md, "Travel offers"), on its end card,
 * never mid-show, and only where the galleries show cards (`every`, the map or trip's
 * `ads.every`). SLIDESHOW placement, chosen as a gallery's card is: the soonest planned
 * trip's destination, the show's country, then the country of its last photos.
 */
function SlideshowOffer({ every, slotKey, country = null, photos, nextTrip = null, canFetchTrips = true }) {
  const plannedTrip = usePlannedTripPlace(nextTrip, { canFetch: canFetchTrips });
  const slots = useGalleryOffers({ every, slotKey, placement: 'SLIDESHOW', country, plannedTrip });
  const card = slots?.cardAt(0, photos.slice(-AROUND).reverse()) || null;
  if (!card) return null;

  return (
    <div className='grid w-full max-w-xl text-left'>
      <OfferBrochure wide offer={card.offer} href={card.href} />
    </div>
  );
}

export default SlideshowOffer;
