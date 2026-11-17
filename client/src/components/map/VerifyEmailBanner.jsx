import React, { useEffect, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import LuggageTag from './LuggageTag';
import CloseStamp from '@/components/common/CloseStamp';

// Closing it hides it for the rest of the visit (this tab), on the map and trip pages alike
const CLOSED_KEY = 'mpv:verifyReminderClosed';

/**
 * The map and trip pages' reminder, on a luggage tag, while the signed-in user's email
 * address isn't verified: nothing can be added until it is (useMustVerifyEmail). It can
 * send the link again; what happened is read out (a polite live region). Its close stamp
 * hides it for the visit (17 Nov 2026, the user's wish: it couldn't be closed); the locked
 * controls still say why where they're used (VerifyFirstNote).
 */
function VerifyEmailBanner({ className = '' }) {
  const { user, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // { ok, text }
  const [closed, setClosed] = useState(false);

  // Read after the first render (storage may be missing or blocked)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLOSED_KEY) === '1') setClosed(true);
    } catch {
      // No storage: it shows until closed on this page
    }
  }, []);

  if (!user || user.emailVerified !== false || closed) return null;

  const resend = async () => {
    setSending(true);
    setStatus(null);
    const result = await resendVerificationEmail();
    setSending(false);
    setStatus(result.ok ? { ok: true, text: 'Sent. Check your inbox.' } : { ok: false, text: result.error || 'That didn’t send. Try again.' });
  };

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(CLOSED_KEY, '1');
    } catch {
      // Closed for this page only
    }
  };

  return (
    <LuggageTag as='section' aria-label='Verify your email' className={`max-w-[min(24rem,calc(100vw-1.5rem))] text-sm ${className}`}>
      <span className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
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
        <CloseStamp small label='Hide this reminder' onClick={close} />
      </span>
    </LuggageTag>
  );
}

export default VerifyEmailBanner;
