import React from 'react';

const CREDIT_LINK = 'underline underline-offset-2 hover:text-colour6';

/**
 * A photo on a country guide, as a print in a white frame (like the map's landmark cards),
 * cropped to the frame's shape (`frameClass`: an aspect-* class), with the credit its
 * licence asks for under it: "Photo: <author>, <licence>", the author linked to the photo's
 * Commons page and the licence to its text. `photo` comes from utils/countries/guidePhotos.js.
 * `alt` is '' where the photo only illustrates a name given beside it; `caption` names what
 * it shows, above the credit.
 */
function GuidePhoto({ photo, alt = '', caption = null, frameClass = 'aspect-[4/3]', tilt = '', eager = false }) {
  return (
    <figure className='grid content-start gap-1.5'>
      <div className={`overflow-hidden border-4 border-poster-cream bg-colour9/10 shadow-paper ${frameClass} ${tilt}`}>
        <picture className='block h-full w-full'>
          <source type='image/avif' srcSet={photo.avif} />
          <img
            src={photo.webp}
            alt={alt}
            width={photo.width}
            height={photo.height}
            loading={eager ? 'eager' : 'lazy'}
            decoding='async'
            referrerPolicy='no-referrer'
            className='block h-full w-full object-cover'
          />
        </picture>
      </div>
      <figcaption className='grid gap-0.5 text-xs leading-snug [overflow-wrap:anywhere]'>
        {caption ? <span className='text-sm font-medium'>{caption}</span> : null}
        <span className='opacity-80'>
          Photo:{' '}
          <a href={photo.source} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
            {photo.author}
          </a>
          {photo.licence ? ', ' : null}
          {photo.licence && photo.licenceUrl ? (
            <a href={photo.licenceUrl} target='_blank' rel='noopener noreferrer license' className={CREDIT_LINK}>
              {photo.licence}
            </a>
          ) : (
            photo.licence
          )}
        </span>
      </figcaption>
    </figure>
  );
}

export default GuidePhoto;
