import React from 'react';

// The small temple a stamp carries when its landmark is a UNESCO World Heritage Site
// (a plain pictogram, not UNESCO's emblem), centred on x, y, in the stamp's ink.
function UnescoMark({ x, y }) {
  return (
    <g transform={`translate(${x - 7} ${y - 6})`} fill='currentColor'>
      <path d='M7 0 L14 3.6 H0 Z' />
      <rect x='1' y='4.2' width='12' height='1.2' />
      <rect x='2' y='5.8' width='1.8' height='4.2' />
      <rect x='6.1' y='5.8' width='1.8' height='4.2' />
      <rect x='10.2' y='5.8' width='1.8' height='4.2' />
      <rect x='0.4' y='10.4' width='13.2' height='1.6' />
    </g>
  );
}

export default UnescoMark;
