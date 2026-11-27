// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FINGER, MARGIN, MIN_SCALE, fingerPlace } from '@/utils/map/hoverCardPlace';

// A Pixel 7's screen, and a poster card's height (27 Nov 2026, the user's report: on phones the
// long press's card ran off the bottom of the screen)
const SCREEN = 839;
const CARD = 430;
const onScreen = ({ top, scale }, height = CARD, screen = SCREEN) => top >= MARGIN && top + height * scale <= screen - MARGIN;

describe('fingerPlace', () => {
  it('puts the card above the finger when it fits there, whole', () => {
    expect(fingerPlace(700, CARD, SCREEN)).toEqual({ top: 700 - FINGER - CARD, scale: 1 });
  });

  it('puts it below the finger when there’s no room above', () => {
    expect(fingerPlace(100, CARD, SCREEN)).toEqual({ top: 100 + FINGER, scale: 1 });
  });

  it('shrinks it to fit on the side with more room when it fits on neither, never off the screen', () => {
    // Near the middle of the screen: 336 px above, 415 below
    const middle = fingerPlace(380, CARD, SCREEN);
    expect(middle.scale).toBeCloseTo(415 / CARD);
    expect(middle.top).toBe(380 + FINGER);
    expect(onScreen(middle)).toBe(true);
    // A little higher up the screen, more room above: above it, its bottom clear of the finger
    const higher = fingerPlace(440, CARD, 760);
    expect(higher.scale).toBeLessThan(1);
    expect(higher.top + CARD * higher.scale).toBeCloseTo(440 - FINGER);
    expect(onScreen(higher, CARD, 760)).toBe(true);
  });

  it('every press on a phone keeps the card on the screen', () => {
    for (let y = 0; y <= SCREEN; y += 7) expect(onScreen(fingerPlace(y, CARD, SCREEN)), `a press at ${y}`).toBe(true);
  });

  it('draws it no smaller than half size, then keeps it on the screen over the finger', () => {
    // A phone on its side: 360 px tall
    const sideways = fingerPlace(180, CARD, 360);
    expect(sideways.scale).toBe(MIN_SCALE);
    expect(onScreen(sideways, CARD, 360)).toBe(true);
  });
});
