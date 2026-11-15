import React, { useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import LuggageTag from './LuggageTag';

// The map and trip pages' reminder, on a luggage tag, while the signed-in user's email
// address isn't verified: nothing can be added until it is (useMustVerifyEmail). It can
// send the link again; what happened is read out (a polite live region).
function VerifyEmailBanner({ className = '' }) {
  const { user, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // { ok, text }

  if (!user || user.emailVerified !== false) return null;

  const resend = async () => {
    setSending(true);
    setStatus(null);
    const result = await resendVerificationEmail();
    setSending(false);
    setStatus(result.ok ? { ok: true, text: 'Sent. Check your inbox.' } : { ok: false, text: result.error || 'That didn’t send. Try again.' });
  };

  return (
    <LuggageTag as='section' aria-label='Verify your email' className={`max-w-[min(24rem,calc(100vw-1.5rem))] text-sm ${className}`}>
      <span className='grid gap-1'>
        <span className='font-semibold'>Verify your email to start adding countries, trips and photos.</span>
        <span className='break-words text-xs'>We sent a link to {user.email}.</span>
        <span className='grid grid-cols-reg items-center gap-2 text-xs'>
          <button
            type='button'
            onClick={resend}
            disabled={sending}
            className='justify-self-start font-semibold text-poster-red-deep underline underline-offset-2 disabled:opacity-60'
          >
            {sending ? 'Sending…' : 'Send the link again'}
          </button>
          <span aria-live='polite' className={status && !status.ok ? 'text-status-critical' : ''}>
            {status?.text || ''}
          </span>
        </span>
      </span>
    </LuggageTag>
  );
}

export default VerifyEmailBanner;
