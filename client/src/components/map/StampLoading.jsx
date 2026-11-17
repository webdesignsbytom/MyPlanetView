import React, { useEffect, useId, useState } from 'react';
// The stamps (the account page's backdrop draws the same ones)
import { ARC_PATH, PASSPORT_STAMPS, TILE_H, TILE_W, drawStamp } from '@/components/common/passportStampArt';

const STEP_MS = 380; // between one stamp and the next
const HOLD_STEPS = 4; // all of them stay this many steps before the page starts again
const CYCLE = PASSPORT_STAMPS.length + HOLD_STEPS;

// When this run of stamps began, kept across screens: the map page's own loading screen
// hands over to the one over the map while its data loads (MapExperience), and the stamps
// carry on from where they were instead of starting again. A new run starts after a pause.
let runStartedAt = 0;
let lastShownAt = 0;
const CARRY_ON_MS = 1500;

// How many stamps are down now: the first one at once
const stampsNow = () => (Math.floor((Date.now() - runStartedAt) / STEP_MS) % CYCLE) + 1;

/**
 * The map's loading picture (17 Nov 2026, the user's wish, instead of a card with a spinner):
 * the passport stamps from the account page's backdrop, pressed on one after another in
 * their places, the first at once, then cleared and pressed again while the map and all its
 * data load. Each lands with a stamp's thump (animate-stamp-in); with reduced motion they
 * just appear. Decorative: the screen's "Loading…" is the status.
 */
function StampLoading() {
  const id = useId();
  const arc = `${id}-arc`;
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (Date.now() - lastShownAt > CARRY_ON_MS) runStartedAt = Date.now();
    setShown(stampsNow());
    const timer = window.setInterval(() => {
      lastShownAt = Date.now();
      setShown(stampsNow());
    }, 100);
    return () => {
      lastShownAt = Date.now();
      window.clearInterval(timer);
    };
  }, []);

  return (
    <svg aria-hidden='true' viewBox={`-20 -20 ${TILE_W + 40} ${TILE_H + 40}`} preserveAspectRatio='xMidYMin meet' className='h-full w-full max-w-4xl'>
      <defs>
        <path id={arc} d={ARC_PATH} />
      </defs>
      {PASSPORT_STAMPS.slice(0, Math.min(shown, PASSPORT_STAMPS.length)).map((stamp, i) => (
        <g key={i} className='origin-center motion-safe:animate-stamp-in [transform-box:fill-box]'>
          {drawStamp(stamp, arc, 'opacity-90')}
        </g>
      ))}
    </svg>
  );
}

export default StampLoading;
