import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LU from '@/utils/map/countryMaps/LU.js';
import { REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';
import { placeOnCountryMap } from '@/utils/map/countryMapGeo';

// A country's own map (components/countryMap/CountryMapView.jsx) with Luxembourg's real map
// and a stand-in viewport whose zoom the test sets: its layers (the little 3D landmark models,
// the pins, the header's count), a state's card, a new pin and the list. Its touch handling is
// CountryMapView.test.jsx's.

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
  return { ...actual, default: () => viewport };
});

// One model on Luxembourg's map (and one on France's, which mustn't show), at a known size
vi.mock('@/utils/map/landmarkModels', () => ({
  LANDMARK_MODEL_HEIGHTS: [160, 320],
  LANDMARK_MODELS: [
    { id: 'test-tower', name: 'Test Tower', landmark: 'Q99', maps: ['LU'], latitude: 49.61, longitude: 6.13, size: 1.2, aspect: 0.5, anchor: [0.5, 0.9], images: { 160: '/m-160.webp', 320: '/m-320.webp' } },
    { id: 'elsewhere', name: 'Elsewhere', landmark: 'Q98', maps: ['FR'], latitude: 48.86, longitude: 2.29, size: 1, aspect: 1, anchor: [0.5, 0.5], images: { 160: '/e.webp', 320: '/e.webp' } },
  ],
}));
// The landmark the test tower belongs to (its card's "World Heritage" row)
vi.mock('@/hooks/useLandmarks', () => ({
  default: () => ({ landmarks: [{ id: 'lm-old-town', name: 'Old Town of Luxembourg', slug: 'old-town', countryCode: 'LU', isUnesco: true, wikidataId: 'Q99' }], loading: false, error: null }),
}));
vi.mock('@/hooks/useModelFacts', () => ({ default: () => null }));
// Where the card says the model stands: its facts' first row
const whereOnCard = () => document.querySelector('[data-landmark-about] dd')?.textContent;

const mapData = vi.hoisted(() => ({ value: null }));
vi.mock('@/hooks/useCountryMapData', () => ({ default: () => mapData.value }));
vi.mock('@/components/map/MapPanel', () => ({
  default: ({ title, onClose, children }) => (
    <section role='dialog' aria-label={title} data-map-panel={title}>
      <h2>{title}</h2>
      <button type='button' aria-label={`Close ${title}`} onClick={onClose} />
      {children}
    </section>
  ),
}));

const { default: CountryMapView } = await import('@/components/countryMap/CountryMapView');

const PIN = { id: 'pin1', name: 'Our café', latitude: 49.6, longitude: 6.12 };

beforeEach(() => {
  zoomStore.reset();
  mapData.value = {
    geo: LU,
    statuses: new Map([['LU-D', 'VISITED']]),
    pins: [PIN],
    error: null,
    setStatus: vi.fn().mockResolvedValue([]),
  };
  // jsdom has no screen transform: a press is taken at its own client position
  SVGElement.prototype.getScreenCTM = () => ({ inverse: () => ({}) });
  vi.stubGlobal(
    'DOMPoint',
    class {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
      matrixTransform() {
        return { x: this.x, y: this.y };
      }
    },
  );
});
afterEach(() => {
  zoomStore.reset();
  delete SVGElement.prototype.getScreenCTM;
});

const draw = (props = {}) => {
  const handlers = { onOpenPin: vi.fn(), onNewPin: vi.fn(), onVisitsChanged: vi.fn(), onClose: vi.fn() };
  const utils = render(<CountryMapView code='LU' source={{ mapId: 'map-1' }} canEdit {...handlers} {...props} />);
  return { ...handlers, ...utils, svg: utils.container.querySelector('svg[role="application"]') };
};

