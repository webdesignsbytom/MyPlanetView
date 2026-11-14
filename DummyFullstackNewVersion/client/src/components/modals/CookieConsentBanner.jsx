// Constants
import { COOKIE_CONSENT_STYLE } from '@/utils/constants/constants';
import { PRIVACY_POLICIES_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppLink from '@/components/common/AppLink';
// Utils
import { saveConsent } from '@/utils/analytics/consent';

// 'banner': a real choice, refusing as easy as agreeing, the site works either way.
// 'notice': essential cookies only (no analytics), so there's nothing to ask.
export default function CookieConsentBanner({ onChoice }) {
  const askAnalytics = COOKIE_CONSENT_STYLE !== 'notice';

  const choose = (analytics) => {
    saveConsent(analytics, askAnalytics ? {} : { acknowledged: true });
    onChoice(analytics);
  };

  const buttonClass =
    'w-full sm:w-auto rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer transition active:scale-95';

  return (
    <section
      role='dialog'
      aria-label='Cookie choices'
      className={`fixed inset-x-3 bottom-3 z-110 mx-auto grid max-w-3xl gap-3 rounded-2xl border border-colour3 bg-colour1 p-4 text-colour4 shadow-xl ${
        askAnalytics ? 'sm:grid-cols-[1fr_auto_auto]' : 'sm:grid-cols-[1fr_auto]'
      } sm:items-center`}
    >
      <p className='m-0 text-sm'>
        {askAnalytics
          ? "We use essential cookies to run the site, such as keeping you signed in. We'd also like to use Google Analytics to see which pages are useful. That's your choice, and the site works either way. See our "
          : 'We only use essential cookies, the ones the site needs to work, such as keeping you signed in. See our '}
        <AppLink
          to={PRIVACY_POLICIES_PAGE_URL}
          label='Privacy Policy'
          description='Privacy Policy page'
          className='text-colour6 underline'
        />
        .
      </p>

      {askAnalytics ? (
        <>
          <button
            type='button'
            onClick={() => choose('denied')}
            className={`${buttonClass} border-2 border-colour4 hover:bg-colour3`}
          >
            No thanks
          </button>
          <button
            type='button'
            onClick={() => choose('granted')}
            className={`${buttonClass} border-2 border-colour6 bg-colour6 text-colour1 hover:brightness-110`}
          >
            Accept analytics
          </button>
        </>
      ) : (
        <button
          type='button'
          onClick={() => choose('denied')}
          className={`${buttonClass} border-2 border-colour6 bg-colour6 text-colour1 hover:brightness-110`}
        >
          Got it
        </button>
      )}
    </section>
  );
}
