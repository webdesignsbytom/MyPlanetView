import React from 'react';

/** A destination's photo and words (a native modal <dialog>, opened by its parent from a card). */
export default function HomeDraftDialog({ dialogRef, place, onClose }) {
  return (
    <dialog ref={dialogRef} aria-labelledby='home-draft-dialog-title'>
      <div className='dialoghead'>
        <h2 id='home-draft-dialog-title'>{place?.country ?? ''}</h2>
        <button type='button' aria-label='Close' onClick={onClose}>
          ×
        </button>
      </div>
      {place ? (
        <>
          <img className='detailphoto' src={place.image} alt={place.site} />
          <h3>{place.site}</h3>
          <p>{place.detail}</p>
        </>
      ) : null}
    </dialog>
  );
}
