import React, { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { HOME_DRAFT_PLACES } from '@/utils/homeDraft/destinations';
import { CARD_SECONDS, makePlanet, START_LONGITUDE } from '@/utils/homeDraft/planet';
import useHomeDraftGlobe from '@/hooks/useHomeDraftGlobe';

// jsdom has no 2D canvas, so the globe is a stand-in: the places it says are in view, each
// one's height on the screen by its latitude, and every draw recorded
const fake = vi.hoisted(() => ({ engine: null, visible: new Set(), reduced: false }));
vi.mock('@/utils/homeDraft/planet', async (importOriginal) => ({
  ...(await importOriginal()),
  makePlanet: vi.fn(() => fake.engine),
}));
// The device's reduced-motion setting
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ default: () => fake.reduced }));

// Pictures that load at once (jsdom loads none)
class LoadingImage {
  onload = null;
  #src = '';
  get src() {
    return this.#src;
  }
  set src(value) {
    this.#src = value;
    queueMicrotask(() => this.onload?.());
  }
  decode() {
    return Promise.resolve();
  }
}

const byId = (id) => HOME_DRAFT_PLACES.find((place) => place.id === id);
const ids = (places) => places.map((place) => place.id);

let globe;
function Harness({ dialogOpen = false }) {
  const dialogRef = useRef(null);
  globe = useHomeDraftGlobe({ dialogRef });
  return (
    <>
      <dialog ref={dialogRef} open={dialogOpen || undefined} />
      <div ref={globe.stageRef}>
        <canvas ref={globe.canvasRef} />
        {globe.cards.map((place, slot) => (
          <div
            key={slot}
            data-card={place.id}
            ref={(node) => {
              globe.slotRefs.current[slot] = node;
            }}
          />
        ))}
      </div>
    </>
  );
}

// Renders the hook and lets the texture and the photos load
async function start(props = {}) {
  const result = render(<Harness {...props} />);
  await act(async () => {});
  return result;
}
const lastDraw = () => fake.engine.draw.mock.calls.at(-1);
const turn = (ms) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  vi.stubGlobal('Image', LoadingImage);
  fake.visible = new Set(['392', '764', '036', '360']);
  fake.reduced = false;
  fake.engine = {
    resize: vi.fn(),
    draw: vi.fn(),
    canShow: (place) => fake.visible.has(place.id),
    screenY: (place) => -place.point[1],
  };
  makePlanet.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useHomeDraftGlobe', () => {
  it('starts with Japan, Thailand and Australia, and draws the globe once its texture loads', async () => {
    await start();
    expect(ids(globe.cards)).toEqual(['392', '764', '036']);
    expect(makePlanet).toHaveBeenCalledTimes(1);
    expect(makePlanet.mock.calls[0][0].tagName).toBe('CANVAS');
    expect(globe.drawn).toBe(true);
    const [lon, cards, anchors] = lastDraw();
    expect(lon).toBe(START_LONGITUDE);
    expect(ids(cards)).toEqual(['392', '764', '036']);
    // Each card's line starts at its right-hand edge
    expect(anchors).toHaveLength(3);
  });

  it('turns, and every few seconds changes a card to a place in view', async () => {
    await start();
    await turn(1000);
    expect(lastDraw()[0]).toBeGreaterThan(START_LONGITUDE);
    expect(ids(globe.cards)).toEqual(['392', '764', '036']);
    await turn(CARD_SECONDS * 1000);
    // Indonesia was the one place in view not on a card; the first card's turn came first
    expect(ids(globe.cards)).toEqual(['360', '764', '036']);
    // Japan's card fades out under it
    expect(globe.outgoing).toEqual({ slot: 0, place: byId('392') });
    act(() => globe.settle(globe.outgoing));
    expect(globe.outgoing).toBeNull();
  });

  it('stands still for a viewer who asked for less motion', async () => {
    fake.reduced = true;
    await start();
    expect(globe.drawn).toBe(true);
    const draws = fake.engine.draw.mock.calls.length;
    await turn(CARD_SECONDS * 1000 + 500);
    expect(fake.engine.draw.mock.calls.length).toBe(draws);
    expect(ids(globe.cards)).toEqual(['392', '764', '036']);
    expect(globe).not.toHaveProperty('toggleRunning');
  });

  it('stands still while the dialog is open', async () => {
    await start({ dialogOpen: true });
    const draws = fake.engine.draw.mock.calls.length;
    await turn(CARD_SECONDS * 1000 + 500);
    expect(fake.engine.draw.mock.calls.length).toBe(draws);
    expect(ids(globe.cards)).toEqual(['392', '764', '036']);
  });

  it('stops drawing once the page has gone', async () => {
    const { unmount } = await start();
    unmount();
    const draws = fake.engine.draw.mock.calls.length;
    await turn(2000);
    expect(fake.engine.draw.mock.calls.length).toBe(draws);
  });
});
