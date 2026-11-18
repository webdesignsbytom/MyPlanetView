import React, { useEffect, useId, useState } from 'react';
// The stamps (the account page's backdrop draws the same ones)
import { ARC_PATH, PASSPORT_STAMPS, drawStamp } from '@/components/common/passportStampArt';

const STEP_MS = 380; // between one stamp and the next
// The most kept on screen: on a very long load the oldest go, long buried under the rest
const MOST = 150;

// The stamps pressed so far, kept across screens: the map page's own loading screen hands
// over to the one over the map while its data loads (MapExperience), and the stamps carry
// on where they were instead of starting again. A new run starts after a pause.
let pressed = [];
let lastShownAt = 0;
let nextKey = 0;
const CARRY_ON_MS = 1500;

const between = (low, high) => low + Math.random() * (high - low);

// One more stamp: any design but the last one's, anywhere on the screen (kept clear of the
// very edges), at its own tilt and size
function pressOne() {
  const last = pressed[pressed.length - 1];
  let design = Math.floor(Math.random() * PASSPORT_STAMPS.length);
  if (last && design === last.design) design = (design + 1) % PASSPORT_STAMPS.length;
  return { key: nextKey++, design, left: between(10, 90), top: between(5, 95), rotate: between(-28, 28), scale: between(0.75, 1.15) };
}

/**
 * The map's loading picture (17 Nov 2026, the user's wish, instead of a card with a spinner):
 * the passport stamps from the account page's backdrop, pressed one after another at random
 * all over the screen (18 Nov 2026, the user's wish: anywhere, and more and more, never
 * cleared and started again) while the map and all its data load. Each lands with a stamp's
 * thump (animate-stamp-in); with reduced motion they just appear. One design prints in
 * green here (its `loadingInk`), among the cream and deep red. It fills the positioned
 * box it's in. Decorative: the screen's "Loading…" is the status.
 */
function StampLoading() {
  const id = useId();
  // Carried on from the screen before, unless that was a while ago
  const [stamps, setStamps] = useState(() => (Date.now() - lastShownAt > CARRY_ON_MS ? [] : pressed));

  useEffect(() => {
    if (Date.now() - lastShownAt > CARRY_ON_MS) pressed = [];
    const press = () => {
      pressed = [...pressed, pressOne()].slice(-MOST);
      lastShownAt = Date.now();
      setStamps(pressed);
    };
    // The first at once
    if (!pressed.length) press();
    const timer = window.setInterval(press, STEP_MS);
    return () => {
      lastShownAt = Date.now();
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div aria-hidden='true' className='pointer-events-none absolute inset-0 overflow-hidden'>
      {stamps.map((stamp) => {
        const arc = `${id}-arc-${stamp.key}`;
        const design = PASSPORT_STAMPS[stamp.design];
        return (
          <svg
            key={stamp.key}
            viewBox='-160 -120 320 240'
            className='absolute w-[clamp(8rem,32vw,15rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible'
            style={{ left: `${stamp.left}%`, top: `${stamp.top}%` }}
          >
            <defs>
              <path id={arc} d={ARC_PATH} />
            </defs>
            <g className='origin-center motion-safe:animate-stamp-in [transform-box:fill-box]'>
              <g transform={`scale(${stamp.scale})`}>{drawStamp({ ...design, x: 0, y: 0, rotate: stamp.rotate }, arc, 'opacity-90', design.loadingInk)}</g>
            </g>
          </svg>
        );
      })}
    </div>
  );
}

export default StampLoading;
