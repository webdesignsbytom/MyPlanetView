import React, { useEffect, useRef } from 'react';

const WAVE_COUNT = 20;
// The canvas covers the whole screen, so its pixel count is what costs. The soft 1.5 px
// lines look the same drawn at 1.5× and scaled up by the compositor, at a quarter of a
// 3× phone's pixels.
const MAX_DENSITY = 1.5;
// About 30 drawings a second. The speeds below are per 60 fps frame, as in my_planet, and
// each drawing moves the waves by the frames that have passed, so the pace stays the same.
const FRAME_MS = 1000 / 30;
const BASE_FRAME_MS = 1000 / 60;
// After a pause, start again from where the waves were rather than jumping ahead
const MAX_STEP = 4;
// The wheel sends no "gesture over" event: resume this long after the last one
const WHEEL_IDLE_MS = 200;
const rand = (min, max) => Math.random() * (max - min) + min;

function makeWave(width, height) {
  return {
    x: rand(0, width),
    y: rand(0, height),
    amplitude: rand(2, 5),
    frequency: rand(0.05, 0.12),
    length: rand(50, 100),
    drift: rand(0.08, 0.25), // px per 60 fps frame
    opacity: rand(0.2, 0.5),
    vertical: Math.random() > 0.5,
  };
}

// my_planet's AnimatedCanvas: short wavy lines drifting over the animated sea. Sized to
// its container, at most 1.5× the screen's density; drawn about 30 times a second; paused
// while the tab is hidden and while a finger, mouse button or the wheel is moving the map
// (so panning and pinching get the whole frame); not drawn at all for reduced motion.
// The colour is the --sea-wave token.
function SeaWaves() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!canvas || reduced.matches) return undefined;

    const ctx = canvas.getContext('2d');
    const colour = getComputedStyle(canvas).getPropertyValue('--sea-wave').trim() || 'white';
    // The map page's wrapper: the map's pointer and wheel events pass through it
    const host = canvas.parentElement || document;
    const pointers = new Set();
    let wheeling = false;
    let width = 0;
    let height = 0;
    let waves = [];
    let frame = 0;
    let timer = 0;
    let wheelTimer = 0;
    let last = 0;
    let t = 0;

    const running = () => !document.hidden && pointers.size === 0 && !wheeling;

    const draw = (step) => {
      t += step;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1.5;
      for (const wave of waves) {
        ctx.globalAlpha = wave.opacity;
        ctx.beginPath();
        for (let i = 0; i < wave.length; i += 2) {
          const swell = Math.sin(i * wave.frequency + t * 0.03) * wave.amplitude;
          const px = wave.vertical ? wave.x + swell : wave.x + i;
          const py = wave.vertical ? wave.y + i : wave.y + swell;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // Drift, and come back in on the far side
        if (wave.vertical) wave.y = (wave.y + wave.drift * step) % (height + wave.length);
        else wave.x = (wave.x + wave.drift * step) % (width + wave.length);
      }
      ctx.globalAlpha = 1;
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      frame = 0;
      timer = 0;
    };

    // Draw on an animation frame, then wait out about half the interval with a timer, so no
    // frames are requested between drawings; a frame that comes too soon asks for the next.
    const tick = (now) => {
      frame = 0;
      if (!running()) return;
      if (last && now - last < FRAME_MS - 2) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const step = last ? Math.min((now - last) / BASE_FRAME_MS, MAX_STEP) : 1;
      last = now;
      draw(step);
      timer = setTimeout(() => {
        timer = 0;
        if (running()) frame = requestAnimationFrame(tick);
      }, FRAME_MS / 2);
    };

    const start = () => {
      stop();
      last = 0;
      if (running()) frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DENSITY);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      waves = Array.from({ length: WAVE_COUNT }, () => makeWave(width, height));
      // Resizing clears the canvas: show the waves straight away, even while paused
      draw(0);
    };

    // Gestures on the map: hold still until the last finger or button is let go
    const onPointerDown = (e) => {
      pointers.add(e.pointerId);
      stop();
    };
    const onPointerUp = (e) => {
      if (pointers.delete(e.pointerId) && pointers.size === 0) start();
    };
    // A mouse button let go outside the window never sends its pointerup
    const onPointerMove = (e) => {
      if (pointers.size && e.pointerType === 'mouse' && e.buttons === 0) {
        pointers.clear();
        start();
      }
    };
    const onWheel = () => {
      wheeling = true;
      stop();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheeling = false;
        start();
      }, WHEEL_IDLE_MS);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    start();
    const listen = { capture: true, passive: true };
    host.addEventListener('pointerdown', onPointerDown, listen);
    host.addEventListener('wheel', onWheel, listen);
    window.addEventListener('pointerup', onPointerUp, listen);
    window.addEventListener('pointercancel', onPointerUp, listen);
    window.addEventListener('pointermove', onPointerMove, listen);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      clearTimeout(wheelTimer);
      observer.disconnect();
      host.removeEventListener('pointerdown', onPointerDown, listen);
      host.removeEventListener('wheel', onWheel, listen);
      window.removeEventListener('pointerup', onPointerUp, listen);
      window.removeEventListener('pointercancel', onPointerUp, listen);
      window.removeEventListener('pointermove', onPointerMove, listen);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden='true' className='pointer-events-none absolute inset-0 h-full w-full motion-reduce:hidden' />;
}

export default SeaWaves;
