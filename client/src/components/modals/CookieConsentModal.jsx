import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
// Images
import CookieSVG from '@/assets/images/icons/cookie-icon.svg';
// Constants
import {
  CompanyName,
  DISAGREE_LINK,
  DISPLAY_BUSINESS_URL,
  FULL_BUSINESS_URL,
} from '@/utils/constants/constants';
import {
  LEGAL_AGREEMENTS_PAGE_URL,
  PRIVACY_POLICIES_PAGE_URL,
} from '@/utils/constants/routes';
// Components
import AppLink from '@/components/common/AppLink';
import AppAnchor from '@/components/common/AppAnchor';
// Utils
import { saveConsent } from '@/utils/analytics/consent';

function CookieConsentModal({ onChoice }) {
  const location = useLocation();

  // bar mode on ALL legal routes (declare BEFORE effects)
  const onLegal = [
    LEGAL_AGREEMENTS_PAGE_URL,
    PRIVACY_POLICIES_PAGE_URL,
  ].includes(location.pathname);

  // required confirmations
  const [acceptCookies, setAcceptCookies] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // gate: all boxes must be checked
  const allChecked = useMemo(
    () => acceptCookies && agreeTerms,
    [acceptCookies, agreeTerms]
  );

  // ids for aria linkage
  const titleId = 'cookie-consent-title';
  const descId = 'cookie-consent-desc';

  // focus management
  const modalRef = useRef(null);
  const firstInteractiveRef = useRef(null);

  useEffect(() => {
    if (!onLegal && firstInteractiveRef.current) {
      firstInteractiveRef.current.focus();
    }
  }, [onLegal]);

  useEffect(() => {
    if (onLegal) return;

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        const live = document.getElementById('cookie-consent-live');
        if (live) {
          live.textContent = 'Use the Disagree or I Agree buttons to proceed.';
        }
        e.stopPropagation();
        e.preventDefault();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(
          (el) =>
            !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
        );
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown, true);
    return () => document.removeEventListener('keydown', handleKeydown, true);
  }, [onLegal]);

  const handleAgree = () => {
    if (!allChecked) return;
    saveConsent('granted', { agreed: true, assertions: { acceptCookies, agreeTerms } });
    onChoice('granted');
  };

  // The wall stays up while they leave
  const handleDisagree = () => {
    window.location.href = DISAGREE_LINK;
  };

  return (
    <>
      {onLegal ? (
        <section
          aria-label='Cookie consent notice'
          className='fixed lg:max-w-md lg:right-4 lg:bottom-4 bottom-0 w-full border-t-2 border-solid border-colour3 lg:border-2 lg:rounded py-3 px-4 z-110 bg-colour1 text-colour4 shadow-xl'
        >
          <div className='grid gap-2 pl-2'>
            {/* checkboxes */}
            <label className='grid grid-cols-reg gap-2 items-start text-xs lg:text-sm'>
              <input
                type='checkbox'
                checked={acceptCookies}
                onChange={(e) => setAcceptCookies(e.target.checked)}
                className='accent-colour6'
              />
              <span>I consent to cookies for functionality/analytics</span>
            </label>

            <label className='grid grid-cols-reg gap-2 items-start text-xs lg:text-sm'>
              <input
                type='checkbox'
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className='accent-colour6'
              />
              <span>
                I agree to the{' '}
                <AppLink
                  to={LEGAL_AGREEMENTS_PAGE_URL}
                  label='Terms & Conditions'
                  description='Terms & Conditions page'
                  className='underline'
                />{' '}
                and{' '}
                <AppLink
                  to={PRIVACY_POLICIES_PAGE_URL}
                  label='Privacy Policy'
                  description='Privacy Policy page'
                  className='underline'
                />
              </span>
            </label>

            {/* buttons */}
            <div className='grid grid-cols-2 gap-2 pt-2'>
              <button
                className='px-2 py-2.5 w-full cursor-pointer bg-colour2 text-colour1 active:scale-95 font-medium text-sm uppercase rounded shadow-lift-sm transition duration-150 ease-in-out'
                onClick={handleDisagree}
              >
               I Disagree
              </button>
              <button
                className={`px-2 py-2.5 w-full font-medium text-sm uppercase rounded  shadow-lift-sm transition duration-150 ease-in-out ${
                  allChecked
                    ? 'bg-colour6 text-colour1 cursor-pointer active:scale-95'
                    : 'bg-colour3 text-colour5 cursor-not-allowed'
                }`}
                onClick={handleAgree}
                disabled={!allChecked}
                aria-disabled={!allChecked}
              >
                I Agree
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className='fixed inset-0 backdrop-blur-md z-100' />
          <section
            ref={modalRef}
            role='dialog'
            aria-modal='true'
            aria-labelledby={titleId}
            aria-describedby={descId}
            className='grid fixed w-full h-full z-110 items-center justify-center px-6 md:px-0'
          >
            <div className='grid rounded-xl px-4 pt-6 pb-4 shadow-xl h-fit w-full border-solid border-2 border-colour3 max-w-md bg-colour1 text-colour4'>
              <article className='grid gap-8 h-full w-full grid-rows-rev'>
                <div className='grid gap-4 w-full h-full'>
                  <section className='mx-auto py-2'>
                    <img
                      src={CookieSVG}
                      alt='Cookie icon'
                      width={24}
                      height={24}
                      loading='lazy'
                      decoding='async'
                      className='h-fit w-44'
                    />
                  </section>

                  <section className='text-center'>
                    <h2 id={titleId} className='text-lg font-semibold'>
                      Cookie & Policy Consent
                    </h2>

                    <div className='grid gap-1'>
                      <div className='font-medium'>{CompanyName}</div>
                      <AppAnchor
                        href={FULL_BUSINESS_URL}
                        ariaLabel='Visit our homepage'
                        className='underline'
                        titleAttr='Homepage'
                      >
                        {DISPLAY_BUSINESS_URL}
                      </AppAnchor>
                    </div>
                  </section>

                  <section
                    id={descId}
                    className='grid gap-6 h-full w-full px-2 text-xs lg:text-sm'
                  >
                    <div>
                      <p className='text-center'>
                        This website uses cookies, and you must agree to our
                        Terms & Conditions and Privacy Policy to continue.
                      </p>
                    </div>

                    {/* REQUIRED CHECKBOXES */}
                    <div className='grid gap-y-4 h-fit pl-2'>
                      <label className='grid grid-cols-reg gap-2 items-start'>
                        <input
                          ref={firstInteractiveRef}
                          type='checkbox'
                          checked={acceptCookies}
                          onChange={(e) => setAcceptCookies(e.target.checked)}
                          aria-required='true'
                          className='accent-colour6'
                        />
                        <span>
                          I consent to the use of cookies for functionality and
                          analytics.
                        </span>
                      </label>

                      <label className='grid grid-cols-reg gap-2 items-start'>
                        <input
                          type='checkbox'
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          aria-required='true'
                          className='accent-colour6 ring-0'
                        />
                        <span>
                          I have read and agree to the{' '}
                          <AppLink
                            to={LEGAL_AGREEMENTS_PAGE_URL}
                            label='Terms & Conditions'
                            description='Terms & Conditions page'
                            className='underline'
                          />{' '}
                          and{' '}
                          <AppLink
                            to={PRIVACY_POLICIES_PAGE_URL}
                            label='Privacy Policy'
                            description='Privacy Policy page'
                            className='underline'
                          />
                          .
                        </span>
                      </label>
                    </div>

                    <div>
                      <p className='text-center'>
                        If you do not agree or are underage, please exit this
                        site.
                      </p>
                    </div>
                    <div
                      id='cookie-consent-live'
                      aria-live='polite'
                      className='sr-only'
                    />
                  </section>
                </div>

                <section className='grid grid-cols-2 gap-2 w-full h-fit'>
                  <button
                    className='px-2 py-2.5 w-full bg-colour2 text-colour1 active:scale-95 cursor-pointer font-medium text-lg leading-tight uppercase rounded shadow-lift-sm transition duration-150 ease-in-out'
                    onClick={handleDisagree}
                    aria-label='Disagree to cookie usage'
                  >
                    I Disagree
                  </button>

                  <button
                    className={`px-2 py-2.5 w-full font-medium text-lg leading-tight uppercase rounded shadow-lift-sm transition duration-150 ease-in-out ${
                      allChecked
                        ? 'bg-colour6 text-colour1 cursor-pointer active:scale-95'
                        : 'bg-colour3 text-colour5 cursor-not-allowed'
                    }`}
                    onClick={handleAgree}
                    aria-label='Agree to cookie usage'
                    disabled={!allChecked}
                    aria-disabled={!allChecked}
                  >
                    I Agree
                  </button>
                </section>
              </article>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default CookieConsentModal;
