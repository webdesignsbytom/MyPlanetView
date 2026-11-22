import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

// Two small places with real detailed outlines (Montserrat and Nauru), far apart in map units
vi.mock('@/utils/map/detailShapeBounds', () => ({
  DETAIL_SHAPE_BOUNDS: { MS: [[0, 0, 10, 10]], NR: [[1000, 1000, 1010, 1010]] },
}));

// A viewport as useMapViewport gives it: the zoom and the view, and their subscribers
function fakeViewport({ zoom = 5, view = { x: 0, y: 0, w: 100, h: 100 } } = {}) {
  const zoomListeners = new Set();
  const viewListeners = new Set();
  const state = { zoom, view };
  return {
    getZoom: () => state.zoom,
    getView: () => state.view,
    subscribe: (fn) => (zoomListeners.add(fn), () => zoomListeners.delete(fn)),
    subscribeView: (fn) => (viewListeners.add(fn), () => viewListeners.delete(fn)),
    setZoom(next) {
      state.zoom = next;
      zoomListeners.forEach((fn) => fn());
    },
    pan(next) {
      state.view = next;
      viewListeners.forEach((fn) => fn());
    },
    viewListeners,
  };
}

// The outlines fetched are kept for the visit (module variables): a fresh module each test
let useDetailedShapes;
let DETAIL_FROM_ZOOM;
beforeEach(async () => {
  vi.resetModules();
  ({ default: useDetailedShapes, DETAIL_FROM_ZOOM } = await import('@/hooks/useDetailedShapes'));
});

describe('useDetailedShapes', () => {
  it('starts at zoom 4', () => {
    expect(DETAIL_FROM_ZOOM).toBe(4);
  });

  it('draws nothing in detail further out than that', () => {
    const { result } = renderHook(() => useDetailedShapes(fakeViewport({ zoom: 3.9 })));
    expect(result.current).toBeNull();
  });

  it('draws nothing in detail on a map that can’t zoom', () => {
    const { result } = renderHook(() => useDetailedShapes(fakeViewport(), false));
    expect(result.current).toBeNull();
  });

  it('fetches the places in view once the view settles, and only those', async () => {
    const viewport = fakeViewport();
    const { result } = renderHook(() => useDetailedShapes(viewport));
    expect(result.current).toEqual({});
    await waitFor(() => expect(Object.keys(result.current)).toEqual(['MS']), { timeout: 5000 });
    expect(Array.isArray(result.current.MS) || typeof result.current.MS === 'object').toBe(true);
  });

  it('swaps in the places a pan brings into view, and drops those it leaves', async () => {
    const viewport = fakeViewport();
    const { result } = renderHook(() => useDetailedShapes(viewport));
    await waitFor(() => expect(Object.keys(result.current)).toEqual(['MS']), { timeout: 5000 });
    const montserrat = result.current.MS;
    act(() => viewport.pan({ x: 950, y: 950, w: 100, h: 100 }));
    await waitFor(() => expect(Object.keys(result.current)).toEqual(['NR']), { timeout: 5000 });
    act(() => viewport.pan({ x: 0, y: 0, w: 100, h: 100 }));
    // Kept for the visit: back in view with the same paths, without fetching again
    await waitFor(() => expect(result.current.MS).toBe(montserrat), { timeout: 5000 });
  });

  it('counts a place just outside the view as in it (a tenth of the view all round)', async () => {
    const viewport = fakeViewport({ view: { x: 15, y: 15, w: 100, h: 100 } });
    const { result } = renderHook(() => useDetailedShapes(viewport));
    await waitFor(() => expect(Object.keys(result.current)).toEqual(['MS']), { timeout: 5000 });
  });

  it('stops following the view when zoomed back out', async () => {
    const viewport = fakeViewport();
    const { result } = renderHook(() => useDetailedShapes(viewport));
    await waitFor(() => expect(result.current.MS).toBeTruthy(), { timeout: 5000 });
    act(() => viewport.setZoom(2));
    expect(result.current).toBeNull();
    expect(viewport.viewListeners.size).toBe(0);
  });
});
