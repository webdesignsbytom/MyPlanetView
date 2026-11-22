import React from 'react';
import { FaLandmark, FaThumbtack } from 'react-icons/fa';
// Components
import CheckboxInput from '@/components/ui/CheckboxInput';
// Utils
import { formatMomentDate } from '@/utils/moments/momentDates';

const CREDIT_LINK = 'underline underline-offset-2 hover:text-colour6';

// One landmark in the country ticket: its photo as a print in a white frame (tilted a
// little, alternately), its name, and the photo's credit as its licence asks: the author,
// linked to the photo's Wikimedia Commons page, and the licence, linked to its text.
// `photo` comes from landmarkPhotoInfo; without one (or before the credits load) the
// frame holds the landmark icon. The photo is decorative (alt ''): the name is the caption.
// `moments`: the map's moments that happened here, each a pinned line with its date (the
// first two, then how many more).
const MOMENTS_SHOWN = 2;

// `mark`: 'stamped' (the passport, from a confirmed photo), 'ticked' ("been here") or null;
// `onToggle(landmarkId, been)` gives an editor the "Been here" tick (docs/API.md "Collecting").
function LandmarkCard({ landmark, photo, moments = [], mark = null, onToggle = null }) {
  return (
    <li className='group'>
      <figure className='grid content-start gap-2'>
        <div className='aspect-[4/3] overflow-hidden border-4 border-poster-cream bg-colour9/10 shadow-paper transition-transform group-odd:-rotate-1 group-even:rotate-1'>
          {/* The picture fills the frame, so the photo's h-full has a height to fill and
              object-cover crops every shape to the 4:3 print */}
          {photo ? (
            <picture className='block h-full w-full'>
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
          {mark === 'stamped' ? (
            <span className='text-xs font-semibold text-poster-red-deep' data-landmark-mark='stamped'>
              Stamped in the passport
            </span>
          ) : onToggle ? (
            <CheckboxInput
              id={`been-${landmark.id}`}
              checked={mark === 'ticked'}
              onChange={(e) => onToggle(landmark.id, e.target.checked)}
              label={<span className='text-xs font-medium'>Been here</span>}
              ariaLabel={`Been to ${landmark.name}`}
            />
          ) : mark === 'ticked' ? (
            <span className='text-xs font-semibold text-poster-red-deep' data-landmark-mark='ticked'>
              Been here
            </span>
          ) : null}
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
          {moments.length ? (
            <ul className='grid gap-0.5 pt-1 text-xs leading-snug' aria-label={`Moments at ${landmark.name}`}>
              {moments.slice(0, MOMENTS_SHOWN).map((moment) => {
                const when = formatMomentDate(moment);
                return (
                  <li key={moment.id} className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-1.5'>
                    <FaThumbtack aria-hidden='true' className='h-3 w-3 translate-y-0.5 text-poster-red' />
                    <span>
                      <span className='font-semibold'>{moment.title}</span>
                      {when ? `, ${when}` : ''}
                    </span>
                  </li>
                );
              })}
              {moments.length > MOMENTS_SHOWN ? <li className='pl-4.5 opacity-80'>and {moments.length - MOMENTS_SHOWN} more</li> : null}
            </ul>
          ) : null}
        </figcaption>
      </figure>
    </li>
  );
}

export default LandmarkCard;
