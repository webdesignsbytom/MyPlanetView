import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useSyncExternalStore } from 'react';
// Utils
import { MAP_WIDTH, mapExtent } from '@/utils/map/projection';

const MIN_WIDTH = 80; // the closest zoom: 25 times
const FULL_EXTENT = mapExtent(true);
const DRAG_THRESHOLD_PX = 5;
// Double-tap (or double-click) zooms in on the spot: two taps this close in time and space
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;
const DOUBLE_TAP_ZOOM = 2;
// Where a portrait screen opens when the page gives no home point: Europe
const DEFAULT_HOME = { x: 1060, y: 200 };

// Runs `fn` in a task of its own, after the current one, as React's scheduler does: the
// view goes onto the SVG, and what's drawn by zoom re-renders, together and outside the
// browser's frame work (done inside requestAnimationFrame, the render lengthened every
// pinch frame).
let channel = null;
const queued = [];
function afterThisTask(fn) {
  if (!channel) {
    channel = new MessageChannel();
    channel.port1.onmessage = () => queued.splice(0).forEach((run) => run());
  }
  queued.push(fn);
  channel.port2.postMessage(null);
}

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const viewBoxOf = (v) => `${v.x} ${v.y} ${v.w} ${v.h}`;

// The map's extent ({ top, bottom }: with or without Antarctica, projection.js mapExtent)
const heightOf = (extent) => extent.bottom - extent.top;
const mapAspect = (extent) => heightOf(extent) / MAP_WIDTH;
const fullView = (extent) => ({ x: 0, y: extent.top, w: MAP_WIDTH, h: heightOf(extent) });

// The view's shape (height / width). On a landscape screen it's the map's own, so the whole
// world fits. On a portrait one it's the screen's, so the map fills the height and the
// view is a slice of the world you pan across, instead of a thin strip mid-screen.
// (No screen measured yet: the map's own.)
const viewAspectFor = (screenAspect, extent) => (screenAspect > 1 ? screenAspect : mapAspect(extent));

// Keep the view on the map: never wider or taller than the whole map, never panned off it
function fit({ x, y, w }, aspect, extent) {
  const maxWidth = Math.min(MAP_WIDTH, heightOf(extent) / aspect);
  const width = clamp(w, Math.min(MIN_WIDTH, maxWidth), maxWidth);
  const height = width * aspect;
  return {
    x: clamp(x, 0, MAP_WIDTH - width),
    y: clamp(y, extent.top, extent.bottom - height),
    w: width,
    h: height,
  };
}

// The starting view: the whole map, or on a portrait screen the full height centred on home
function homeView(aspect, home, extent) {
  if (aspect === mapAspect(extent)) return fullView(extent);
  const w = heightOf(extent) / aspect;
  return fit({ x: home.x - w / 2, y: home.y - (w * aspect) / 2, w }, aspect, extent);
}

/**
 * Pan and zoom for the SVG map, through its viewBox: drag with a mouse or one finger,
 * pinch with two, double-tap or double-click to zoom in on a spot, the wheel, the
 * keyboard (arrows, + and -, 0 to reset) and buttons.
 *
 * The view isn't React state. It lives in a ref and goes straight onto the SVG's viewBox
 * (through `svgRef`), so panning re-renders nothing. What depends on the zoom (badges,
 * names, dots, pins) reads it with useViewportZoom(viewport), which re-renders only those
 * components, only when the zoom changes, and once for a burst of events (in the same
 * task that moves the viewBox).
 *
 * While a mouse button is held on the map, the SVG carries `data-grabbing` (for the
 * grabbing-hand cursor).
 * `afterTap(action)` is for click handlers on the map (opening a country): it ignores the
 * click that ends a drag or a double-tap, and holds the action back until no second tap
 * can follow, so a double-tap only zooms.
 * `home` ({ x, y } in map units) is where a portrait screen opens, e.g. the visited countries.
 * `extent` ({ top, bottom } in map units, from projection.js mapExtent) is how far the map
 * reaches: further down with Antarctica. A new extent re-fits the view before the next
 * paint (the whole map again, unless the user has moved it).
 * The returned object never changes, so it can be passed to memoised components.
 */