describe('CountryMapView: the landmark models', () => {
  // The picture's height on screen, in CSS pixels, at the viewport's zoom
  const screenHeight = (image) => Number(image.getAttribute('height')) * zoomStore.get() * REFERENCE_PX_PER_UNIT;
  const model = (container) => container.querySelector('[data-landmark-model="test-tower"]');

  it('draws only the models on this country’s map, standing on their spot, named for the pointer', () => {
    const { container } = draw();
    expect(container.querySelector('[data-landmark-model="elsewhere"]')).toBeNull();
    const at = placeOnCountryMap(LU, 49.61, 6.13);
    expect(model(container).getAttribute('transform')).toBe(`translate(${at.x} ${at.y})`);
    expect(model(container).querySelector('title').textContent).toBe('Test Tower');
    expect(model(container).getAttribute('class')).toContain('cursor-pointer');
    // The list is the keyboard's and screen readers' way to them
    expect(model(container).parentElement.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens its card on a press (24 Nov 2026, the user’s wish), with the state it stands in', () => {
    const { container, onOpenPin } = draw();
    // jsdom can't test a point against a shape: Luxembourg's district stands in for the browser's answer
    const inFill = vi.fn(function inFill() {
      return this.closest('[data-state]')?.getAttribute('data-state') === 'LU-L';
    });
    SVGElement.prototype.isPointInFill = inFill;
    try {
      fireEvent.click(model(container).querySelector('image'));
      const card = document.querySelector('[data-landmark-card="test-tower"]');
      expect(card.querySelector('[role="dialog"]').getAttribute('aria-label')).toBe('Test Tower');
      expect(screen.getByRole('heading', { level: 2, name: 'Test Tower' })).toBeTruthy();
      expect(card.textContent).toContain('Old Town of Luxembourg');
      // The district it stands in, then the country
      expect(whereOnCard()).toBe('Luxembourg, Luxembourg');
      expect(document.querySelector('[data-state-popover]')).toBeNull();
      expect(onOpenPin).not.toHaveBeenCalled();
    } finally {
      delete SVGElement.prototype.isPointInFill;
    }
  });

  it('closes its card with Escape, or a state’s card takes its place', () => {
    const { container } = draw();
    fireEvent.click(model(container).querySelector('image'));
    expect(document.querySelector('[data-landmark-card]')).toBeTruthy();
    // No state found where the browser can't test a point: the country alone
    expect(whereOnCard()).toBe('Luxembourg');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('[data-landmark-card]')).toBeNull();
    fireEvent.click(model(container).querySelector('image'));
    fireEvent.click(container.querySelector('[data-state="LU-D"] path'));
    expect(document.querySelector('[data-landmark-card]')).toBeNull();
    expect(document.querySelector('[data-state-popover]')).toBeTruthy();
  });

  it('leaves its card open when a dialog over the map took Escape (the celebration)', () => {
    const { container } = draw();
    fireEvent.click(model(container).querySelector('image'));
    const taken = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
    taken.preventDefault();
    window.dispatchEvent(taken);
    expect(document.querySelector('[data-landmark-card]')).toBeTruthy();
  });

  it('is 64 px tall times its size at zoom 1, its tile’s middle on the spot', () => {
    const { container } = draw();
    const image = model(container).querySelector('image');
    expect(screenHeight(image)).toBeCloseTo(64 * 1.2, 6);
    const h = Number(image.getAttribute('height'));
    expect(Number(image.getAttribute('width'))).toBeCloseTo(h * 0.5, 9);
    expect(Number(image.getAttribute('x'))).toBeCloseTo(-h * 0.5 * 0.5, 9);
    expect(Number(image.getAttribute('y'))).toBeCloseTo(-h * 0.9, 9);
    // 77 px on screen: the 160 px picture is sharp enough on a 2× screen
    expect(image.getAttribute('href')).toBe('/m-160.webp');
  });

  it('grows with the square root of the zoom, between 40 and 150 px (times its size)', () => {
    const { container } = draw();
    const image = () => model(container).querySelector('image');
    act(() => zoomStore.set(4));
    expect(screenHeight(image())).toBeCloseTo(128 * 1.2, 6);
    expect(image().getAttribute('href')).toBe('/m-320.webp');
    act(() => zoomStore.set(0.25));
    expect(screenHeight(image())).toBeCloseTo(40 * 1.2, 6);
    act(() => zoomStore.set(16));
    expect(screenHeight(image())).toBeCloseTo(150 * 1.2, 6);
    // Bigger than any picture's half: the biggest one
    expect(image().getAttribute('href')).toBe('/m-320.webp');
  });
});

