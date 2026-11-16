import React from 'react';
// Components
import OfferTile from '@/components/offers/OfferTile';
import OfferBrochure from '@/components/offers/OfferBrochure';

// How an offer's cards look, for the admin's form, drawn by the real card components: the
// square tile among a gallery's photos (when it shows in galleries), and the brochure of
// the Travel Desk, the country pages and the end of a slideshow (when it shows on any of
// them). `offer` is what the form holds so far (utils/offers/offerForm.js
// previewOfferFrom); `placements` the places ticked. Neither is a link here: the tile has
// no address, and the brochure (always a link where it's used) is inert, so the preview
// can't be clicked or tabbed into. The form's fields say the same in words.
function OfferCardPreview({ offer, placements = [] }) {
  const tile = placements.includes('GALLERY');
  const brochure = placements.some((p) => p !== 'GALLERY');

  return (
    <figure className='grid content-start gap-3'>
      {tile ? (
        <div className='grid justify-items-center gap-1'>
          <div className='grid w-36'>
            <OfferTile offer={offer} />
          </div>
          <span className='text-xs opacity-80'>In a photo gallery</span>
        </div>
      ) : null}
      {brochure ? (
        <div className='grid justify-items-center gap-1'>
          <div className='grid w-full max-w-60' inert>
            <OfferBrochure offer={offer} />
          </div>
          <span className='text-xs opacity-80'>On the Travel Desk, country pages and slideshows</span>
        </div>
      ) : null}
      {!tile && !brochure ? <p className='text-center text-xs opacity-80'>Tick where it shows to see its card.</p> : null}
      <figcaption className='sr-only'>How the offer’s cards look</figcaption>
    </figure>
  );
}

export default OfferCardPreview;
