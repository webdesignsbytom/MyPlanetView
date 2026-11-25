import React, { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
// Icons
import { FaPlay } from 'react-icons/fa';
// Api
import { openPhotoShow } from '@/api/photoShowsApi';
// Constants
import { SHOW_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { CompanyName } from '@/utils/constants/constants';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import { Slideshow } from '@/components/map/lazyMapPanels';
// Utils
import { photoCountWords } from '@/utils/shows/showRules';

// Where to make your own: what the shared slideshow is for, beyond the photos (25 Nov 2026)
const SIGN_UP_FROM_SHOW = `${SIGN_UP_PAGE_URL}?utm_source=show&utm_medium=slideshow&utm_campaign=shared-show`;
const LINK = 'font-semibold text-poster-red-deep underline underline-offset-2';

// The end card's invitation, inside the show
function MadeWith() {
  return (
    <div className='grid justify-items-center gap-2'>
      <p className='text-sm'>Made with {CompanyName}</p>
      <Link to={SIGN_UP_FROM_SHOW} className='btn-poster text-center'>
        Make your own travel map, free
      </Link>
    </div>
  );
}

/**
 * A slideshow of chosen photos, shared by its link (25 Nov 2026, the user's wish: "share just a
 * slideshow of selected photos"; docs/API.md "Photo slideshows"). Anyone with the link, no
 * sign-in. It opens playing (the slideshow over the page, starting with its title); closed, the
 * page has the title, how many photos, the first one, "Play the slideshow" and "Make your own
 * travel map". Nothing else of the map is here: not its name, its places or anyone's name.
 * Analytics is paused on this address, and it's reported as its pattern (routes.js).
 */
function ShowPage() {
  const { code } = useParams();
  const [loaded, setLoaded] = useState({ show: null, error: '' });
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded({ show: null, error: '' });
    openPhotoShow(code)
      .then((opened) => {
        if (!alive) return;
        setLoaded({ show: opened.show, error: '' });
        setPlaying(true);
      })
      .catch((err) => {
        if (!alive) return;
        setLoaded({
          show: null,
          error:
            err?.response?.status === 404
              ? 'This slideshow isn’t there any more. Ask whoever sent it for a new link.'
              : err?.friendlyMessage || 'The slideshow couldn’t be opened.',
        });
      });
    return () => {
      alive = false;
    };
  }, [code]);

  const { show } = loaded;
  return (
    <>
      <AppPageHead route={SHOW_PAGE_URL} title={show?.title} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'show-heading' }}>
        <PageTitleCard page='A slideshow' title={show ? show.title : 'A slideshow'} headingId='show-heading' subtitle={show ? photoCountWords(show.photoCount) : undefined} />

        {loaded.error ? (
          <PaperCard>
            <div className='grid gap-3 px-6 py-5 sm:px-8'>
              <p role='alert'>{loaded.error}</p>
              <Link to={SIGN_UP_FROM_SHOW} className={LINK}>
                Make your own travel map
              </Link>
            </div>
          </PaperCard>
        ) : !show ? (
          <p role='status' className='text-center text-poster-cream'>
            Opening the slideshow…
          </p>
        ) : (
          <PaperCard data-show-page={show.code}>
            <div className='grid justify-items-center gap-5 px-6 py-6 sm:px-8'>
              {show.coverUrl ? (
                <img src={show.coverUrl} alt='' className='max-h-[50vh] w-auto max-w-full -rotate-1 border-8 border-poster-cream shadow-paper' />
              ) : null}
              <Button onClick={() => setPlaying(true)}>
                <FaPlay aria-hidden='true' className='self-center text-sm' />
                <span>Play the slideshow</span>
              </Button>
              <p className='text-center text-sm'>
                Shared with you from {CompanyName}, where people keep the map of every place they’ve been.{' '}
                <Link to={SIGN_UP_FROM_SHOW} className={LINK}>
                  Make your own travel map, free
                </Link>
              </p>
            </div>
          </PaperCard>
        )}

        {/* Over the whole page, the site's navigation too (a portal: on a phone the nav's menu
            stamp covered the show's close stamp) */}
        {show && playing
          ? createPortal(
              <Suspense fallback={null}>
                <Slideshow
                  source={{ showCode: show.code }}
                  title={show.title}
                  intro={show.title}
                  photoCount={show.photoCount}
                  startSpeed={show.seconds}
                  endNote={<MadeWith />}
                  onClose={() => setPlaying(false)}
                />
              </Suspense>,
              document.body,
            )
          : null}
      </AppPageShell>
    </>
  );
}

export default ShowPage;
