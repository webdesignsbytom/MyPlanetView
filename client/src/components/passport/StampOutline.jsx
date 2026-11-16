import React, { createElement } from 'react';
// Utils
import { STAMP_GEOMETRY } from '@/utils/passport/stampShapes';
import { stampLook } from '@/utils/passport/passportBook';

/**
 * The dotted outline of a stamp still to collect: the shape the landmark's stamp will have,
 * small, dotted and un-inked. Decorative (the landmark's name is beside it).
 */
function StampOutline({ landmarkId }) {
  const { shape, tilt } = stampLook(landmarkId);
  const { width, height, outer } = STAMP_GEOMETRY[shape];
  const { tag, ...attrs } = outer;
  return (
    <svg
      viewBox={`-6 -6 ${width + 12} ${height + 12}`}
      aria-hidden='true'
      focusable='false'
      className='block h-5 w-5 overflow-visible text-colour9'
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {createElement(tag, { ...attrs, fill: 'none', stroke: 'currentColor', strokeWidth: 14, strokeDasharray: '2 22', strokeLinecap: 'round', strokeLinejoin: 'round' })}
    </svg>
  );
}

export default StampOutline;
