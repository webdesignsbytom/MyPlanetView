import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// Api
import { openPostcard } from '@/api/postcardsApi';
// Constants
import { POSTCARD_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { CompanyName } from '@/utils/constants/constants';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import PostcardView from '@/components/postcards/PostcardView';
// Utils
import { postcardTitle, sentOnWords } from '@/utils/postcards/postcardRules';

// Where to make your own: what the postcard is for, beyond the card (26 Nov 2026)
const SIGN_UP_FROM_POSTCARD = `${SIGN_UP_PAGE_URL}?utm_source=postcard&utm_medium=postcard&utm_campaign=shared-postcard`;
const LINK = 'font-semibold text-poster-red-deep underline underline-offset-2';

/**
 * A postcard, opened by its link (26 Nov 2026, the user's wish: "you send them with a share link.
 * They are not part of the map. And people can download them so they keep them forever";
 * docs/API.md "Postcards"). Anyone with the link, no sign-in: the card's front, "Turn it over"
 * for the back, "Download the front" and "Download the back" (the pictures as drawn), and "Make
 * your own travel map". Nothing of the sender's map or account is here. Analytics is paused on
 * this address, and it's reported as its pattern (routes.js).
 */
function PostcardPage() {
  const { code } = useParams();
  const [loaded, setLoaded] = useState({ postcard: null, error: '' });

  useEffect(() => {
    let alive = true;
    setLoaded({ postcard: null, error: '' });
    openPostcard(code)
      .then((opened) => alive && setLoaded({ postcard: opened.postcard, error: '' }))
      .catch((err) => {
        if (!alive) return;
        setLoaded({
          postcard: null,
          error:
            err?.response?.status === 404
              ? 'This postcard isn’t there any more. Ask whoever sent it for a new link.'
              : err?.friendlyMessage || 'The postcard couldn’t be opened.',
        });
      });
    return () => {
      alive = false;
    };
  }, [code]);

  const { postcard } = loaded;
  const placeName = postcard ? (COUNTRY_BY_CODE[postcard.countryCode]?.name ?? postcard.countryCode) : null;
  const title = postcard ? postcardTitle(placeName, postcard.kind === 'LANDMARK' ? postcard.landmark?.name : null) : 'A postcard for you';
  const subtitle = postcard
    ? [postcard.toName ? `To ${postcard.toName}` : null, postcard.fromName ? `from ${postcard.fromName}` : null, sentOnWords(postcard.sentAt)].filter(Boolean).join(' · ')
    : undefined;

  return (
    <>
      <AppPageHead route={POSTCARD_PAGE_URL} title={postcard ? title : undefined} />
      <AppPageShell width='max-w-4xl' mainProps={{ 'aria-labelledby': 'postcard-heading' }}>
        <PageTitleCard page='A postcard' title={title} headingId='postcard-heading' subtitle={subtitle} />

        {loaded.error ? (
          <PaperCard>
            <div className='grid gap-3 px-6 py-5 sm:px-8'>
              <p role='alert'>{loaded.error}</p>
              <Link to={SIGN_UP_FROM_POSTCARD} className={LINK}>
                Make your own travel map
              </Link>
            </div>
          </PaperCard>
        ) : !postcard ? (
          <p role='status' className='text-center text-poster-cream'>
            Opening the postcard…
          </p>
        ) : (
          <PaperCard data-postcard-page={postcard.code}>
            <div className='grid gap-5 px-4 py-5 sm:px-8 sm:py-6'>
              <PostcardView card={postcard} downloads />
              <p className='text-center text-sm'>Download both sides to keep it forever.</p>
              <p className='text-center text-sm'>
                Sent with {CompanyName}, where people keep the map of every place they’ve been.{' '}
                <Link to={SIGN_UP_FROM_POSTCARD} className={LINK}>
                  Make your own travel map, free
                </Link>
              </p>
            </div>
          </PaperCard>
        )}
      </AppPageShell>
    </>
  );
}

export default PostcardPage;