export default function useMapViewport({ wheelZoom = true, home = DEFAULT_HOME, extent = FULL_EXTENT } = {}) {
  const svgNodeRef = useRef(null);
  const extentRef = useRef({ top: extent.top, bottom: extent.bottom });
  // The live view, and the zoom the subscribers last saw
  const viewRef = useRef(fullView(extentRef.current));
  const zoomRef = useRef(1);
  const listenersRef = useRef(new Set());
  const pendingRef = useRef(false);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const draggedRef = useRef(false);
  // Double-tap: whether this gesture pinched, the last plain tap, whether the last tap
  // finished a double-tap, and a single tap's action waiting to see if a second follows
  const pinchedRef = useRef(false);
  const lastTapRef = useRef(null);
  const doubleTapRef = useRef(false);
  const pendingTapRef = useRef(null);
  // The view's shape, from the SVG's size on screen (and that size's own shape, once
  // measured); and whether the user has moved it yet
  const aspectRef = useRef(mapAspect(extentRef.current));
  const screenAspectRef = useRef(0);
  const movedRef = useRef(false);
  const homeRef = useRef({ x: home?.x ?? DEFAULT_HOME.x, y: home?.y ?? DEFAULT_HOME.y });
  const homeX = home?.x ?? DEFAULT_HOME.x;
  const homeY = home?.y ?? DEFAULT_HOME.y;

  useEffect(() => () => clearTimeout(pendingTapRef.current), []);

  // The live view onto the SVG, and the zoom to its subscribers, together (so the badges
  // never lag the map by a frame)
  const flush = useCallback(() => {
    pendingRef.current = false;
    const view = viewRef.current;
    svgNodeRef.current?.setAttribute('viewBox', viewBoxOf(view));
    const zoom = MAP_WIDTH / view.w;
    if (zoom === zoomRef.current) return;
    zoomRef.current = zoom;
    listenersRef.current.forEach((listener) => listener());
  }, []);

  // The one way the view changes. The ref at once (gestures read it); the SVG and the zoom
  // subscribers in a task after this one, once for any number of pointer or wheel events
  // in between. `now`: straight away, e.g. before the first paint.
  const apply = useCallback(
    (next, now = false) => {
      viewRef.current = next;
      if (now) flush();
      else if (!pendingRef.current) {
        pendingRef.current = true;
        afterThisTask(flush);
      }
    },
    [flush],
  );

  // The view's shape from the SVG's size on screen. A new shape resets the view until the
  // user has moved it; after that, a rotation keeps their place in the new shape.
  const measure = useCallback(
    (first = false) => {
      const rect = svgNodeRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;
      screenAspectRef.current = rect.height / rect.width;
      const extent = extentRef.current;
      const aspect = viewAspectFor(screenAspectRef.current, extent);
      if (aspect === aspectRef.current && !first) return;
      aspectRef.current = aspect;
      const prev = viewRef.current;
      apply(movedRef.current ? fit(prev, aspect, extent) : homeView(aspect, homeRef.current, extent), first);
    },
    [apply],
  );

  // The SVG gets its viewBox from here, never from a React prop. Measured as it's attached,
  // before the first paint, so a portrait screen never shows the whole world first (the
  // zoom subscribers catch up in their own layout effects; see useViewportZoom).
  const svgRef = useCallback(
    (node) => {
      svgNodeRef.current = node;
      if (!node) return;
      node.setAttribute('viewBox', viewBoxOf(viewRef.current));
      measure(true);
    },
    [measure],
  );

  useEffect(() => {
    const svg = svgNodeRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => measure());
    observer.observe(svg);
    return () => observer.disconnect();
  }, [measure]);

  // A new home (the visits arrived or changed) moves the view only if the user hasn't yet
  useEffect(() => {
    homeRef.current = { x: homeX, y: homeY };
    if (!movedRef.current) apply(homeView(aspectRef.current, homeRef.current, extentRef.current));
  }, [homeX, homeY, apply]);

  // A new extent (Antarctica shown or hidden): the view's shape follows the map's on a
  // landscape screen, and the view is kept on the map. Before the paint that draws the
  // map without (or with) Antarctica, so it never shows a gap.
  const extentTop = extent.top;
  const extentBottom = extent.bottom;
  useLayoutEffect(() => {
    const prev = extentRef.current;
    if (prev.top === extentTop && prev.bottom === extentBottom) return;
    const next = { top: extentTop, bottom: extentBottom };
    extentRef.current = next;
    const aspect = viewAspectFor(screenAspectRef.current, next);
    aspectRef.current = aspect;
    apply(movedRef.current ? fit(viewRef.current, aspect, next) : homeView(aspect, homeRef.current, next), true);
  }, [extentTop, extentBottom, apply]);

  // Screen position -> map position, from the live view (the SVG's viewBox can be a task
  // behind) and its box on screen, drawn "meet" and centred (xMidYMid)
  const toMap = useCallback((clientX, clientY) => {
    const rect = svgNodeRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return null;
    const view = viewRef.current;
    const scale = Math.min(rect.width / view.w, rect.height / view.h);
    return {
      x: view.x + (clientX - rect.left - (rect.width - view.w * scale) / 2) / scale,
      y: view.y + (clientY - rect.top - (rect.height - view.h * scale) / 2) / scale,
    };
  }, []);

  const zoomAround = useCallback(
    (factor, centre) => {
      movedRef.current = true;
      const prev = viewRef.current;
      const a = aspectRef.current;
      const at = centre || { x: prev.x + prev.w / 2, y: prev.y + prev.h / 2 };
      const extent = extentRef.current;
      const w = clamp(prev.w / factor, MIN_WIDTH, Math.min(MAP_WIDTH, heightOf(extent) / a));
      const ratio = w / prev.w;
      apply(fit({ x: at.x - (at.x - prev.x) * ratio, y: at.y - (at.y - prev.y) * ratio, w }, a, extent));
    },
    [apply],
  );

  const zoomIn = useCallback(() => zoomAround(1.6), [zoomAround]);
  const zoomOut = useCallback(() => zoomAround(1 / 1.6), [zoomAround]);
  const reset = useCallback(() => {
    movedRef.current = false;
    apply(homeView(aspectRef.current, homeRef.current, extentRef.current));
  }, [apply]);

  // Centre on a point at a given width (a country picked from the list)
  const focusOn = useCallback(
    (x, y, width = 400) => {
      movedRef.current = true;
      const a = aspectRef.current;
      const w = clamp(width, MIN_WIDTH, MAP_WIDTH);
      apply(fit({ x: x - w / 2, y: y - (w * a) / 2, w }, a, extentRef.current));
    },
    [apply],
  );

  const panBy = useCallback(
    (dxFraction, dyFraction) => {
      movedRef.current = true;
      const prev = viewRef.current;
      apply(
        fit({ x: prev.x + prev.w * dxFraction, y: prev.y + prev.h * dyFraction, w: prev.w }, aspectRef.current, extentRef.current),
      );
    },
    [apply],
  );

  // The wheel needs a non-passive listener to stop the page scrolling
  useEffect(() => {
    const svg = svgNodeRef.current;
    if (!svg || !wheelZoom) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const at = toMap(e.clientX, e.clientY);
      zoomAround(e.deltaY < 0 ? 1.15 : 1 / 1.15, at);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [toMap, zoomAround, wheelZoom]);

  // The grabbing hand: set straight on the SVG, so holding the mouse doesn't re-render the map
  const setGrabbing = useCallback((on) => {
    svgNodeRef.current?.toggleAttribute('data-grabbing', on);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      draggedRef.current = false;
      setGrabbing(true);
      const pointers = [...pointersRef.current.values()];
      if (pointers.length === 1) {
        pinchedRef.current = false;
        gestureRef.current = { kind: 'pan', start: pointers[0], view: viewRef.current };
      } else if (pointers.length === 2) {
        pinchedRef.current = true;
        const [a, b] = pointers;
        gestureRef.current = {
          kind: 'pinch',
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          centre: toMap((a.x + b.x) / 2, (a.y + b.y) / 2),
        };
      }
    },
    [toMap, setGrabbing],
  );

  const endPointer = useCallback(
    (e) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size === 0) {
        gestureRef.current = null;
        setGrabbing(false);
      } else if (pointersRef.current.size === 1) {
        // One finger left after a pinch: carry on panning from here
        const [only] = [...pointersRef.current.values()];
        gestureRef.current = { kind: 'pan', start: only, view: viewRef.current };
      }
    },
    [setGrabbing],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      // A mouse button let go off the map never sent its pointerup: end that gesture now,
      // rather than panning with no button held
      if (e.pointerType === 'mouse' && e.buttons === 0) {
        endPointer(e);
        return;
      }
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const gesture = gestureRef.current;
      if (!gesture) return;
      const pointers = [...pointersRef.current.values()];

      if (gesture.kind === 'pan' && pointers.length === 1) {
        const dx = pointers[0].x - gesture.start.x;
        const dy = pointers[0].y - gesture.start.y;
        if (!draggedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        if (!draggedRef.current) {
          draggedRef.current = true;
          movedRef.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        const rect = svgNodeRef.current?.getBoundingClientRect();
        if (!rect?.width || !rect?.height) return;
        // Map units per screen pixel (the map is drawn "meet": the tighter side decides)
        const base = gesture.view;
        const scale = Math.max(base.w / rect.width, base.h / rect.height);
        apply(fit({ x: base.x - dx * scale, y: base.y - dy * scale, w: base.w }, aspectRef.current, extentRef.current));
      } else if (gesture.kind === 'pinch' && pointers.length === 2) {
        const [a, b] = pointers;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (!gesture.distance || !gesture.centre) return;
        draggedRef.current = true;
        zoomAround(distance / gesture.distance, gesture.centre);
        gesture.distance = distance;
      }
    },
    [endPointer, zoomAround, apply],
  );

  // A finger or button lifted: end the gesture, and if it was a plain tap close after
  // another one, zoom in on that spot instead of opening anything
  const onPointerUp = useCallback(
    (e) => {
      const plainTap =
        pointersRef.current.has(e.pointerId) && pointersRef.current.size === 1 && !draggedRef.current && !pinchedRef.current;
      endPointer(e);
      const last = lastTapRef.current;
      const isDouble =
        plainTap && last && e.timeStamp - last.time < DOUBLE_TAP_MS && Math.hypot(e.clientX - last.x, e.clientY - last.y) < DOUBLE_TAP_PX;
      doubleTapRef.current = Boolean(isDouble);
      if (isDouble) {
        lastTapRef.current = null;
        clearTimeout(pendingTapRef.current);
        pendingTapRef.current = null;
        zoomAround(DOUBLE_TAP_ZOOM, toMap(e.clientX, e.clientY));
      } else {
        lastTapRef.current = plainTap ? { time: e.timeStamp, x: e.clientX, y: e.clientY } : null;
      }
    },
    [endPointer, toMap, zoomAround],
  );

  // For click handlers on the map. The click comes straight after its pointerup, so the
  // refs above already describe it.
  const afterTap = useCallback((action) => {
    clearTimeout(pendingTapRef.current);
    pendingTapRef.current = null;
    if (draggedRef.current || doubleTapRef.current) return;
    pendingTapRef.current = setTimeout(() => {
      pendingTapRef.current = null;
      action();
    }, DOUBLE_TAP_MS);
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      const keys = {
        ArrowLeft: () => panBy(-0.1, 0),
        ArrowRight: () => panBy(0.1, 0),
        ArrowUp: () => panBy(0, -0.1),
        ArrowDown: () => panBy(0, 0.1),
        '+': zoomIn,
        '=': zoomIn,
        '-': zoomOut,
        _: zoomOut,
        0: reset,
      };
      const action = keys[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    },
    [panBy, zoomIn, zoomOut, reset],
  );

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);
  const getZoom = useCallback(() => zoomRef.current, []);

  return useMemo(
    () => ({
      svgRef,
      subscribe,
      getZoom,
      zoomIn,
      zoomOut,
      reset,
      focusOn,
      afterTap,
      handlers: {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: endPointer,
        onKeyDown,
      },
    }),
    [svgRef, subscribe, getZoom, zoomIn, zoomOut, reset, focusOn, afterTap, onPointerDown, onPointerMove, onPointerUp, endPointer, onKeyDown],
  );
}

/**
 * The viewport's zoom (map width / view width), for what is drawn by zoom. Re-renders the
 * caller only when the zoom changes, or with `select` only when its result does
 * (e.g. `(zoom) => zoom >= 3`). A change made while the caller was being committed (the
 * first measurement, as the SVG is attached) is caught before the browser paints.
 */
export function useViewportZoom(viewport, select) {
  const getSnapshot = select ? () => select(viewport.getZoom()) : viewport.getZoom;
  const value = useSyncExternalStore(viewport.subscribe, getSnapshot, getSnapshot);
  const [, rerender] = useReducer((n) => n + 1, 0);
  useLayoutEffect(() => {
    if (getSnapshot() !== value) rerender();
  });
  return value;
}
