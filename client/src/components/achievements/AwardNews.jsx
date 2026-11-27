import React, { useEffect, useRef } from 'react';
// Icons
import { FaTrophy } from 'react-icons/fa';
// Components
import CloseStamp from '@/components/common/CloseStamp';
// Utils
import { newsText } from '@/utils/achievements/news';

// Long enough to read twice and look at the map; hovering or focusing one of its buttons
// holds it there (10 s until 25 Nov 2026, the user's wish: it went too fast)
const SHOW_MS = 20000;

const LINK_BUTTON =
  'pointer-events-auto font-travel text-sm uppercase tracking-wide text-poster-red-deep underline underline-offset-4 hover:no-underline';

/**
 * A short, polite note when the server says the map has earned a badge or reached a goal
 * (useAchievements' `news`): a paper tag at the top of the map, read out by screen
 * readers (a status region that's always there, so the words are announced as they
 * arrive). It goes by itself after twenty seconds (later while one of its buttons is hovered
 * or focused), or with its close stamp; "See badges and goals" opens the panel, and "Share a
 * picture" (with `onShare`: the map's own people; 25 Nov 2026, the user's wish) hands the news
 * to the share dialog (AwardShareDialog). Only its buttons take the pointer, so it never stops
 * a press on the map or a panel under its words.
 */
function AwardNews({ news, onOpen, onDismiss, onShare = null }) {
  const text = news.length ? newsText(news) : '';
  const holdRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Each note starts unheld: the last one went with a click (its close stamp, "See badges
    // and goals"), which takes it away without a pointer-leave or a blur to let go
    holdRef.current = false;
    if (!text) return undefined;
    const tick = () => {
      if (holdRef.current) timerRef.current = window.setTimeout(tick, 1500);
      else onDismiss();
    };
    timerRef.current = window.setTimeout(tick, SHOW_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [text, onDismiss]);

  const hold = (on) => () => {
    holdRef.current = on;
  };

  return (
    <div
      role='status'
      aria-live='polite'
      // On phones at the very top, over the Menu stamp (27 Nov 2026, the user's wish: it sat below
      // it, over the map); it goes by itself, or with its close stamp
      className='pointer-events-none absolute right-3 top-3 z-40 grid nophone:z-20 w-[min(17rem,calc(100vw-1.5rem))] nophone:right-20 nophone:w-[min(22rem,calc(100vw-30rem))]'
    >
      {text ? (
        <div
          onPointerEnter={hold(true)}
          onPointerLeave={hold(false)}
          onFocus={hold(true)}
          onBlur={hold(false)}
          className='ticket-edge paper-aged grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3 text-poster-ink shadow-paper'
        >
          <FaTrophy aria-hidden='true' className='-rotate-6 text-xl text-poster-red' />
          <div className='grid gap-2'>
            <p className='text-sm font-medium'>{text}</p>
            <div className='grid justify-items-start gap-1'>
              {onShare ? (
                <button type='button' onClick={() => onShare(news)} className={LINK_BUTTON}>
                  Share a picture
                </button>
              ) : null}
              <button type='button' onClick={onOpen} className={LINK_BUTTON}>
                See badges and goals
              </button>
            </div>
          </div>
          <span className='pointer-events-auto'>
            <CloseStamp small label='Dismiss' onClick={onDismiss} />
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default AwardNews;
