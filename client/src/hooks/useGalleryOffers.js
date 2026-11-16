import { useMemo } from 'react';
// Hooks
import useOffers from './useOffers';
// Api
import { offerClickUrl } from '@/api/offersApi';
// Utils
import { chooseOffer, mostCommonCountry } from '@/utils/offers/chooseOffer';
import { choiceContext, linkForChoice } from '@/utils/offers/offerContext';

/**
 * The travel offer cards for a photo gallery or a slideshow (docs/API.md, "Travel
 * offers"), or null when it shows none: `{ every, cardAt(slot, around) }`.
 * - `every`: the map or trip's `ads.every` (the server's call: null for a paying viewer,
 *   or on a First Class map); the offers are only fetched when it's set.
 * - `cardAt(slot, around)` -> `{ offer, href }` or null: the card for slot number `slot`
 *   (0, 1, …), given the photos around it, nearest first. The same slot gets the same card
 *   every time (seeded from `slotKey` and the number).
 * - `slotKey`: names the gallery ("trip:<id>", "map:<id>:FR"); `placement` GALLERY or
 *   SLIDESHOW; `country`: the country being viewed; `plannedTrip`: usePlannedTripPlace's
 *   (undefined while it's fetched: no cards until it's here).
 */
export default function useGalleryOffers({ every, slotKey, placement = 'GALLERY', country = null, plannedTrip = null }) {
  const { offers } = useOffers({ enabled: Boolean(every) });

  return useMemo(() => {
    // plannedTrip undefined: where the trip goes is still being fetched, and it may change the cards
    if (!every || !offers.length || plannedTrip === undefined) return null;
    return {
      every,
      cardAt: (slot, around = []) => {
        const context = { plannedTrip, country, aroundCountry: mostCommonCountry(around) };
        const choice = chooseOffer(offers, choiceContext(placement, context), `${slotKey}#${slot}`);
        if (!choice) return null;
        return { offer: choice.offer, href: offerClickUrl(choice.offer, { placement, ...linkForChoice(choice, context) }) };
      },
    };
  }, [every, offers, slotKey, placement, country, plannedTrip]);
}
