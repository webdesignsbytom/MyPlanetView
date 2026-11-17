import React, { useEffect, useRef } from 'react';
// Icons
import { FaTrophy } from 'react-icons/fa';
// Components
import CloseStamp from '@/components/common/CloseStamp';
// Utils
import { newsText } from '@/utils/achievements/news';

// Long enough to read twice; hovering or focusing one of its buttons holds it there
const SHOW_MS = 10000;

/**
 * A short, polite note when the server says the map has earned a badge or reached a goal
 * (useAchievements' `news`): a paper tag at the top of the map, read out by screen
 * readers (a status region that's always there, so the words are announced as they
 * arrive). It goes by itself after ten seconds (later while one of its buttons is hovered
 * or focused), or with its close stamp; "See badges and goals" opens the panel. Only its
 * buttons take the pointer, so it never stops a press on the map or a panel under its words.
 */
function AwardNews({ news, onOpen, onDismiss }) {
  const text = news.length ? newsText(news) : '';
  const holdRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
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
      className='pointer-events-none absolute right-3 top-16 z-20 grid w-[min(17rem,calc(100vw-1.5rem))] nophone:top-3 nophone:right-20 nophone:w-[min(22rem,calc(100vw-30rem))]'
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
            <button
              type='button'
              onClick={onOpen}
              className='pointer-events-auto justify-self-start font-travel text-sm uppercase tracking-wide text-poster-red-deep underline underline-offset-4 hover:no-underline'
            >
              See badges and goals
            </button>
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
