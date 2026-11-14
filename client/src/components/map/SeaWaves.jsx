import React, { useEffect, useRef } from 'react';

const WAVE_COUNT = 20;
const rand = (min, max) => Math.random() * (max - min) + min;

function makeWave(width, height) {
  return {
    x: rand(0, width),
    y: rand(0, height),
    amplitude: rand(2, 5),
    frequency: rand(0.05, 0.12),
    length: rand(50, 100),
    drift: rand(0.08, 0.25), // px per frame
    opacity: rand(0.2, 0.5),
    vertical: Math.random() > 0.5,
  };
}

// my_planet's AnimatedCanvas: short wavy lines drifting over the animated sea. Sized to
// its container (and the screen's pixel density); paused while the tab is hidden; not
// drawn at all for reduced motion. The colour is the --sea-wave token.
function SeaWaves() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!canvas || reduced.matches) return undefined;

    const ctx = canvas.getContext('2d');
    const colour = getComputedStyle(canvas).getPropertyValue('--sea-wave').trim() || 'white';
    let width = 0;
    let height = 0;
    let waves = [];
    let frame = 0;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      waves = Array.from({ length: WAVE_COUNT }, () => makeWave(width, height));
    };

    const draw = () => {
      t += 1;
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
        if (wave.vertical) wave.y = (wave.y + wave.drift) % (height + wave.length);
        else wave.x = (wave.x + wave.drift) % (width + wave.length);
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(frame) : start());

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden='true' className='pointer-events-none absolute inset-0 h-full w-full motion-reduce:hidden' />;
}

export default SeaWaves;
