import React from 'react';
import { FaLandmark } from 'react-icons/fa';
// Hooks
import useLandmarkPhotos from '@/hooks/useLandmarkPhotos';
// Utils
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';

const CREDIT_LINK = 'underline underline-offset-2 hover:text-colour6';

/**
 * A landmark with no model yet, on the celebration screen: a print in a white frame, tilted
 * a little. `photoUrl` is the map's own photo that stamped it (a confirmed match); else the
 * landmark's photo from Wikimedia Commons, with the credit its licence asks for on the
 * print's foot (as on the landmark cards); else the landmark icon. The picture is decorative
 * (the screen names the landmark).
 */
function LandmarkPhotoPrint({ slug, photoUrl = null }) {
  // The credits' chunk loads only when there's no photo of the map's own
  const photos = useLandmarkPhotos();
  const commons = photoUrl ? null : landmarkPhotoInfo(photos, slug);
  return (
    <figure className='grid w-60 max-w-full -rotate-2 gap-1 bg-poster-cream p-2 text-poster-ink shadow-paper motion-safe:animate-model-pop'>
      <div className='aspect-[4/3] overflow-hidden bg-colour9/10'>
        {photoUrl ? (
          <img src={photoUrl} alt='' className='block h-full w-full object-cover' referrerPolicy='no-referrer' />
        ) : commons ? (
          <picture className='block h-full w-full'>
            <source type='image/avif' srcSet={commons.avif} />
            <img
              src={commons.webp}
              alt=''
              width={commons.width}
              height={commons.height}
              decoding='async'
              referrerPolicy='no-referrer'
              className='block h-full w-full object-cover'
            />
          </picture>
        ) : (
          <span aria-hidden='true' className='grid h-full place-items-center text-colour9/60'>
            <FaLandmark className='h-12 w-12' />
          </span>
        )}
      </div>
      {commons ? (
        <figcaption className='text-2xs leading-snug [overflow-wrap:anywhere]'>
          Photo:{' '}
          <a href={commons.source} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
            {commons.author}
          </a>
          {commons.licence ? ', ' : null}
          {commons.licence && commons.licenceUrl ? (
            <a href={commons.licenceUrl} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
              {commons.licence}
            </a>
          ) : (
            commons.licence
          )}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default LandmarkPhotoPrint;
