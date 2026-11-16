import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
// Components
import Button from '@/components/common/Button';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import PassportCover from './PassportCover';
import PassportPhotoPage from './PassportPhotoPage';
import PassportVisaPage from './PassportVisaPage';
import PassportBackPage from './PassportBackPage';
// Utils
import { bookLeaves } from '@/utils/passport/passportBook';

const SWIPE_PX = 50;

// How a page turns: a fade with reduced motion; a slide on phones (and touch screens),
// where pages are swiped; else a 3D page turn round the spine
function turnStyle() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'fade';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'fade';
  if (window.matchMedia('(max-width: 767px), (pointer: coarse)').matches) return 'slide';
  return 'turn';
}

// The keys that turn the page, unless they're for a field, a dialog or the map
const TURN_KEYS = { ArrowLeft: -1, ArrowRight: 1 };
const KEEPS_ITS_KEYS = 'input, select, textarea, [contenteditable="true"], [role="dialog"], [role="application"]';

/**
 * The passport as a book (docs/FEATURE-PLAN.md, "The passport"): the cover, the travellers,
 * a visa page per country and the totals, one page at a time. Pages turn with the buttons
 * under the book, the page list, the left and right arrow keys, or a swipe on a phone;
 * a 3D turn on wide screens, a slide on phones, a fade with reduced motion. Each page is a
 * section with its own h2; the page number and name are announced as it turns.
 */
function PassportBook({ passport, canPick = false, locked = false, onOpenPhoto, onPickPhoto }) {
  const bookId = useId();
  const leaves = useMemo(() => bookLeaves(passport), [passport]);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(null); // { from, dir, style } while a page turns
  const at = Math.min(index, leaves.length - 1);
  const currentRef = useRef(null);
  const turningRef = useRef(null);
  const swipeRef = useRef(null);

  const go = useCallback(
    (to) => {
      if (to < 0 || to >= leaves.length || to === at) return;
      setTurn({ from: at, dir: to > at ? 1 : -1, style: turnStyle() });
      setIndex(to);
    },
    [at, leaves.length],
  );
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = (step) => go(at + step);
  }, [go, at]);

  // The arrow keys turn the page anywhere on the page, but not in a field, a dialog (the
  // photo viewer) or while a dialog is open
  useEffect(() => {
    const onKeyDown = (e) => {
      const step = TURN_KEYS[e.key];
      if (!step || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target?.closest?.(KEEPS_ITS_KEYS) || document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      goRef.current(step);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // The turn itself, run on the two pages before the browser paints (Web Animations, so it
  // ends cleanly and a quick second press cancels the first)
  useLayoutEffect(() => {
    if (!turn) return undefined;
    const current = currentRef.current;
    const turning = turningRef.current;
    const animations = [];
    if (turn.style === 'fade') {
      animations.push(current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }));
    } else if (turn.style === 'slide') {
      const options = { duration: 300, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' };
      animations.push(current?.animate([{ transform: `translateX(${turn.dir * 100}%)` }, { transform: 'translateX(0)' }], options));
      animations.push(turning?.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-turn.dir * 100}%)` }], { ...options, fill: 'forwards' }));
    } else {
      // Forward: the old page turns over to the left, off the new one beneath. Back: the
      // page before turns back over the old one.
      const options = { duration: 650, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' };
      const open = [{ transform: 'rotateY(-100deg)' }, { transform: 'rotateY(0deg)' }];
      if (turn.dir > 0) animations.push(turning?.animate([...open].reverse(), { ...options, fill: 'forwards' }));
      else animations.push(current?.animate(open, options));
    }
    const running = animations.filter(Boolean);
    let done = false;
    Promise.all(running.map((animation) => animation.finished))
      .then(() => {
        if (!done) setTurn((now) => (now === turn ? null : now));
      })
      .catch(() => {});
    return () => {
      done = true;
      running.forEach((animation) => animation.cancel());
    };
  }, [turn]);

  const headingFor = (leaf) => `${bookId}-${leaf.key}`;
  const renderLeaf = (i) => {
    const leaf = leaves[i];
    if (!leaf) return null;
    const pageNumber = i + 1;
    switch (leaf.kind) {
      case 'cover':
        return <PassportCover map={passport.map} headingId={headingFor(leaf)} />;
      case 'travellers':
        return <PassportPhotoPage travellers={passport.travellers} pageNumber={pageNumber} headingId={headingFor(leaf)} />;
      case 'visa':
        return (
          <PassportVisaPage
            page={leaf.page}
            pageNumber={pageNumber}
            headingId={headingFor(leaf)}
            canPick={canPick}
            locked={locked}
            onOpenPhoto={onOpenPhoto}
            onPickPhoto={onPickPhoto}
          />
        );
      default:
        return <PassportBackPage totals={passport.totals} hasVisas={passport.pages.length > 0} pageNumber={pageNumber} headingId={headingFor(leaf)} />;
    }
  };

  const turningLeaf = turn && turn.style !== 'fade' && turn.from !== at ? turn.from : null;
  // During a 3D turn back, the page coming back lies over the old one
  const comingBack = turn?.style === 'turn' && turn.dir < 0;
  const pageListId = `${bookId}-pages`;

  return (
    <section aria-label='Passport book' className='grid gap-4'>
      <div
        className='relative grid touch-pan-y overflow-hidden rounded-l-md rounded-r-2xl border-l-8 border-poster-red-deep bg-paper-cream shadow-paper perspective-[2200px] md:h-[40rem]'
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') swipeRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipeRef.current;
          swipeRef.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(at + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
      >
        {turningLeaf !== null ? (
          <div
            ref={turningRef}
            aria-hidden='true'
            inert
            className={`absolute inset-0 grid origin-left backface-hidden ${comingBack ? 'z-0' : 'z-10 shadow-paper'}`}
          >
            {renderLeaf(turningLeaf)}
          </div>
        ) : null}
        <div ref={currentRef} key={leaves[at]?.key} className={`relative grid min-h-0 origin-left backface-hidden ${comingBack ? 'z-10 shadow-paper' : ''}`}>
          {renderLeaf(at)}
        </div>
      </div>

      <nav
        aria-label='Passport pages'
        className='paper-aged paper-fields ticket-edge grid grid-cols-2 items-center gap-3 rounded-lg px-4 py-3 text-poster-ink sm:grid-cols-[auto_minmax(0,1fr)_auto]'
      >
        <div className='col-span-2 grid justify-items-center gap-1 sm:order-2 sm:col-span-1'>
          <PlainOptionSelect
            id={pageListId}
            ariaLabel='Go to a page'
            value={String(at)}
            onChange={(e) => go(Number(e.target.value))}
            options={leaves.map((leaf, i) => ({ value: String(i), label: `${i + 1}. ${leaf.label}` }))}
            className='w-full max-w-xs'
          />
          <p role='status' className='text-sm'>
            Page {at + 1} of {leaves.length}: {leaves[at]?.label}
          </p>
        </div>
        <div className='grid justify-items-start sm:order-1'>
          <Button quiet onClick={() => go(at - 1)} disabled={at === 0}>
            <IoChevronBack aria-hidden='true' /> Previous page
          </Button>
        </div>
        <div className='grid justify-items-end sm:order-3'>
          <Button quiet onClick={() => go(at + 1)} disabled={at === leaves.length - 1}>
            Next page <IoChevronForward aria-hidden='true' />
          </Button>
        </div>
      </nav>
    </section>
  );
}

export default PassportBook;
