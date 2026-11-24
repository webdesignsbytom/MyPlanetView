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
import { bookLeaves, passportCover, visaLeafIndex } from '@/utils/passport/passportBook';

const SWIPE_PX = 50;

// How a page turns: a fade with reduced motion; a slide on phones (and touch screens),
// where pages are swiped; else a 3D page turn round the spine
function turnStyle() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'fade';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'fade';
  if (window.matchMedia('(max-width: 767px), (pointer: coarse)').matches) return 'slide';
  return 'turn';
}

// The 3D turn (wide screens) is a real book's: one sheet of paper turns on the spine in the
// middle, its front the earlier spread's right-hand page (or the cover) and its back the later
// spread's left-hand page. Beneath it, the earlier spread's left-hand page and the later one's
// right-hand page stay where they are until the sheet covers or uncovers them, so no page
// shows that a real book wouldn't. Forward the sheet turns from right to left; back, the other way.
const TURN_MS = 700;
const TURN_EASING = 'cubic-bezier(0.45, 0, 0.25, 1)';
// The closed cover lies in the middle, one page wide. Opening, it first slides across to the
// right-hand side, where its spine meets the middle, then turns; closing, the same backwards.
const COVER_TURN_MS = 950;
const SLIDE = 0.3; // the share of a cover's turn spent sliding
const LEFT_HALF = 'inset(0 50% 0 0)';
const RIGHT_HALF = 'inset(0 0 0 50%)';
const HIDDEN = 'inset(0 0 0 100%)';
// A clip held through the turn, or one that switches at a share of it
const hold = (clip) => [{ clipPath: clip }, { clipPath: clip }];
const switchAt = (share, before, after) => [
  { clipPath: before, offset: 0 },
  { clipPath: before, offset: share },
  { clipPath: after, offset: share + 0.001 },
  { clipPath: after, offset: 1 },
];
// The sheet darkens as it rises off the page and lightens as it lands
const dims = (from, to, start) => [
  { filter: `brightness(${from})`, offset: 0 },
  { filter: `brightness(${from})`, offset: start },
  { filter: `brightness(${to})`, offset: 1 },
];

// Opened at a place's page (`openAt`): how long the closed cover shows before it opens
const OPEN_AT_DELAY_MS = 600;

// The keys that turn the page, unless they're for a field, a dialog or the map
const TURN_KEYS = { ArrowLeft: -1, ArrowRight: 1 };
const KEEPS_ITS_KEYS = 'input, select, textarea, [contenteditable="true"], [role="dialog"], [role="application"]';

/**
 * The passport as a book (docs/FEATURE-PLAN.md, "The passport"): the cover, the travellers,
 * a visa page per country and the totals, one page at a time. Pages turn with the buttons
 * under the book, the page list, the left and right arrow keys, a swipe on a phone, or a
 * double-click (turnByDoubleClick, below); a real page turn on wide screens (TURN_MS,
 * above), a slide on phones, a fade with reduced motion. The book's words can't be selected,
 * like printed paper (a double-click used to highlight the cover's). Each page is a section
 * with its own h2; the page number and name are announced as it turns.
 * `openAt` (a place's code: the celebration's "Open passport", 24 Nov 2026, the user's wish)
 * shows the closed cover a moment, then opens the book straight to that place's page: the
 * cover's own opening, the new page on the back of the turning sheet, the pages between
 * skipped. A place the book has no page for leaves it on the cover.
 */
