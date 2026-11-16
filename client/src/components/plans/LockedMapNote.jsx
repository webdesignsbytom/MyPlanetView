import React from 'react';

// Where adding photos is locked because the map isn't paid for (an extra map without a
// paid slot, docs/API.md "Map limits"), like VerifyFirstNote for an unverified address
function LockedMapNote({ isOwner = false }) {
  return (
    <p className='border-l-4 border-poster-red pl-3 text-sm'>
      This map isn’t paid for, so it can’t take new photos. Everything on it stays.{' '}
      {isOwner
        ? 'Pay for it on the map’s page, or make it your main map in the map’s settings.'
        : 'Its owner can pay for it as an extra map.'}
    </p>
  );
}

export default LockedMapNote;
