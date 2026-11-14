import React, { useId } from 'react';

// Where each corner sits, and how the top-left drawing turns to fit it
const PLACEMENT = {
  tl: 'left-0 top-0',
  tr: 'right-0 top-0 rotate-90',
  br: 'bottom-0 right-0 rotate-180',
  bl: 'bottom-0 left-0 -rotate-90',
};

// The domed rivets, kept inside the curved edge
const RIVETS = [
  [11, 11],
  [33, 6.5],
  [6.5, 33],
];

/**
 * A brass corner protector, like the ones on an old steamer trunk or photo album: a
 * curved inner edge, a polished gradient with a bevelled highlight, three rivets and a
 * soft shadow. Drawn for the top-left and rotated into the other corners. Decorative.
 * Sits inside a `relative` parent, over the navbar (z-60 against the navbar's z-50);
 * from md up the navbar stops short of them.
 */
function BrassCorner({ position = 'tl' }) {
  const id = useId();
  const body = `${id}-body`;
  const rivet = `${id}-rivet`;
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 64 64'
      className={`pointer-events-none absolute z-[60] h-12 w-12 drop-shadow-md sm:h-16 sm:w-16 ${PLACEMENT[position]}`}
    >
      <defs>
        <linearGradient id={body} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' style={{ stopColor: 'var(--brass-light)' }} />
          <stop offset='0.45' style={{ stopColor: 'var(--brass-mid)' }} />
          <stop offset='1' style={{ stopColor: 'var(--brass-dark)' }} />
        </linearGradient>
        <radialGradient id={rivet} cx='0.35' cy='0.35' r='0.7'>
          <stop offset='0' style={{ stopColor: 'var(--brass-rivet)' }} />
          <stop offset='0.55' style={{ stopColor: 'var(--brass-mid)' }} />
          <stop offset='1' style={{ stopColor: 'var(--brass-edge)' }} />
        </radialGradient>
      </defs>
      {/* The plate: square outer corner (slightly rounded), concave inner edge */}
      <path
        d='M4 0 H63 Q24 24 0 63 V4 Q0 0 4 0 Z'
        fill={`url(#${body})`}
        strokeWidth='1.5'
        strokeLinejoin='round'
        style={{ stroke: 'var(--brass-edge)' }}
      />
      {/* The bevel catching the light, just inside the curved edge */}
      <path d='M55 3.5 Q22 22 3.5 55' fill='none' strokeWidth='1.4' strokeLinecap='round' style={{ stroke: 'var(--brass-light)' }} />
      {RIVETS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r='2.8' fill={`url(#${rivet})`} strokeWidth='0.6' style={{ stroke: 'var(--brass-edge)' }} />
      ))}
    </svg>
  );
}

export default BrassCorner;
