import React, { useId, useRef } from 'react';
// Components
import Button from '@/components/common/Button';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Utils
import { DESIGN_PICTURE_ACCEPT } from '@/utils/map/mapDesign';

// A map design's sea picture (docs/API.md "Map designs"): what's there now, a button to
// choose one (a new one replaces the old, whose file is deleted) and one to remove it.
// Uploading needs a verified email (`locked`), removing doesn't.
function DesignPictureField({ picture, busy, progress, locked, onChoose, onRemove }) {
  const inputRef = useRef(null);
  const uid = useId();
  return (
    <div className='grid gap-2' role='group' aria-labelledby={`${uid}-label`}>
      <p id={`${uid}-label`} className='text-sm font-medium'>
        The sea
      </p>
      {picture ? (
        <img src={picture.url} alt='The picture on this map’s sea' className='aspect-[2/1] w-full border-2 border-poster-brown object-cover' />
      ) : (
        <p className='text-sm opacity-80'>The usual sea. Choose a picture of yours to fill the sea behind the countries.</p>
      )}
      {locked ? <VerifyFirstNote action='add a picture' /> : null}
      <input
        ref={inputRef}
        type='file'
        accept={DESIGN_PICTURE_ACCEPT}
        aria-label='Choose a picture for the sea'
        tabIndex={-1}
        className='sr-only'
        data-design-picture-input
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onChoose(file);
        }}
      />
      <div className='grid gap-2 sm:grid-cols-2'>
        <Button busy={busy} disabled={locked} onClick={() => inputRef.current?.click()}>
          {picture ? 'Change the picture' : 'Choose a picture'}
        </Button>
        {picture ? (
          <Button quiet disabled={busy} onClick={onRemove}>
            Remove the picture
          </Button>
        ) : null}
      </div>
      {busy ? (
        <p className='text-sm' aria-live='polite'>
          {progress > 0 ? `Uploading the picture: ${Math.round(progress * 100)}%` : 'Getting the picture ready…'}
        </p>
      ) : null}
    </div>
  );
}

export default DesignPictureField;
