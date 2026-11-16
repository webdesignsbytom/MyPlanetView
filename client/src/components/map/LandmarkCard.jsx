import React from 'react';
import { FaLandmark } from 'react-icons/fa';

const CREDIT_LINK = 'underline underline-offset-2 hover:text-colour6';

// One landmark in the country ticket: its photo as a print in a white frame (tilted a
// little, alternately), its name, and the photo's credit as its licence asks: the author,
// linked to the photo's Wikimedia Commons page, and the licence, linked to its text.
// `photo` comes from landmarkPhotoInfo; without one (or before the credits load) the
// frame holds the landmark icon. The photo is decorative (alt ''): the name is the caption.
function LandmarkCard({ landmark, photo }) {
  return (
    <li className='group'>
      <figure className='grid content-start gap-2'>
        <div className='aspect-[4/3] overflow-hidden border-4 border-poster-cream bg-colour9/10 shadow-paper transition-transform group-odd:-rotate-1 group-even:rotate-1'>
          {photo ? (
            <picture>
              <source type='image/avif' srcSet={photo.avif} />
              <img
                src={photo.webp}
                alt=''
                width={photo.width}
                height={photo.height}
                loading='lazy'
                decoding='async'
                referrerPolicy='no-referrer'
                className='block h-full w-full object-cover'
              />
            </picture>
          ) : (
            <span aria-hidden='true' className='grid h-full place-items-center text-colour9/60'>
              <FaLandmark className='h-8 w-8' />
            </span>
          )}
        </div>
        <figcaption className='grid gap-0.5'>
          <span className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 text-sm font-medium leading-snug'>
            <span>
              {landmark.name}
              {landmark.isUnesco ? <span className='sr-only'> (UNESCO World Heritage Site)</span> : null}
            </span>
            {landmark.isUnesco ? <FaLandmark aria-hidden='true' className='h-3.5 w-3.5 translate-y-0.5 text-colour9' /> : null}
          </span>
          {photo ? (
            <span className='text-xs leading-snug opacity-80 [overflow-wrap:anywhere]'>
              Photo:{' '}
              <a href={photo.source} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
                {photo.author}
              </a>
              {photo.licence ? ', ' : null}
              {photo.licence && photo.licenceUrl ? (
                <a href={photo.licenceUrl} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
                  {photo.licence}
                </a>
              ) : (
                photo.licence
              )}
            </span>
          ) : null}
        </figcaption>
      </figure>
    </li>
  );
}

export default LandmarkCard;
