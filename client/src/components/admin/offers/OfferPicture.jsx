import React, { useState } from 'react';
// Components
import OfferKindArt from '@/components/offers/OfferKindArt';
// Utils
import { mediaUrlFrom } from '@/utils/media/mediaUrl';

// An offer's picture from the public bucket (its `imageKey`), or, without one or when it
// doesn't load, its kind's stamp, as the cards draw it. Decorative: the offer's title
// beside it says what it is. `className` sizes it.
function OfferPicture({ imageKey, kind, className = '' }) {
  const src = imageKey ? mediaUrlFrom({ objectKey: imageKey }) : null;
  // The address that failed, so a changed picture is tried again
  const [failed, setFailed] = useState(null);

  return (
    <div className={`grid overflow-hidden ${className}`}>
      {src && src !== '#' && failed !== src ? (
        <img src={src} alt='' loading='lazy' decoding='async' onError={() => setFailed(src)} className='h-full w-full object-cover' />
      ) : (
        <OfferKindArt kind={kind} />
      )}
    </div>
  );
}

export default OfferPicture;
