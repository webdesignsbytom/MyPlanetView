import React from 'react';

// The short reason shown where a change is locked until the email address is verified
// (useMustVerifyEmail). `action` finishes the sentence: "Verify your email address to …".
function VerifyFirstNote({ action = 'make changes' }) {
  return (
    <p className='border-l-4 border-poster-red pl-3 text-sm'>
      Verify your email address to {action}. The link is in the email we sent you.
    </p>
  );
}

export default VerifyFirstNote;
