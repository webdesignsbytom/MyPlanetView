import React from 'react';
// Icons
import { FaExternalLinkAlt } from 'react-icons/fa';
// Components
import AdStamp from './AdStamp';
import OfferKindArt from './OfferKindArt';
// Utils
import { mediaUrlFrom } from '@/utils/media/mediaUrl';
import { offerLinkLabel } from '@/utils/offers/offerKinds';

/**
 * A travel offer as a travel agent's brochure (docs/API.md, "Travel offers"): its picture
 * (or its kind's stamp) under the "Ad" stamp, the title in the travel face, the partner,
 * the blurb, and "Visit <partner>". The Travel Desk's racks, the country pages' two slots
 * and the end of a slideshow use it. The whole brochure is one plain link through the
 * API's /go/ (`href`), to the partner in a new tab, named "Ad: …" first.
 * `wide`: the picture beside the words from sm up (the slideshow's end card).
 */
function OfferBrochure({ offer, href, wide = false }) {
  const image = offer.imageKey ? mediaUrlFrom({ objectKey: offer.imageKey }) : null;

  return (
    <a
      href={href}
      target='_blank'
      rel='sponsored noopener'
      referrerPolicy='no-referrer'
      aria-label={offerLinkLabel(offer)}
      data-offer-id={offer.id}
      className={`ticket-edge group grid min-w-0 overflow-hidden rounded-md bg-paper-cream text-colour4 transition-transform hover:-rotate-1 focus-visible:outline-2 motion-reduce:transition-none motion-reduce:hover:rotate-0 ${
        wide ? 'grid-rows-[10rem_auto] sm:grid-cols-[12rem_minmax(0,1fr)] sm:grid-rows-1' : 'grid-rows-[9rem_auto] content-start'
      }`}
    >
      <span className='relative grid min-h-0 overflow-hidden border-b-2 border-dashed border-poster-brown sm:border-b-0 sm:border-r-0'>
        {image ? (
          <img src={image} alt='' loading='lazy' decoding='async' draggable={false} className='h-full w-full object-cover' />
        ) : (
          <OfferKindArt kind={offer.kind} large />
        )}
        <AdStamp className='absolute left-2 top-2 -rotate-6' />
      </span>
      <span className='grid content-start gap-1.5 px-4 pb-4 pt-3'>
        <span className='font-travel text-lg uppercase leading-tight tracking-wide text-poster-red-deep'>{offer.title}</span>
        <span className='text-xs font-semibold uppercase tracking-wide text-colour9'>{offer.partner}</span>
        {offer.blurb ? <span className='line-clamp-3 text-sm leading-snug'>{offer.blurb}</span> : null}
        <span className='grid grid-row items-center gap-1.5 justify-self-start text-sm font-semibold underline underline-offset-2 group-hover:no-underline'>
          Visit {offer.partner}
          <FaExternalLinkAlt aria-hidden='true' className='h-3 w-3' />
        </span>
      </span>
    </a>
  );
}

export default OfferBrochure;
