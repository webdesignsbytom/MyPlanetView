import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Constants
import {
  ACCOUNT_PAGE_URL,
  HOME_PAGE_URL,
  LOGIN_PAGE_URL,
  VERIFY_EMAIL_PAGE_URL,
} from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  verifyEmailPageAdditionalMeta,
  verifyEmailPageStructuredData,
} from '@/utils/data/metaData';
// Hooks
import useNavigateToPage from '@/hooks/useNavigateToPage';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import AppLink from '@/components/common/AppLink';
import LoadingSpinner from '@/components/utils/LoadingSpinner';


function VerifyEmailPage() {
  const pageHelmet = helmetData[VERIFY_EMAIL_PAGE_URL];

  // Link format: /verify-email-address/:userId/:token. `?change=confirm` is the link
  // sent to the current address before an email change: this click only confirms it,
  // and the server then emails the new address
  const { uniqueString: token } = useParams();
  const [searchParams] = useSearchParams();
  const confirmingChange = searchParams.get('change') === 'confirm';
  const { verifyEmail } = useAuth();
  const navigateToPage = useNavigateToPage();

  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [redirectIn, setRedirectIn] = useState(5);
  const [nextPage, setNextPage] = useState(LOGIN_PAGE_URL);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const headingRef = useRef(null);

  const startRedirectCountdown = (destination) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRedirectIn(5);

    timerRef.current = setInterval(() => {
      setRedirectIn((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          navigateToPage(destination);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const performVerification = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification details in the link.');
      return;
    }

    setStatus('verifying');
    setMessage('');

    const result = await verifyEmail(token);
    if (!mountedRef.current) return;

    if (result.ok) {
      const destination = result.signedIn ? ACCOUNT_PAGE_URL : LOGIN_PAGE_URL;
      setNextPage(destination);
      setStatus('success');
      setMessage(
        confirmingChange
          ? "Thanks, the change is confirmed. We've emailed a link to your new address: your email changes once you click it."
          : 'Your email has been verified successfully.',
      );
      startRedirectCountdown(destination);
    } else {
      setStatus('error');
      setMessage(
        'There was an issue verifying your email. Your link may be invalid or expired.',
      );
    }
  };

  // Tokens are single-use, so verify once (StrictMode runs effects twice)
  useEffect(() => {
    mountedRef.current = true;
    if (!startedRef.current) {
      startedRef.current = true;
      performVerification();
    }
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [token]);

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [status]);

  const isVerifying = status === 'verifying';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={verifyEmailPageAdditionalMeta}
        structuredData={verifyEmailPageStructuredData}
        canonicalPath={VERIFY_EMAIL_PAGE_URL}
      />

      <noscript>
        <div className='sr-only'>
          JavaScript is required to verify your email. Please enable JavaScript
          and refresh the page.
        </div>
      </noscript>

      <PublicPageLayout
        footer={false}
        mainProps={{
          'aria-busy': isVerifying,
          'aria-labelledby': 'verify-email-heading',
          'aria-describedby': 'verify-email-message',
        }}
      >
        <PaperCard
          aria-label='Email verification status and actions'
          header={
            <PageTitleCard
              embedded
              page='Email check'
              title={
                isVerifying
                  ? 'Verifying your email address'
                  : isSuccess
                    ? confirmingChange ? 'Change confirmed' : 'Email verified'
                    : 'Email verification failed'
              }
              headingId='verify-email-heading'
              headingRef={headingRef}
              headingProps={{ tabIndex: -1, 'aria-live': 'polite', 'aria-atomic': 'true' }}
              stamp={isVerifying ? ['Checking'] : isSuccess ? ['Verified'] : ['Return', 'to', 'sender']}
            />
          }
          bodyClassName='gap-6'
        >
          <section
            className='grid gap-3 text-center'
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            aria-atomic='true'
          >
            {isVerifying && (
              <div className='grid place-items-center' aria-hidden='true'>
                <LoadingSpinner />
              </div>
            )}

            <p id='verify-email-message' className={`text-lg font-semibold ${isError ? 'text-status-critical' : ''}`}>
              {isVerifying
                ? 'Verifying your email address. Please wait while we complete the verification process.'
                : message}
            </p>

            {isSuccess && (
              <p aria-live='polite'>
                You can continue now.
                {redirectIn > 0 && <> Redirecting in {redirectIn}s…</>}
              </p>
            )}
          </section>

          <nav className='grid w-full gap-3 sm:w-max sm:grid-flow-col sm:auto-cols-fr sm:justify-self-center' aria-label='Verification page actions'>
            {isError && (
              <button type='button' onClick={performVerification} className='btn-poster' aria-label='Retry email verification'>
                Retry
              </button>
            )}

            <AppLink
              to={HOME_PAGE_URL}
              label='Go to Home'
              description='home page'
              ariaLabel='Navigate to the home page'
              className='btn-paper'
            />

            <AppLink
              to={nextPage}
              label={nextPage === ACCOUNT_PAGE_URL ? 'Go to Account' : 'Go to Login'}
              description={nextPage === ACCOUNT_PAGE_URL ? 'account page' : 'login page'}
              ariaLabel={nextPage === ACCOUNT_PAGE_URL ? 'Navigate to your account page' : 'Navigate to the login page'}
              className={isError ? 'btn-paper' : 'btn-poster'}
            />
          </nav>

          {isError && (
            <aside className='grid text-center' aria-label='Verification help information'>
              <p className='text-sm'>If the issue persists, request a new verification link or contact support.</p>
            </aside>
          )}
        </PaperCard>
      </PublicPageLayout>
    </>
  );
}

export default VerifyEmailPage;
