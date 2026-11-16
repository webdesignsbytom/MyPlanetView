import React, { useId } from 'react';
// Components
import Button from '@/components/common/Button';
import LandmarkStamp from './LandmarkStamp';
// Utils
import { stampDescription } from '@/utils/passport/passportBook';

/**
 * One stamp on a visa page: the stamp itself (pressing it opens its photo), what it says in
 * words for screen readers, and for editors "Choose photo" when it has more than one (or
 * one was picked, to go back to the first). `locked`: an editor who must verify their email
 * address first.
 */
function PassportStamp({ stamp, canPick = false, locked = false, onOpenPhoto, onPickPhoto }) {
  const descriptionId = useId();
  return (
    <li className='grid content-start justify-items-center gap-2'>
      <button
        type='button'
        onClick={() => onOpenPhoto(stamp.photo.id)}
        aria-describedby={descriptionId}
        title={stamp.name}
        className='grid w-full max-w-44 rounded-full p-1 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-colour6 motion-reduce:transition-none'
      >
        <span className='sr-only'>Open the photo of {stamp.name}</span>
        <LandmarkStamp stamp={stamp} />
      </button>
      <p id={descriptionId} className='sr-only'>
        {stampDescription(stamp)}
        {stamp.photoChosen ? ', its photo chosen' : ''}.
      </p>
      {canPick && (stamp.photoCount > 1 || stamp.photoChosen) ? (
        <Button small quiet disabled={locked} onClick={() => onPickPhoto(stamp)} ariaLabel={`Choose the photo for ${stamp.name}`}>
          Choose photo
        </Button>
      ) : null}
    </li>
  );
}

export default PassportStamp;
