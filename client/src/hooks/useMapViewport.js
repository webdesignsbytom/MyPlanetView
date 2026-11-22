import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useSyncExternalStore } from 'react';
// Utils
import { MAP_HOME_BOTTOM, MAP_WIDTH, REFERENCE_PX_PER_UNIT, mapExtent } from '@/utils/map/projection';

// The zoom is how big the map is on screen, in pixels per map unit, not how much of it
// shows: 1 is the whole map's width across a 1920-pixel screen, the scale the badges, names
// and pins were tuned at. (It was the share of the map's width on show, so a phone, which
// shows a narrow strip of the map at the same size, counted as zoomed in five times and
// drew every landmark pin and the smallest badges, 16 Nov 2026.) The closest zoom is
// MAX_ZOOM on every screen, unless the caller gives its own (`maxZoom`: a country's own map
// has its own); MIN_WIDTH is that view's width before the screen is measured. 64 is two of
// the zoom stamps' steps (×1.6) past the old 25 (22 Nov 2026, the user's wish).
const MAX_ZOOM = 64;
const MIN_WIDTH = MAP_WIDTH / MAX_ZOOM;
const closestWidthFor = (screenPx, maxZoom) => (screenPx ? screenPx / (maxZoom * REFERENCE_PX_PER_UNIT) : MAP_WIDTH / maxZoom);
const zoomFor = (viewWidth, screenPx) => (screenPx ? screenPx / viewWidth / REFERENCE_PX_PER_UNIT : MAP_WIDTH / viewWidth);
const FULL_EXTENT = mapExtent(true);
const DRAG_THRESHOLD_PX = 5;
// Double-tap (or double-click) zooms in on the spot: two taps this close in time and space
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;
const DOUBLE_TAP_ZOOM = 2;

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

// The map's extent ({ top, bottom }: pole line to pole line with Antarctica, to 857
// without; projection.js mapExtent), and the frame a screen opens on: from the North Pole
// line to where the countries end, the map's old frame (plus that strip at the top), so
// Antarctica doesn't make the world smaller
const heightOf = (extent) => extent.bottom - extent.top;
const homeFrameHeight = (extent) => Math.min(extent.bottom, MAP_HOME_BOTTOM) - extent.top;

// The view always has the screen's shape (height / width), so what it shows is exactly
// what's on screen. Before the screen is measured: the home frame's.
const viewAspectFor = (screenAspect, extent) => screenAspect || homeFrameHeight(extent) / MAP_WIDTH;

// How far out the view can zoom: until it reaches the map's sides or its pole lines,
// whichever comes first, so the map always fills the screen and no sea shows beyond it
// (16 Nov 2026: on a less wide screen the map fills the height, the sides a pan away).
const widestFor = (aspect, extent) => Math.min(MAP_WIDTH, heightOf(extent) / aspect);

// Along one axis: a view is kept on the map (one exactly the map's size starts at its edge)
const place = (start, size, min, max) => (size >= max - min ? min - (size - (max - min)) / 2 : clamp(start, min, max - size));

// Keep the view on the map: never past its sides or pole lines, never zoomed out further
function fit({ x, y, w }, aspect, extent, closest = MIN_WIDTH) {
  const widest = widestFor(aspect, extent);
  const width = clamp(w, Math.min(closest, widest), widest);
  const height = width * aspect;
  return {
    x: place(x, width, 0, MAP_WIDTH),
    y: place(y, height, extent.top, extent.bottom),
    w: width,
    h: height,
  };
}

