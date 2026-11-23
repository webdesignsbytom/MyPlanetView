import React, { useEffect, useId, useState } from 'react';
// Components
import PressedStamp from './PressedStamp';
// The stamps (the account page's backdrop draws some of them)
import { LOADING_STAMPS } from '@/components/common/passportStampArt';

const STEP_MS = 380; // between one stamp and the next
// The most kept on screen: one of each. A long load goes round the stamps again in the same
// order, so each one's earlier copy, long buried under the rest, goes as it's pressed again
// and no stamp is ever on screen twice
const MOST = LOADING_STAMPS.length;

// The stamps pressed so far, kept across screens: the map page's own loading screen hands
// over to the one over the map while its data loads (MapExperience), and the stamps carry
// on where they were instead of starting again. A new run starts after a pause, with the
// stamps in a new order.
let pressed = [];
let order = [];
let pressedInRun = 0;
let lastShownAt = 0;
let nextKey = 0;
const CARRY_ON_MS = 1500;
// Whether the screen before closed a moment ago. A clock that went back (a time change, a
// device's clock set right) starts a fresh run rather than carrying on for ever
const carriesOn = () => {
  const since = Date.now() - lastShownAt;
  return since >= 0 && since <= CARRY_ON_MS;
};

const between = (low, high) => low + Math.random() * (high - low);

// Every stamp once, in a random order
function shuffledStamps() {
  const list = LOADING_STAMPS.map((_, i) => i);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function startRun() {
  pressed = [];
  order = shuffledStamps();
  pressedInRun = 0;
}

// One more stamp: the next in this run's order, anywhere on the screen (kept clear of the
// very edges), at its own tilt and size
function pressOne() {
  const design = order[pressedInRun++ % order.length];
  return { key: nextKey++, design, left: between(10, 90), top: between(5, 95), rotate: between(-28, 28), scale: between(0.75, 1.15) };
}

/**
 * The map's loading picture (17 Nov 2026, the user's wish, instead of a card with a spinner):
 * passport stamps, pressed one after another at random all over the screen (18 Nov 2026, the
 * user's wish: anywhere, and more and more, never cleared and started again) while the map
 * and all its data load. Every stamp is a different country's, and none comes again until
 * all have been pressed (19 Nov 2026, the user's wish). Each lands with a stamp's thump
 * (animate-stamp-in); with reduced motion they just appear. One design prints in green here
 * (its `loadingInk`), among the cream and deep red. It fills the positioned box it's in.
 * Decorative: the screen's "Loading…" is the status.
 */
function StampLoading() {
  const id = useId();
  // Carried on from the screen before, unless that was a while ago
  const [stamps, setStamps] = useState(() => (carriesOn() ? pressed : []));

  useEffect(() => {
    if (!carriesOn()) startRun();
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
      {stamps.map((stamp) => (
        <PressedStamp key={stamp.key} stamp={stamp} arcId={`${id}-arc-${stamp.key}`} />
      ))}
    </div>
  );
}

export default StampLoading;
