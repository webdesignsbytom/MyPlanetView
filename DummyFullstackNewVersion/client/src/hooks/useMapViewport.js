import { useCallback, useEffect, useRef, useState } from 'react';
// Utils
import { MAP_HEIGHT, MAP_WIDTH } from '@/utils/map/projection';

const ASPECT = MAP_HEIGHT / MAP_WIDTH;
const MIN_WIDTH = 80; // the closest zoom: 25 times
const FULL = { x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT };
const DRAG_THRESHOLD_PX = 5;
// Where a portrait screen opens when the page gives no home point: Europe
const DEFAULT_HOME = { x: 1060, y: 200 };

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

// The view's shape (height / width). On a landscape screen it's the map's own, so the whole
// world fits. On a portrait one it's the screen's, so the map fills the height and the
// view is a slice of the world you pan across, instead of a thin strip mid-screen.
const viewAspectFor = (screenAspect) => (screenAspect > 1 ? screenAspect : ASPECT);

// Keep the view on the map: never wider or taller than the whole map, never panned off it
function fit({ x, y, w }, aspect = ASPECT) {
  const maxWidth = Math.min(MAP_WIDTH, MAP_HEIGHT / aspect);
  const width = clamp(w, Math.min(MIN_WIDTH, maxWidth), maxWidth);
  const height = width * aspect;
  return {
    x: clamp(x, 0, MAP_WIDTH - width),
    y: clamp(y, 0, MAP_HEIGHT - height),
    w: width,
    h: height,
  };
}

// The starting view: the whole map, or on a portrait screen the full height centred on home
function homeView(aspect, home) {
  if (aspect === ASPECT) return FULL;
  const w = MAP_HEIGHT / aspect;
  return fit({ x: home.x - w / 2, y: home.y - (w * aspect) / 2, w }, aspect);
}

/**
 * Pan and zoom for the SVG map, through its viewBox: drag with a mouse or one finger,
 * pinch with two, the wheel, the keyboard (arrows, + and -, 0 to reset) and buttons.
 * `wasDrag()` tells a click handler to ignore the click that ends a drag.
 * `home` ({ x, y } in map units) is where a portrait screen opens, e.g. the visited countries.
 */
export default function useMapViewport({ wheelZoom = true, home = DEFAULT_HOME } = {}) {
  const svgRef = useRef(null);
  const [view, setView] = useState(FULL);
  // The view as of the last render, for gestures that start from it
  const viewRef = useRef(FULL);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const draggedRef = useRef(false);
  // The view's shape, from the SVG's size on screen; and whether the user has moved it yet
  const [aspect, setAspect] = useState(ASPECT);
  const aspectRef = useRef(ASPECT);
  const movedRef = useRef(false);
  const homeX = home?.x ?? DEFAULT_HOME.x;
  const homeY = home?.y ?? DEFAULT_HOME.y;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const rect = svg.getBoundingClientRect();
      if (rect.width && rect.height) setAspect(viewAspectFor(rect.height / rect.width));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    measure();
    return () => observer.disconnect();
  }, []);

  // A new screen shape (or a new home before the user has moved) resets the view; once
  // they've panned or zoomed, a rotation keeps their place in the new shape
  useEffect(() => {
    aspectRef.current = aspect;
    if (!movedRef.current) setView(homeView(aspect, { x: homeX, y: homeY }));
    else setView((prev) => fit({ x: prev.x, y: prev.y, w: prev.w }, aspect));
  }, [aspect, homeX, homeY]);

  // Screen position -> map position, through the SVG's own transform
  const toMap = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM?.();
    if (!svg || !ctm) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(ctm.inverse());
  }, []);

  const zoomAround = useCallback((factor, centre) => {
    movedRef.current = true;
    setView((prev) => {
      const a = aspectRef.current;
      const at = centre || { x: prev.x + prev.w / 2, y: prev.y + prev.h / 2 };
      const w = clamp(prev.w / factor, MIN_WIDTH, Math.min(MAP_WIDTH, MAP_HEIGHT / a));
      const ratio = w / prev.w;
      return fit({ x: at.x - (at.x - prev.x) * ratio, y: at.y - (at.y - prev.y) * ratio, w }, a);
    });
  }, []);

  const zoomIn = useCallback(() => zoomAround(1.6), [zoomAround]);
  const zoomOut = useCallback(() => zoomAround(1 / 1.6), [zoomAround]);
  const reset = useCallback(() => {
    movedRef.current = false;
    setView(homeView(aspectRef.current, { x: homeX, y: homeY }));
  }, [homeX, homeY]);

  // Centre on a point at a given width (a country picked from the list)
  const focusOn = useCallback((x, y, width = 400) => {
    movedRef.current = true;
    const a = aspectRef.current;
    const w = clamp(width, MIN_WIDTH, MAP_WIDTH);
    setView(fit({ x: x - w / 2, y: y - (w * a) / 2, w }, a));
  }, []);

  const panBy = useCallback((dxFraction, dyFraction) => {
    movedRef.current = true;
    setView((prev) => fit({ x: prev.x + prev.w * dxFraction, y: prev.y + prev.h * dyFraction, w: prev.w }, aspectRef.current));
  }, []);

  // The wheel needs a non-passive listener to stop the page scrolling
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !wheelZoom) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const at = toMap(e.clientX, e.clientY);
      zoomAround(e.deltaY < 0 ? 1.15 : 1 / 1.15, at);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [toMap, zoomAround, wheelZoom]);

  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      draggedRef.current = false;
      const pointers = [...pointersRef.current.values()];
      if (pointers.length === 1) {
        gestureRef.current = { kind: 'pan', start: pointers[0], view: viewRef.current };
      } else if (pointers.length === 2) {
        const [a, b] = pointers;
        gestureRef.current = {
          kind: 'pinch',
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          centre: toMap((a.x + b.x) / 2, (a.y + b.y) / 2),
        };
      }
    },
    [toMap],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
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
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect?.width || !rect?.height) return;
        // Map units per screen pixel (the map is drawn "meet": the tighter side decides)
        const base = gesture.view;
        const scale = Math.max(base.w / rect.width, base.h / rect.height);
        setView(fit({ x: base.x - dx * scale, y: base.y - dy * scale, w: base.w }, aspectRef.current));
      } else if (gesture.kind === 'pinch' && pointers.length === 2) {
        const [a, b] = pointers;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (!gesture.distance || !gesture.centre) return;
        draggedRef.current = true;
        zoomAround(distance / gesture.distance, gesture.centre);
        gesture.distance = distance;
      }
    },
    [zoomAround],
  );

  const endPointer = useCallback((e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) gestureRef.current = null;
    else if (pointersRef.current.size === 1) {
      // One finger left after a pinch: carry on panning from here
      const [only] = [...pointersRef.current.values()];
      gestureRef.current = { kind: 'pan', start: only, view: viewRef.current };
    }
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

  const wasDrag = useCallback(() => draggedRef.current, []);

  return {
    svgRef,
    view,
    viewBox: `${view.x} ${view.y} ${view.w} ${view.h}`,
    zoom: MAP_WIDTH / view.w,
    zoomIn,
    zoomOut,
    reset,
    focusOn,
    wasDrag,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onKeyDown,
    },
  };
}
