import React, { useEffect, useRef, useState } from 'react';
// Icons
import { IoEyeOff, IoLocationSharp } from 'react-icons/io5';
// Api
import { deleteMoment } from '@/api/travelApi';
// Components
import MomentStamp from './MomentStamp';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { MOMENT_KIND_LABELS } from '@/utils/moments/momentKinds';
import { formatMomentDate } from '@/utils/moments/momentDates';
import { countryName } from '@/utils/map/countries';
import { googleMapsUrl, spotAudience } from '@/utils/moments/momentSpots';

// Names joined as people say them: "Test", "Test and Alex", "Test, Alex and Mia"
const listNames = (names) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/**
 * One moment, as a note in the list: its kind's stamp, the title, the kind, when and where,
 * the story, who it's about and its photos (each opens with `onOpenPhoto`). A hidden one
 * says so (editors only see those). Editors get Edit (`onEdit`) and Delete, which asks
 * first. `headingLevel` is its title's level in the page. `showCountry` adds the country
 * (a trip's list, where moments are in several). `focusTitle`: just saved, so focus
 * moves to its title (the form it came from has gone).
 */
function MomentCard({
  moment,
  headingLevel = 4,
  travellers = [],
  trips = null,
  showCountry = false,
  canEdit = false,
  focusTitle = false,
  onEdit,
  onDeleted,
  onOpenPhoto,
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const headingRef = useRef(null);
  const Heading = `h${headingLevel}`;
  const titleId = `moment-${moment.id}`;

  useEffect(() => {
    if (focusTitle) headingRef.current?.focus();
  }, [focusTitle]);

  const names = moment.travellerIds.map((id) => travellers.find((t) => t.id === id)?.name).filter(Boolean);
  const trip = moment.tripId && trips ? trips.find((t) => t.id === moment.tripId) : null;
  const where = [moment.landmark?.name, moment.placeName, showCountry ? countryName(moment.countryCode) : null].filter(Boolean).join(', ');
  const details = [MOMENT_KIND_LABELS[moment.kind], formatMomentDate(moment) || 'No date', where].filter(Boolean).join(' · ');

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteMoment(moment.id);
      onDeleted(moment.id);
    } catch (err) {
      setError(err.friendlyMessage || 'The moment could not be deleted.');
      setDeleting(false);
    }
  };

  return (
    <li>
      <article aria-labelledby={titleId} className='grid grid-cols-reg items-start gap-3 border-2 border-dashed border-poster-brown/60 p-3'>
        <MomentStamp kind={moment.kind} />
        <div className='grid min-w-0 gap-1.5'>
          <Heading
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className='break-words font-travel text-lg uppercase leading-tight tracking-wide text-poster-red-deep focus:outline-none'
          >
            {moment.title}
          </Heading>
          <p className='text-xs opacity-80'>{details}</p>
          {trip ? <p className='text-xs opacity-80'>On {trip.title}</p> : null}
          {moment.spot ? (
            <p className='grid grid-cols-reg items-start justify-start gap-1.5 text-xs'>
              <IoLocationSharp aria-hidden='true' className='translate-y-0.5 text-poster-red' />
              <span>
                <a href={googleMapsUrl(moment.spot)} target='_blank' rel='noopener noreferrer' referrerPolicy='no-referrer' className='underline'>
                  See the spot on Google Maps<span className='sr-only'> (opens in a new tab)</span>
                </a>
                {canEdit && 'shared' in moment.spot ? ` · ${spotAudience(moment.spot.shared)}` : ''}
              </span>
            </p>
          ) : null}
          {moment.hidden ? (
            <p className='grid grid-cols-reg items-center justify-start gap-1.5 text-xs font-medium text-poster-red-deep'>
              <IoEyeOff aria-hidden='true' />
              Hidden from viewers
            </p>
          ) : null}
          {moment.text ? <p className='whitespace-pre-line break-words text-sm'>{moment.text}</p> : null}
          {names.length ? <p className='text-sm'>With {listNames(names)}</p> : null}
          {moment.photos.length ? (
            <ul className='grid grid-cols-4 gap-1.5' aria-label={`Photos of ${moment.title}`}>
              {moment.photos.map((photo, i) => (
                <li key={photo.id}>
                  {onOpenPhoto ? (
                    <button
                      type='button'
                      onClick={() => onOpenPhoto(photo)}
                      aria-label={`Open photo ${i + 1} of ${moment.title}`}
                      className='grid aspect-square w-full overflow-hidden border-2 border-poster-cream bg-poster-cream shadow-paper'
                    >
                      {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' className='h-full w-full object-cover' /> : null}
                    </button>
                  ) : (
                    <span className='grid aspect-square overflow-hidden border-2 border-poster-cream bg-poster-cream shadow-paper'>
                      {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' className='h-full w-full object-cover' /> : null}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {canEdit ? (
            confirming ? (
              <div role='group' aria-label={`Delete ${moment.title}`} className='grid gap-2 pt-1'>
                <p className='text-sm font-medium text-poster-red-deep'>Delete “{moment.title}”? It can’t be brought back.</p>
                <div className='grid grid-row gap-2'>
                  <Button small danger busy={deleting} onClick={remove}>
                    Yes, delete it
                  </Button>
                  <Button small quiet onClick={() => setConfirming(false)}>
                    Keep it
                  </Button>
                </div>
              </div>
            ) : (
              <div className='grid grid-row gap-2 pt-1'>
                <Button small quiet onClick={onEdit} ariaLabel={`Edit ${moment.title}`}>
                  Edit
                </Button>
                <Button small danger onClick={() => setConfirming(true)} ariaLabel={`Delete ${moment.title}`}>
                  Delete
                </Button>
              </div>
            )
          ) : null}
          <InlineAlert>{error}</InlineAlert>
        </div>
      </article>
    </li>
  );
}

export default MomentCard;