// The starting view, with the North Pole at the top (`aspect` is height / width). A
// portrait screen: as far out as the map allows, pole line to pole line (Antarctica in
// view when shown), centred (16 Nov 2026, the user's wish: phones open fully zoomed out;
// 17 Nov: centred on the map, no longer on the visited countries, which opened it over the
// Americas). A landscape
// one: the home frame across the whole width, at the scale the map always had (Antarctica
// below it), unless that would show sea beyond the map: then as far out as the map
// allows, centred (a less wide screen fills its height).
function homeView(aspect, extent, closest = MIN_WIDTH) {
  if (aspect > 1) {
    const w = widestFor(aspect, extent);
    return fit({ x: (MAP_WIDTH - w) / 2, y: extent.top, w }, aspect, extent, closest);
  }
  const w = Math.min(Math.max(MAP_WIDTH, homeFrameHeight(extent) / aspect), widestFor(aspect, extent));
  return fit({ x: (MAP_WIDTH - w) / 2, y: extent.top, w }, aspect, extent, closest);
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
 * `extent` ({ top, bottom } in map units, from projection.js mapExtent) is how far the map
 * reaches: further down with Antarctica. A new extent re-fits the view before the next
 * paint (the opening view again, unless the user has moved it).
 * `maxZoom` is the closest zoom allowed (screen scale, as above; MAX_ZOOM by default).
 * The returned object never changes, so it can be passed to memoised components.
 */
export default function useMapViewport({ wheelZoom = true, extent = FULL_EXTENT, maxZoom = MAX_ZOOM } = {}) {
  const svgNodeRef = useRef(null);
  const extentRef = useRef({ top: extent.top, bottom: extent.bottom });
  // The live view, and the zoom the subscribers last saw
  const viewRef = useRef(homeView(viewAspectFor(0, extentRef.current), extentRef.current));
  const zoomRef = useRef(1);
  const listenersRef = useRef(new Set());
  // Told of every change of view, a pan too (the detailed outlines: useDetailedShapes)
  const viewListenersRef = useRef(new Set());
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
  const aspectRef = useRef(viewAspectFor(0, extentRef.current));
  const screenAspectRef = useRef(0);
  // The SVG's width on screen (CSS pixels), which turns the view into a zoom, and the
  // closest view that allows
  const screenWidthRef = useRef(0);
  const closestRef = useRef(closestWidthFor(0, maxZoom));
  const movedRef = useRef(false);

  useEffect(() => () => clearTimeout(pendingTapRef.current), []);

  // The live view onto the SVG, and the zoom to its subscribers, together (so the badges
  // never lag the map by a frame)
  const flush = useCallback(() => {
    pendingRef.current = false;
    const view = viewRef.current;
    svgNodeRef.current?.setAttribute('viewBox', viewBoxOf(view));
    viewListenersRef.current.forEach((listener) => listener());
    const zoom = zoomFor(view.w, screenWidthRef.current);
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
      const resized = rect.width !== screenWidthRef.current;
      screenWidthRef.current = rect.width;
      closestRef.current = closestWidthFor(rect.width, maxZoom);
      screenAspectRef.current = rect.height / rect.width;
      const extent = extentRef.current;
      const aspect = viewAspectFor(screenAspectRef.current, extent);
      if (aspect === aspectRef.current && !first) {
        // The same shape at another size: the same view, at a new zoom
        if (resized) apply(fit(viewRef.current, aspect, extent, closestRef.current));
        return;
      }
      aspectRef.current = aspect;
      const prev = viewRef.current;
      apply(movedRef.current ? fit(prev, aspect, extent, closestRef.current) : homeView(aspect, extent, closestRef.current), first);
    },
    [apply, maxZoom],
  );

  // The SVG gets its viewBox from here, never from a React prop. Measured as it's attached,
  // before the first paint, so a portrait screen never shows the whole world first (the
  // zoom subscribers catch up in their own layout effects; see useViewportZoom).
  // The size watcher and the wheel listener go on the <svg> itself, here, and come off it in
  // this ref's clean-up (React 19): a new <svg> (the world map back after a country's own map)
  // gets its own. Effects run once had kept them on the first, detached one, so the wheel
  // did nothing and a resize was never measured (19 Nov 2026, the audit).
  const wheelRef = useRef(null);
  const svgRef = useCallback(
    (node) => {
      svgNodeRef.current = node;
      if (!node) return undefined;
      node.setAttribute('viewBox', viewBoxOf(viewRef.current));
      measure(true);
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure());
      observer?.observe(node);
      // Non-passive, so it can stop the page scrolling; only where the wheel zooms
      const onWheel = (e) => wheelRef.current?.(e);
      if (wheelZoom) node.addEventListener('wheel', onWheel, { passive: false });
      return () => {
        observer?.disconnect();
        node.removeEventListener('wheel', onWheel);
        if (svgNodeRef.current === node) svgNodeRef.current = null;
      };
    },
    [measure, wheelZoom],
  );

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
    apply(movedRef.current ? fit(viewRef.current, aspect, next, closestRef.current) : homeView(aspect, next, closestRef.current), true);
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
      const w = clamp(prev.w / factor, closestRef.current, widestFor(a, extent));
      const ratio = w / prev.w;
      apply(fit({ x: at.x - (at.x - prev.x) * ratio, y: at.y - (at.y - prev.y) * ratio, w }, a, extent, closestRef.current));
    },
    [apply],
  );

  const zoomIn = useCallback(() => zoomAround(1.6), [zoomAround]);
  const zoomOut = useCallback(() => zoomAround(1 / 1.6), [zoomAround]);
  const reset = useCallback(() => {
    movedRef.current = false;
    apply(homeView(aspectRef.current, extentRef.current, closestRef.current));
  }, [apply]);

  // Centre on a point at a given width (a country picked from the list)
  const focusOn = useCallback(
    (x, y, width = 400) => {
      movedRef.current = true;
      const a = aspectRef.current;
      const w = clamp(width, closestRef.current, MAP_WIDTH);
      apply(fit({ x: x - w / 2, y: y - (w * a) / 2, w }, a, extentRef.current, closestRef.current));
    },
    [apply],
  );

  const panBy = useCallback(
    (dxFraction, dyFraction) => {
      movedRef.current = true;
      const prev = viewRef.current;
      apply(
        fit({ x: prev.x + prev.w * dxFraction, y: prev.y + prev.h * dyFraction, w: prev.w }, aspectRef.current, extentRef.current, closestRef.current),
      );
    },
    [apply],
  );

  // What a wheel tick does (the listener itself is attached in svgRef)
  useEffect(() => {
    wheelRef.current = (e) => {
      e.preventDefault();
      const at = toMap(e.clientX, e.clientY);
      zoomAround(e.deltaY < 0 ? 1.15 : 1 / 1.15, at);
    };
  }, [toMap, zoomAround]);

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
        apply(fit({ x: base.x - dx * scale, y: base.y - dy * scale, w: base.w }, aspectRef.current, extentRef.current, closestRef.current));
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
  // Every change of view (pans too), and the view itself ({ x, y, w, h } in map units)
  const subscribeView = useCallback((listener) => {
    viewListenersRef.current.add(listener);
    return () => viewListenersRef.current.delete(listener);
  }, []);
  const getView = useCallback(() => viewRef.current, []);

  return useMemo(
    () => ({
      svgRef,
      subscribe,
      getZoom,
      subscribeView,
      getView,
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
    [svgRef, subscribe, getZoom, subscribeView, getView, zoomIn, zoomOut, reset, focusOn, afterTap, onPointerDown, onPointerMove, onPointerUp, endPointer, onKeyDown],
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
