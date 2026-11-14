import React from 'react';
// Components
import BrassCorner from './BrassCorner';

const POSITIONS = ['tl', 'tr', 'bl', 'br'];

// The red poster frame's four brass corners. Put it inside the frame's `relative` element.
function BrassCorners() {
  return POSITIONS.map((position) => <BrassCorner key={position} position={position} />);
}

export default BrassCorners;
