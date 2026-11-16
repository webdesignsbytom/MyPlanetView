import React, { memo } from 'react';
// Components
import AdStamp from './AdStamp';
import OfferKindArt from './OfferKindArt';
// Utils
import { mediaUrlFrom } from '@/utils/media/mediaUrl';
import { offerLinkLabel } from '@/utils/offers/offerKinds';

/**
 * A travel offer in a photo gallery (docs/API.md, "Travel offers"): one square tile, the
 * same size and white border as a photo's, so the grid keeps its rhythm, but plainly not
 * a photo: a brochure with its picture (or its kind's stamp) filling the tile, the "Ad"
 * stamp in its corner and a cream label along the bottom with the title, and the
 * partner where the tile is wide enough (a container query: a map panel's tiles are
 * small on a phone). The whole tile is one plain link through the API's /go/ (`href`),
 * opening the partner in a new tab; its name starts "Ad:" so a screen reader says so
 * first. Without `href` it's the same card, not a link (a preview).
 */
function OfferTile({ offer, href }) {
  const image = offer.imageKey ? mediaUrlFrom({ objectKey: offer.imageKey }) : null;
  const linkProps = href
    ? { href, target: '_blank', rel: 'sponsored noopener', referrerPolicy: 'no-referrer', 'aria-label': offerLinkLabel(offer) }
    : { role: 'group', 'aria-label': `Ad: ${offer.title}, ${offer.partner}` };
  const Tag = href ? 'a' : 'div';

  return (
    <Tag
      {...linkProps}
      data-offer-id={offer.id}
      className='@container relative grid aspect-square overflow-hidden border-4 border-poster-cream bg-poster-cream text-poster-ink shadow-paper focus-visible:outline-2'
    >
      {image ? (
        <img src={image} alt='' loading='lazy' decoding='async' draggable={false} className='absolute inset-0 h-full w-full object-cover' />
      ) : (
        <span className='absolute inset-0 grid'>
          <OfferKindArt kind={offer.kind} className='pb-9' />
        </span>
      )}
      <AdStamp className='absolute left-1 top-1 -rotate-6' />
      <span className='absolute inset-x-0 bottom-0 grid border-t-2 border-dashed border-poster-brown bg-poster-cream px-1.5 pb-1 pt-0.5'>
        <span className='line-clamp-2 text-2xs font-semibold leading-tight'>{offer.title}</span>
        <span className='hidden truncate text-2xs leading-tight text-poster-brown @min-[8rem]:block'>{offer.partner}</span>
      </span>
    </Tag>
  );
}

export default memo(OfferTile);
