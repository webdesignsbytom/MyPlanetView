// A stand-in 2D canvas for the share card and poster tests (jsdom draws nothing): it keeps
// every call with the fill and stroke styles of the moment, measures text as half the font
// size per character, and draws a Path2D as the shape's own path text.
import { vi } from 'vitest';

export class FakePath2D {
  constructor(d) {
    this.d = d;
  }
}

const sizeOf = (font) => Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 10);

export function fakeContext(canvas = null) {
  const calls = [];
  const ctx = {
    canvas,
    calls,
    font: '10px sans-serif',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    letterSpacing: '0px',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineJoin: 'miter',
    imageSmoothingQuality: 'low',
    measureText: (text) => ({ width: String(text).length * sizeOf(ctx.font) * 0.5 }),
    getImageData: () => ({ data: [0, 0, 0, 255] }),
  };
  const record = (name) => (...args) => calls.push({ name, args, fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle, font: ctx.font });
  for (const name of ['save', 'restore', 'beginPath', 'rect', 'clip', 'fillRect', 'strokeRect', 'translate', 'rotate', 'scale', 'fill', 'stroke', 'arc', 'fillText', 'setLineDash', 'drawImage', 'moveTo', 'lineTo', 'closePath']) {
    ctx[name] = vi.fn(record(name));
  }
  return ctx;
}

/** The texts drawn, in order. */
export const textsDrawn = (ctx) => ctx.calls.filter((c) => c.name === 'fillText').map((c) => c.args[0]);

/** The fill style each of a place's shapes was filled with. */
export const fillsOf = (ctx, paths) => {
  const wanted = new Set(paths);
  return ctx.calls.filter((c) => c.name === 'fill' && c.args[0] && wanted.has(c.args[0].d)).map((c) => c.fillStyle);
};