function PassportBook({ passport, onOpenPhoto, openAt = null }) {
  const bookId = useId();
  const leaves = useMemo(() => bookLeaves(passport), [passport]);
  const [index, setIndex] = useState(0);
  // While a page turns: { from, dir, style, cover }, `cover` when the cover opens or closes
  const [turn, setTurn] = useState(null);
  const at = Math.min(index, leaves.length - 1);
  const currentRef = useRef(null);
  const slidingRef = useRef(null);
  const underRef = useRef(null);
  const sheetRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const swipeRef = useRef(null);

  const go = useCallback(
    (to) => {
      if (to < 0 || to >= leaves.length || to === at) return;
      setTurn({ from: at, dir: to > at ? 1 : -1, style: turnStyle(), cover: leaves[Math.min(at, to)]?.kind === 'cover' });
      setIndex(to);
    },
    [at, leaves],
  );
  const goRef = useRef(go);
  const goToRef = useRef(go);
  const atRef = useRef(at);
  useEffect(() => {
    goRef.current = (step) => go(at + step);
    goToRef.current = go;
    atRef.current = at;
  }, [go, at]);

  // Opened at a place's page: once, from the cover, unless a page was turned meanwhile. Marked
  // done only when it turns, so React's second run of effects in development still opens it.
  const openAtIndex = useMemo(() => visaLeafIndex(leaves, openAt), [leaves, openAt]);
  const openedAtRef = useRef(false);
  useEffect(() => {
    if (openedAtRef.current || openAtIndex <= 0) return undefined;
    const timer = setTimeout(() => {
      openedAtRef.current = true;
      if (atRef.current === 0) goToRef.current(openAtIndex);
    }, OPEN_AT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [openAtIndex]);

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

  // The turn itself, run before the browser paints (Web Animations, so it ends cleanly and a
  // quick second press cancels the first)
  useLayoutEffect(() => {
    if (!turn) return undefined;
    const current = currentRef.current;
    const animations = [];
    if (turn.style === 'fade') {
      animations.push(current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }));
    } else if (turn.style === 'slide') {
      const options = { duration: 300, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' };
      animations.push(current?.animate([{ transform: `translateX(${turn.dir * 100}%)` }, { transform: 'translateX(0)' }], options));
      animations.push(
        slidingRef.current?.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-turn.dir * 100}%)` }], { ...options, fill: 'forwards' }),
      );
    } else {
      // The sheet's motion is written forwards (right to left) and played backwards to turn
      // back. The pages beneath are clipped to the half that shows: forward, the new spread's
      // right-hand page (none while the closed cover slides across); back, the earlier
      // spread's left-hand page (none of the cover, which is on the sheet), with the later
      // spread's right-hand page beside it until the sheet lands on it.
      const forward = turn.dir > 0;
      const duration = turn.cover ? COVER_TURN_MS : TURN_MS;
      const flipsFrom = turn.cover ? SLIDE : 0;
      const sheet = { duration, fill: 'forwards', direction: forward ? 'normal' : 'reverse' };
      const frames = turn.cover
        ? [
            { transform: 'translateX(-25%) rotateY(0deg)', offset: 0, easing: 'ease-in-out' },
            { transform: 'translateX(0) rotateY(0deg)', offset: SLIDE, easing: TURN_EASING },
            { transform: 'translateX(0) rotateY(-180deg)', offset: 1 },
          ]
        : [
            { transform: 'rotateY(0deg)', easing: TURN_EASING },
            { transform: 'rotateY(-180deg)' },
          ];
      animations.push(sheetRef.current?.animate(frames, sheet));
      animations.push(frontRef.current?.animate(dims(1, 0.6, flipsFrom), sheet));
      animations.push(backRef.current?.animate(dims(0.6, 1, flipsFrom), sheet));
      if (forward) {
        animations.push(current?.animate(turn.cover ? switchAt(SLIDE, HIDDEN, RIGHT_HALF) : hold(RIGHT_HALF), { duration }));
      } else {
        animations.push(current?.animate(hold(turn.cover ? HIDDEN : LEFT_HALF), { duration }));
        if (turn.cover) animations.push(underRef.current?.animate(switchAt(1 - SLIDE, RIGHT_HALF, HIDDEN), { duration, fill: 'forwards' }));
      }
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
        // One traveller's own passport has their photo page alone
        return (
          <PassportPhotoPage
            travellers={passport.map.traveller ? passport.travellers.filter((t) => t.id === passport.map.traveller.id) : passport.travellers}
            pageNumber={pageNumber}
            headingId={headingFor(leaf)}
          />
        );
      case 'visa':
        return (
          <PassportVisaPage
            page={leaf.page}
            pageNumber={pageNumber}
            headingId={headingFor(leaf)}
            onOpenPhoto={onOpenPhoto}
          />
        );
      default:
        return <PassportBackPage totals={passport.totals} hasVisas={passport.pages.length > 0} pageNumber={pageNumber} headingId={headingFor(leaf)} />;
    }
  };

  // A double-click turns the page as a hand would (the keyboard has the buttons and arrow
  // keys): on the closed cover it opens it; on an open spread (wide screens), on the
  // left-hand page it turns back and on the right-hand page on; on one page (phones), on.
  // Not on a control (a stamp, a button, a link), which has its own job.
  const turnByDoubleClick = (e) => {
    if (e.target.closest?.('a, button, input, select, textarea, label, [role="button"]')) return;
    // The cover itself, not the empty space beside it on wide screens
    if (leaves[at]?.kind === 'cover') return e.target.closest?.('[data-cover]') ? go(at + 1) : undefined;
    const box = e.currentTarget.getBoundingClientRect();
    const spread = window.matchMedia?.('(min-width: 768px)').matches;
    go(spread && e.clientX < box.left + box.width / 2 ? at - 1 : at + 1);
  };
  const pageListId = `${bookId}-pages`;
  // The closed cover is one page wide on wide screens, in the middle. An open page sits on
  // the cover's leather, which shows round it as on a real passport.
  const leafFrame = (i) => (leaves[i]?.kind === 'cover' ? 'justify-items-center' : 'passport-board p-2 sm:p-2.5');
  // On a phone, the old page sliding out
  const sliding = turn?.style === 'slide' ? turn.from : null;
  // A 3D turn: the sheet between the earlier spread and the later one, and the page that
  // stays put beside the live one while it turns (forward, the earlier spread's left-hand
  // page, which the cover hasn't got; back, the later spread's right-hand page)
  const sheet = turn?.style === 'turn' ? { early: Math.min(turn.from, at), late: Math.max(turn.from, at) } : null;
  const under = !sheet ? null : turn.dir > 0 ? (turn.cover ? null : { leaf: sheet.early, clip: LEFT_HALF }) : { leaf: sheet.late, clip: RIGHT_HALF };

  return (
    <section aria-label='Passport book' className={`grid gap-4 ${passportCover(passport.map.plan).look}`}>
      <div
        className={`relative grid aspect-[88/125] min-h-0 touch-pan-y select-none grid-rows-[minmax(0,1fr)] perspective-[2200px] md:aspect-auto md:h-[40rem] ${turn?.style === 'slide' ? 'overflow-hidden' : ''}`}
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
        {sliding !== null ? (
          <div ref={slidingRef} aria-hidden='true' inert className={`absolute inset-0 grid ${leafFrame(sliding)}`}>
            {renderLeaf(sliding)}
          </div>
        ) : null}
        {under ? (
          <div ref={underRef} aria-hidden='true' inert className={`absolute inset-0 grid ${leafFrame(under.leaf)}`} style={{ clipPath: under.clip }}>
            {renderLeaf(under.leaf)}
          </div>
        ) : null}
        <div ref={currentRef} key={leaves[at]?.key} className={`relative grid min-h-0 ${leafFrame(at)}`} onDoubleClick={turnByDoubleClick}>
          {renderLeaf(at)}
        </div>
        {sheet ? (
          // Front: the earlier spread's right-hand page, or the closed cover on the right-hand
          // side (the motion slides it there from the middle). Back: the later spread's
          // left-hand page, turned over so it reads right once the sheet lands on the left.
          <div ref={sheetRef} aria-hidden='true' inert className='absolute inset-0 z-10 grid transform-3d'>
            <div
              ref={frontRef}
              className={`absolute inset-0 grid backface-hidden ${turn.cover ? 'justify-items-end' : leafFrame(sheet.early)}`}
              style={turn.cover ? undefined : { clipPath: RIGHT_HALF }}
            >
              {renderLeaf(sheet.early)}
            </div>
            <div
              ref={backRef}
              className={`absolute inset-0 grid backface-hidden [transform:rotateY(180deg)] ${leafFrame(sheet.late)}`}
              style={{ clipPath: LEFT_HALF }}
            >
              {renderLeaf(sheet.late)}
            </div>
          </div>
        ) : null}
      </div>

      {/* The page list between the two buttons, in one row on every screen; on phones the
          buttons are arrows alone (17 Nov 2026, the user's wish), named "Previous page" and
          "Next page" all the same, and as tall as the list (items-stretch) */}
      {/* Kept at the bottom of the window while the book is in view: under a 40rem book it
          was below the fold on a 1440×900 screen, a scroll for every page (19 Nov 2026, the audit) */}
      <nav
        aria-label='Passport pages'
        className='paper-aged paper-fields ticket-edge sticky bottom-2 z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-3 rounded-lg px-3 py-3 text-poster-ink sm:px-4'
      >
        <Button quiet onClick={() => go(at - 1)} disabled={at === 0}>
          <IoChevronBack aria-hidden='true' />
          <span className='sr-only sm:not-sr-only'>Previous page</span>
        </Button>
        <div className='grid content-center justify-items-center'>
          <PlainOptionSelect
            id={pageListId}
            ariaLabel='Go to a page'
            value={String(at)}
            onChange={(e) => go(Number(e.target.value))}
            options={leaves.map((leaf, i) => ({ value: String(i), label: `${i + 1}. ${leaf.label}` }))}
            className='w-full max-w-xs'
          />
          {/* Announces each turn; the list above already shows the page, so it isn't drawn
              (drawn, it pushed the list above the buttons) */}
          <p role='status' className='sr-only'>
            Page {at + 1} of {leaves.length}: {leaves[at]?.label}
          </p>
        </div>
        <Button quiet onClick={() => go(at + 1)} disabled={at === leaves.length - 1}>
          <span className='sr-only sm:not-sr-only'>Next page</span>
          <IoChevronForward aria-hidden='true' />
        </Button>
      </nav>
    </section>
  );
}

export default PassportBook;
