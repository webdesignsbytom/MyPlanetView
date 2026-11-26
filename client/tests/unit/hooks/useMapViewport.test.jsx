import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import useMapViewport, { MOVING_MS, useViewportZoom } from '@/hooks/useMapViewport';
import { MAP_WIDTH, REFERENCE_PX_PER_UNIT, mapExtent } from '@/utils/map/projection';

const FULL = mapExtent(true); // -16.6 to 1020.6
const NO_ANTARCTICA = mapExtent(false); // -16.6 to 857
let screen = { width: 1920, height: 1080 };
let viewport;
let zoomRenders;

function ZoomProbe({ select }) {
  const value = useViewportZoom(viewport, select);
  zoomRenders.push(value);
  return null;
}

function Map(props) {
  viewport = useMapViewport(props);
  return (
    <>
      <svg ref={viewport.svgRef} data-testid='map' />
      {props.probe && <ZoomProbe select={props.select} />}
    </>
  );
}

const svg = () => document.querySelector('[data-testid="map"]');
const view = () => viewport.getView();
// The view goes onto the SVG and the zoom to its subscribers in a task after the change
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const close = (a, b) => expect(a).toBeCloseTo(b, 1);
const pointer = (extra) => ({ button: 0, pointerId: 1, pointerType: 'mouse', buttons: 1, timeStamp: 0, currentTarget: svg(), ...extra });

beforeEach(() => {
  screen = { width: 1920, height: 1080 };
  zoomRenders = [];
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    left: 0,
    top: 0,
    x: 0,
    y: 0,
    width: screen.width,
    height: screen.height,
    right: screen.width,
    bottom: screen.height,
  }));
});

afterEach(() => vi.useRealTimers());

describe('useMapViewport: the opening view', () => {
  it('on a wide screen, opens pole line to pole line with the sides a pan away', () => {
    render(<Map />);
    // The view has the screen's shape (1080 / 1920)
    close(view().w, (FULL.bottom - FULL.top) / 0.5625);
    close(view().h, FULL.bottom - FULL.top);
    close(view().y, FULL.top);
    close(view().x, (MAP_WIDTH - view().w) / 2);
    expect(svg().getAttribute('viewBox')).toBe(`${view().x} ${view().y} ${view().w} ${view().h}`);
  });

  it('on a phone held upright, opens fully zoomed out, centred, Antarctica in view', () => {
    screen = { width: 400, height: 800 };
    render(<Map />);
    close(view().h, FULL.bottom - FULL.top);
    close(view().w, (FULL.bottom - FULL.top) / 2);
    close(view().x + view().w / 2, MAP_WIDTH / 2);
  });

  it('gives the zoom as a screen scale: 1 is the whole map across 1920 pixels', () => {
    render(<Map />);
    close(viewport.getZoom(), 1920 / view().w / REFERENCE_PX_PER_UNIT);
  });

  it('hands back the same object on every render', () => {
    const { rerender } = render(<Map />);
    const first = viewport;
    rerender(<Map />);
    expect(viewport).toBe(first);
  });
});

