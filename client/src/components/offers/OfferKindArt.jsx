import React from 'react';
// Icons
import { FaBed, FaCar, FaCompass, FaPlane, FaShieldAlt, FaSimCard, FaSuitcaseRolling, FaTicketAlt } from 'react-icons/fa';
// Utils
import { offerKindWord } from '@/utils/offers/offerKinds';

const ICONS = {
  HOTEL: FaBed,
  TOUR: FaTicketAlt,
  FLIGHT: FaPlane,
  CAR_HIRE: FaCar,
  ESIM: FaSimCard,
  INSURANCE: FaShieldAlt,
  LUGGAGE: FaSuitcaseRolling,
  OTHER: FaCompass,
};

/**
 * The picture of an offer that has none of its own: its kind as a round rubber stamp on
 * aged parchment (a bed for a hotel, a plane for flights…). Decorative: the card's words
 * say what it is. `large` for the bigger cards; small, it sizes itself to the tile it's
 * in (container queries: OfferTile is the container). `className` adds to its paper (room
 * left for words laid over it).
 */
function OfferKindArt({ kind, large = false, className = '' }) {
  const Icon = ICONS[kind] || FaCompass;
  return (
    <div aria-hidden='true' className={`paper-aged grid h-full w-full place-items-center p-2 ${className}`}>
      <span
        className={`grid aspect-square -rotate-6 place-items-center content-center gap-1 rounded-full border-4 border-double border-poster-red-deep text-poster-red-deep ${
          large ? 'w-32 p-3' : 'h-3/4 max-h-28 p-1'
        }`}
      >
        <Icon className={large ? 'h-10 w-10' : 'h-4 w-4 @min-[7rem]:h-7 @min-[7rem]:w-7'} />
        <span className={`font-travel uppercase leading-none tracking-wide ${large ? 'text-base' : 'hidden text-2xs @min-[7rem]:block'}`}>{offerKindWord(kind)}</span>
      </span>
    </div>
  );
}

export default OfferKindArt;
