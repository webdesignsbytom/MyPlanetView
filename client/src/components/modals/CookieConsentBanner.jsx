import React, { useEffect, useRef } from 'react';
// Constants
import { COOKIE_CONSENT_STYLE } from '@/utils/constants/constants';
import { PRIVACY_POLICIES_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppLink from '@/components/common/AppLink';
import CloseStamp from '@/components/common/CloseStamp';
// Utils
import { saveConsent } from '@/utils/analytics/consent';

// The cookie choice as a slip of travel paperwork pinned to the bottom of the screen: a
// parchment strip header, plain text, and two buttons of the same size and weight, so
// refusing is as easy as agreeing. The poster colours are fixed, so it reads the same in
// light and dark mode.
// 'banner': a real choice, the site works either way. 'notice': essential cookies only (no
// analytics), so there's nothing to ask.
// fromSettings: opened from the footer's Cookie settings. It says what they chose before,
// takes focus, and Escape or the close stamp shuts it unchanged (App gives focus back).
const CURRENT_CHOICE = {
  granted: "You've allowed Google Analytics. Choose “No thanks” to withdraw that: its cookies are deleted and nothing more is sent.",
  denied: "You've said no to Google Analytics, so it isn't used.",
};

// The buttons a size down from the default, both the same
const BUTTON_SIZE = 'w-full [--btn-size:1.125rem] [--btn-leading:1.5rem] [--btn-pad-y:0.375rem] [--btn-pad-x:1rem]';

export default function CookieConsentBanner({ onChoice, current = null, fromSettings = false, onClose }) {
  const askAnalytics = COOKIE_CONSENT_STYLE !== 'notice';
  const firstButtonRef = useRef(null);

  useEffect(() => {
    if (fromSettings) firstButtonRef.current?.focus();
  }, [fromSettings]);

  useEffect(() => {
    if (!fromSettings || !onClose) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [fromSettings, onClose]);

  const choose = (analytics) => {
    saveConsent(analytics, askAnalytics ? {} : { acknowledged: true });
    onChoice(analytics);
  };

  const status = fromSettings && askAnalytics ? CURRENT_CHOICE[current] : null;

  return (
    <section
      role='dialog'
      aria-label='Cookie choices'
      className='ticket-edge paper-aged fixed inset-x-3 bottom-3 z-110 mx-auto grid max-h-[calc(100svh-1.5rem)] max-w-3xl overflow-y-auto text-poster-ink'
    >
      <header className='grid grid-cols-rev items-center gap-3 border-b-2 border-dashed border-poster-brown py-2 pl-5 pr-4'>
        <h2 className='font-travel text-xl uppercase leading-tight tracking-wide text-poster-red-deep'>Cookies</h2>
        {fromSettings && onClose ? <CloseStamp small label='Close, keeping your choice' onClick={onClose} /> : null}
      </header>

      <div className='grid gap-3 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5'>
        <div className='grid gap-2 text-sm leading-relaxed'>
          {status ? <p className='font-semibold'>{status}</p> : null}
          <p>
            {askAnalytics
              ? "We use essential cookies to run the site, such as keeping you signed in. We'd also like to use Google Analytics to see which pages are useful. That's your choice, and the site works either way. See our "
              : 'We only use essential cookies, the ones the site needs to work, such as keeping you signed in. See our '}
            <AppLink
              to={PRIVACY_POLICIES_PAGE_URL}
              label='Privacy Policy'
              description='Privacy Policy page'
              className='rounded-xs text-poster-red-deep underline underline-offset-2 hover:brightness-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-poster-ink'
            />
            .
          </p>
        </div>

        {askAnalytics ? (
          <div className='grid gap-2 sm:grid-cols-2'>
            <button ref={firstButtonRef} type='button' onClick={() => choose('denied')} className={`btn-paper ${BUTTON_SIZE}`}>
              No thanks
            </button>
            <button type='button' onClick={() => choose('granted')} className={`btn-poster ${BUTTON_SIZE}`}>
              Accept analytics
            </button>
          </div>
        ) : (
          <button ref={firstButtonRef} type='button' onClick={() => choose('denied')} className={`btn-poster ${BUTTON_SIZE}`}>
            Got it
          </button>
        )}
      </div>
    </section>
  );
}