describe('useMapViewport: zooming', () => {
  it('zooms in and out by 1.6 around the middle of the view', async () => {
    render(<Map />);
    const home = view();
    act(() => viewport.zoomIn());
    close(view().w, home.w / 1.6);
    close(view().x + view().w / 2, home.x + home.w / 2);
    act(() => viewport.zoomOut());
    close(view().w, home.w);
  });

  it('never zooms out past the map’s pole lines', () => {
    render(<Map />);
    const home = view();
    act(() => viewport.zoomOut());
    act(() => viewport.zoomOut());
    close(view().w, home.w);
    expect(view().y).toBeGreaterThanOrEqual(FULL.top - 0.01);
    expect(view().y + view().h).toBeLessThanOrEqual(FULL.bottom + 0.01);
  });

  it('stops at zoom 64 on every screen', async () => {
    render(<Map />);
    for (let i = 0; i < 20; i += 1) act(() => viewport.zoomIn());
    await settle();
    close(viewport.getZoom(), 64);
    close(view().w, 1920 / (64 * REFERENCE_PX_PER_UNIT));
  });

  it('stops at the caller’s own closest zoom', async () => {
    render(<Map maxZoom={10} />);
    for (let i = 0; i < 20; i += 1) act(() => viewport.zoomIn());
    await settle();
    close(viewport.getZoom(), 10);
  });

  it('zooms with the wheel around the pointer, stopping the page scrolling', () => {
    render(<Map />);
    const home = view();
    const wheel = new WheelEvent('wheel', { deltaY: -100, clientX: 0, clientY: 0, cancelable: true });
    act(() => svg().dispatchEvent(wheel));
    expect(wheel.defaultPrevented).toBe(true);
    close(view().w, home.w / 1.15);
    // The point under the pointer stays put: here the view's top left corner
    close(view().x, home.x);
  });

  it('leaves the wheel to the page when the map doesn’t zoom with it', () => {
    render(<Map wheelZoom={false} />);
    const wheel = new WheelEvent('wheel', { deltaY: -100, cancelable: true });
    svg().dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it('centres on a point at a given width, then resets to the opening view', () => {
    render(<Map />);
    const home = view();
    act(() => viewport.focusOn(1000, 400, 200));
    close(view().w, 200);
    close(view().x + view().w / 2, 1000);
    close(view().y + view().h / 2, 400);
    act(() => viewport.reset());
    expect(view()).toEqual(home);
  });
});

describe('useMapViewport: panning', () => {
  it('pans with the arrow keys, never past the map’s sides or pole lines', () => {
    render(<Map />);
    const key = (k) => {
      const e = { key: k, preventDefault: vi.fn() };
      act(() => viewport.handlers.onKeyDown(e));
      return e;
    };
    expect(key('ArrowLeft').preventDefault).toHaveBeenCalled();
    expect(view().x).toBe(0);
    key('ArrowUp');
    close(view().y, FULL.top);
    act(() => viewport.zoomIn());
    for (let i = 0; i < 30; i += 1) {
      key('ArrowRight');
      key('ArrowDown');
    }
    close(view().x + view().w, MAP_WIDTH);
    close(view().y + view().h, FULL.bottom);
    expect(key('Tab').preventDefault).not.toHaveBeenCalled();
  });

  it('zooms with + and -, and 0 goes home', () => {
    render(<Map />);
    const home = view();
    act(() => viewport.handlers.onKeyDown({ key: '+', preventDefault() {} }));
    close(view().w, home.w / 1.6);
    act(() => viewport.handlers.onKeyDown({ key: '-', preventDefault() {} }));
    close(view().w, home.w);
    act(() => viewport.handlers.onKeyDown({ key: '=', preventDefault() {} }));
    act(() => viewport.handlers.onKeyDown({ key: '0', preventDefault() {} }));
    expect(view()).toEqual(home);
  });

  it('drags the map with the pointer, showing the grabbing hand while held', () => {
    render(<Map />);
    act(() => viewport.zoomIn());
    act(() => viewport.zoomIn());
    const before = view();
    act(() => viewport.handlers.onPointerDown(pointer({ clientX: 500, clientY: 500 })));
    expect(svg().hasAttribute('data-grabbing')).toBe(true);
    // Under five pixels is still a tap
    act(() => viewport.handlers.onPointerMove(pointer({ clientX: 503, clientY: 500 })));
    expect(view()).toEqual(before);
    act(() => viewport.handlers.onPointerMove(pointer({ clientX: 600, clientY: 550 })));
    const scale = Math.max(before.w / 1920, before.h / 1080);
    close(view().x, before.x - 100 * scale);
    close(view().y, before.y - 50 * scale);
    act(() => viewport.handlers.onPointerUp(pointer({ clientX: 600, clientY: 550 })));
    expect(svg().hasAttribute('data-grabbing')).toBe(false);
  });

  it('ends a drag whose button was let go off the map', () => {
    render(<Map />);
    act(() => viewport.zoomIn());
    act(() => viewport.handlers.onPointerDown(pointer({ clientX: 500, clientY: 500 })));
    const before = view();
    act(() => viewport.handlers.onPointerMove(pointer({ clientX: 700, clientY: 500, buttons: 0 })));
    expect(view()).toEqual(before);
    expect(svg().hasAttribute('data-grabbing')).toBe(false);
  });

  it('pinches with two fingers to zoom', () => {
    render(<Map />);
    const home = view();
    const touch = (id, x) => pointer({ pointerId: id, pointerType: 'touch', clientX: x, clientY: 500 });
    act(() => viewport.handlers.onPointerDown(touch(1, 900)));
    act(() => viewport.handlers.onPointerDown(touch(2, 1000)));
    act(() => viewport.handlers.onPointerMove(touch(2, 1100)));
    close(view().w, home.w / 2);
  });

  it('tells the view’s subscribers of every pan, and the zoom’s only of a new zoom', async () => {
    render(<Map />);
    const onView = vi.fn();
    const onZoom = vi.fn();
    viewport.subscribeView(onView);
    viewport.subscribe(onZoom);
    act(() => viewport.zoomIn());
    await settle();
    act(() => viewport.handlers.onKeyDown({ key: 'ArrowRight', preventDefault() {} }));
    await settle();
    expect(onView).toHaveBeenCalledTimes(2);
    expect(onZoom).toHaveBeenCalledTimes(1);
    expect(svg().getAttribute('viewBox')).toBe(`${view().x} ${view().y} ${view().w} ${view().h}`);
  });

  // What's too costly for every frame of a pan waits for the map to be still (25 Nov 2026: a
  // metallic finish's lit edges)
  it('marks the map as moving while its view changes, until it has been still for a moment', async () => {
    render(<Map />);
    await new Promise((resolve) => setTimeout(resolve, MOVING_MS + 50));
    expect(svg().hasAttribute('data-moving')).toBe(false);
    act(() => viewport.zoomIn());
    await settle();
    expect(svg().getAttribute('data-moving')).toBe('');
    // Another move before it's still keeps it moving
    await new Promise((resolve) => setTimeout(resolve, MOVING_MS / 2));
    act(() => viewport.handlers.onKeyDown({ key: 'ArrowRight', preventDefault() {} }));
    await settle();
    await new Promise((resolve) => setTimeout(resolve, MOVING_MS / 2 + 20));
    expect(svg().hasAttribute('data-moving')).toBe(true);
    await act(() => new Promise((resolve) => setTimeout(resolve, MOVING_MS)));
    expect(svg().hasAttribute('data-moving')).toBe(false);
  });
});

describe('useMapViewport: taps', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));

  const tap = (time, x = 500) => {
    act(() => viewport.handlers.onPointerDown(pointer({ clientX: x, clientY: 500, timeStamp: time })));
    act(() => viewport.handlers.onPointerUp(pointer({ clientX: x, clientY: 500, timeStamp: time + 50 })));
  };

  it('holds a tap’s action back until no second tap can follow', () => {
    render(<Map />);
    const action = vi.fn();
    tap(0);
    act(() => viewport.afterTap(action));
    act(() => vi.advanceTimersByTime(299));
    expect(action).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('zooms in two times on a double tap and opens nothing', () => {
    render(<Map />);
    const home = view();
    const action = vi.fn();
    tap(0);
    act(() => viewport.afterTap(action));
    tap(200);
    act(() => viewport.afterTap(action));
    act(() => vi.advanceTimersByTime(1000));
    expect(action).not.toHaveBeenCalled();
    close(view().w, home.w / 2);
  });

  it('counts two taps far apart as two single taps', () => {
    render(<Map />);
    const home = view();
    tap(0, 100);
    tap(200, 900);
    expect(view()).toEqual(home);
  });

  it('ignores the click that ends a drag', () => {
    render(<Map />);
    act(() => viewport.zoomIn());
    const action = vi.fn();
    act(() => viewport.handlers.onPointerDown(pointer({ clientX: 500, clientY: 500 })));
    act(() => viewport.handlers.onPointerMove(pointer({ clientX: 650, clientY: 500 })));
    act(() => viewport.handlers.onPointerUp(pointer({ clientX: 650, clientY: 500 })));
    act(() => viewport.afterTap(action));
    act(() => vi.advanceTimersByTime(1000));
    expect(action).not.toHaveBeenCalled();
  });
});

describe('useMapViewport: the extent', () => {
  it('keeps the view inside the map without Antarctica', () => {
    const { rerender } = render(<Map extent={FULL} />);
    act(() => viewport.zoomIn());
    for (let i = 0; i < 20; i += 1) act(() => viewport.handlers.onKeyDown({ key: 'ArrowDown', preventDefault() {} }));
    rerender(<Map extent={NO_ANTARCTICA} />);
    close(view().y + view().h, NO_ANTARCTICA.bottom);
    for (let i = 0; i < 5; i += 1) act(() => viewport.zoomOut());
    expect(view().y + view().h).toBeLessThanOrEqual(NO_ANTARCTICA.bottom + 0.01);
    expect(view().y).toBeGreaterThanOrEqual(NO_ANTARCTICA.top - 0.01);
  });
});

describe('useViewportZoom', () => {
  it('re-renders with each new zoom', async () => {
    render(<Map probe />);
    await settle();
    const before = zoomRenders.length;
    act(() => viewport.zoomIn());
    await settle();
    expect(zoomRenders.length).toBe(before + 1);
    close(zoomRenders.at(-1), viewport.getZoom());
  });

  it('with a select, re-renders only when its answer changes', async () => {
    render(<Map probe select={(zoom) => zoom >= 3} />);
    await settle();
    const before = zoomRenders.length;
    act(() => viewport.zoomIn()); // about 1.7: still below 3
    await settle();
    expect(zoomRenders.length).toBe(before);
    act(() => viewport.zoomIn()); // about 2.8
    act(() => viewport.zoomIn()); // about 4.4
    await settle();
    expect(zoomRenders.at(-1)).toBe(true);
    expect(zoomRenders.length).toBe(before + 1);
  });
});
