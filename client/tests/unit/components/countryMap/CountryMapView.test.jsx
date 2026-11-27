import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import LU from '@/utils/map/countryMaps/LU.js';

// A country's own map (components/countryMap/CountryMapView.jsx) on a phone (23 Nov 2026, the
// user's report: panning was jerky and delayed, unlike the world map's): a finger's drag is
// the map's own (touch-action none), and a zoom step redraws only the layers drawn by zoom,
// never the whole view. The viewport is a stand-in whose zoom the test sets; the data is
// Luxembourg's real map.

const zoomStore = vi.hoisted(() => {
  let zoom = 1;
  const listeners = new Set();
  return {
    get: () => zoom,
    set(next) {
      zoom = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      zoom = 1;
      listeners.clear();
    },
  };
});
// How many times the view itself rendered: it asks for its viewport once a render
const viewRenders = vi.hoisted(() => ({ count: 0 }));

vi.mock('@/hooks/useMapViewport', async (importOriginal) => {
  const actual = await importOriginal();
  const viewport = {
    svgRef: () => {},
    handlers: {},
    getZoom: () => zoomStore.get(),
    subscribe: (listener) => zoomStore.subscribe(listener),
    focusOn: () => {},
    afterTap: (action) => action(),
    zoomIn: () => {},
    zoomOut: () => {},
    reset: () => {},
  };
  return {
    ...actual,
    default: () => {
      viewRenders.count += 1;
      return viewport;
    },
  };
});

vi.mock('@/hooks/useCountryMapData', () => ({
  default: () => ({ geo: LU, statuses: new Map([['LU-D', 'VISITED']]), pins: [], error: null, setStatus: () => {} }),
}));

const { default: CountryMapView } = await import('@/components/countryMap/CountryMapView');

const draw = () => render(<CountryMapView code='LU' source={{ mapId: 'map-1' }} canEdit onClose={() => {}} />);

beforeEach(() => {
  zoomStore.reset();
  viewRenders.count = 0;
});
afterEach(() => zoomStore.reset());

describe('CountryMapView', () => {
  it('keeps a finger’s drag and pinch for the map, as the world map does', () => {
    const { container } = draw();
    const svg = container.querySelector('svg[role="application"]');
    expect(svg.getAttribute('class').split(/\s+/)).toContain('touch-none');
  });

  it('redraws only the layers drawn by zoom when the zoom changes', () => {
    const { container } = draw();
    const names = () => container.querySelector('svg[role="application"] g.fill-map-names');
    const before = Number(names().getAttribute('font-size'));
    const rendersBefore = viewRenders.count;

    act(() => zoomStore.set(4));

    // The names shrink on screen-scale (four times closer, a quarter the map units)...
    expect(Number(names().getAttribute('font-size'))).toBeCloseTo(before / 4, 6);
    // ...and the view itself didn't render again
    expect(viewRenders.count).toBe(rendersBefore);
  });

  it('still draws every state, as the map stands with it', () => {
    const { container } = draw();
    expect(container.querySelector('[data-state="LU-D"]').getAttribute('data-status')).toBe('VISITED');
    expect(container.querySelectorAll('[data-state]').length).toBe(LU.areas.filter((area) => area.code).length);
  });

  // 27 Nov 2026, the user's wish: on phones the header was too tall; a third less, as wide
  it('makes its header smaller on phones only, its buttons shorter but as wide', () => {
    const { container } = draw();
    const header = container.querySelector('[data-country-map-header]');
    const classes = (el) => el.getAttribute('class').split(/\s+/);
    const title = classes(header.querySelector('h2'));
    expect(title).toEqual(expect.arrayContaining(['text-2xl', 'phone:text-lg']));
    expect(classes(header.querySelector('[data-state-count]'))).toEqual(expect.arrayContaining(['text-sm', 'phone:text-xs']));
    expect(classes(header.querySelector('img'))).toEqual(expect.arrayContaining(['h-10', 'w-[3.25rem]', 'phone:h-6', 'phone:w-8']));
    // Both buttons (each drawn twice: the wide row and the phone's stacked one)
    const buttons = [...header.querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['World map', 'Add a pin', 'World map', 'Add a pin']);
    for (const button of buttons) {
      // Shorter on phones…
      expect(classes(button)).toEqual(expect.arrayContaining(['phone:[--btn-pad-y:0.125rem]', 'phone:[--btn-leading:1.25rem]']));
      // …with the same words and sides everywhere, so the header keeps its width
      expect(classes(button)).toEqual(expect.arrayContaining(['[--btn-pad-x:0.75rem]', '[--btn-size:0.875rem]']));
      expect(classes(button).some((name) => /^phone:\[--btn-(pad-x|size)/.test(name))).toBe(false);
    }
  });
});