describe('CountryMapView', () => {
  it('names the country, focused, with how many of its states are visited', () => {
    const { container, svg } = draw();
    const heading = screen.getByText('Luxembourg', { selector: 'h2' });
    expect(document.activeElement).toBe(heading);
    expect(container.querySelector('[data-state-count]').textContent).toBe('1 of 3 districts visited');
    expect(svg.getAttribute('aria-label')).toBe('Map of Luxembourg: its districts');
    expect(container.querySelector('[data-country-map="LU"]')).toBeTruthy();
  });

  it('draws each pin with its name, and opens one on a press', () => {
    const { container, onOpenPin } = draw();
    const pin = container.querySelector('[data-pin="pin1"]');
    expect(pin.querySelector('title').textContent).toBe('Our café');
    fireEvent.click(pin.querySelector('path'));
    expect(onOpenPin).toHaveBeenCalledWith('pin1');
  });

  it('opens a state’s card on a press, where an editor marks it', async () => {
    const { container, onVisitsChanged } = draw();
    mapData.value.setStatus.mockResolvedValue(['LU']);
    fireEvent.click(container.querySelector('[data-state="LU-L"] path'));
    const card = document.querySelector('[data-state-popover]');
    expect(card.getAttribute('aria-label')).toBe('Luxembourg');
    fireEvent.click(screen.getByText('Lived there'));
    await waitFor(() => expect(mapData.value.setStatus).toHaveBeenCalledWith('LU-L', 'LIVED'));
    await waitFor(() => expect(onVisitsChanged).toHaveBeenCalled());
  });

  it('says why a state’s change wasn’t saved', async () => {
    const { container } = draw();
    mapData.value.setStatus.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Not now.' }));
    fireEvent.click(container.querySelector('[data-state="LU-L"] path'));
    fireEvent.click(screen.getByText('Want to go'));
    expect((await screen.findByText('Not now.')).getAttribute('role')).toBe('alert');
  });

  it('gives a viewer the card with no stamps, and no “Add a pin”', () => {
    const { container } = draw({ canEdit: false });
    expect(screen.queryByText('Add a pin')).toBeNull();
    fireEvent.click(container.querySelector('[data-state="LU-D"] path'));
    expect(document.querySelector('[data-state-popover]').textContent).toContain('Visited');
    expect(document.querySelector('[data-state-popover] [role="group"]')).toBeNull();
  });

  it('closes the card with Escape', () => {
    const { container } = draw();
    fireEvent.click(container.querySelector('[data-state="LU-D"] path'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('[data-state-popover]')).toBeNull();
  });

  it('places a new pin where the map is pressed, after “Add a pin”', () => {
    const { svg, onNewPin } = draw();
    const add = screen.getAllByText('Add a pin')[0].closest('button');
    fireEvent.click(add);
    expect(add.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Press the map where the pin goes.').getAttribute('role')).toBe('status');
    expect(svg.getAttribute('aria-label')).toBe('Map of Luxembourg: its districts. Press where the pin goes');
    const at = placeOnCountryMap(LU, 49.6, 6.1);
    fireEvent.click(svg, { clientX: at.x, clientY: at.y });
    const [spot] = onNewPin.mock.calls[0];
    expect(spot.countryCode).toBe('LU');
    expect(spot.latitude).toBeCloseTo(49.6, 3);
    expect(spot.longitude).toBeCloseTo(6.1, 3);
    expect(screen.queryByText('Press the map where the pin goes.')).toBeNull();
  });

  it('stops placing a pin with Escape, and locks it for an unverified editor', () => {
    const { unmount } = draw();
    fireEvent.click(screen.getAllByText('Add a pin')[0].closest('button'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Press the map where the pin goes.')).toBeNull();
    unmount();
    draw({ locked: true });
    expect(screen.getAllByText('Add a pin')[0].closest('button').disabled).toBe(true);
  });

  it('lists the states, landmarks and pins in a panel from the list stamp', () => {
    const { onOpenPin } = draw();
    fireEvent.click(screen.getByLabelText('List the districts, landmarks and pins'));
    expect(document.querySelector('[data-map-panel]').getAttribute('data-map-panel')).toBe('Districts, landmarks and pins');
    fireEvent.click(screen.getByText('Diekirch', { selector: 'button span' }));
    expect(document.querySelector('[data-state-popover]').getAttribute('aria-label')).toBe('Diekirch');
    // A landmark's card beside its button, in the state's place
    const tower = document.querySelector('[data-list-model="test-tower"]');
    fireEvent.click(tower);
    expect(document.querySelector('[data-state-popover]')).toBeNull();
    expect(document.querySelector('[data-landmark-card="test-tower"]')).toBeTruthy();
    // Closed, focus goes back to its button
    fireEvent.click(screen.getByLabelText('Close Test Tower'));
    expect(document.activeElement).toBe(tower);
    fireEvent.click(screen.getByText('Our café', { selector: 'button span' }));
    expect(onOpenPin).toHaveBeenCalledWith('pin1');
    expect(document.querySelector('[data-map-panel]')).toBeNull();
  });

  it('goes back to the world map', () => {
    const { onClose } = draw();
    fireEvent.click(screen.getAllByText('World map')[0].closest('button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the loading stamps until its data is in, and a failure', () => {
    mapData.value = { geo: null, statuses: new Map(), pins: [], error: null, setStatus: vi.fn() };
    const { container, unmount } = draw();
    expect(container.querySelector('[data-country-map-loading]')).toBeTruthy();
    expect(screen.getByText('Opening Luxembourg…')).toBeTruthy();
    unmount();
    mapData.value = { ...mapData.value, error: 'The map couldn’t be loaded.' };
    draw();
    expect(screen.getByText('The map couldn’t be loaded.').closest('[role="alert"]')).toBeTruthy();
  });
});
