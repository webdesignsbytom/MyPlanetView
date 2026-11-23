import React from 'react';

/**
 * One little 3D landmark model (utils/map/landmarkModels.js) on the celebration screen, its
 * 320 px picture (the 160 px one where it's drawn small), at `height` rem tall. Decorative:
 * the screen names the landmark. `data-celebration-model` carries its id for the tests.
 */
function LandmarkModelImage({ model, height, className = '' }) {
  const src = height <= 4 ? model.images[160] : model.images[320];
  const pixels = height <= 4 ? 160 : 320;
  return (
    <img
      src={src}
      alt=''
      width={Math.round(pixels * model.aspect)}
      height={pixels}
      decoding='async'
      draggable='false'
      data-celebration-model={model.id}
      className={`block w-auto max-w-none select-none ${className}`}
      style={{ height: `${height}rem` }}
    />
  );
}

export default LandmarkModelImage;
