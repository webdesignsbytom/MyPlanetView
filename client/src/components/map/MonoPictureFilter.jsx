import React from 'react';

// Black and white (the map style `mono`): the SVG filter that turns the pictures drawn inside
// the map (the sea's depths, a country map's landmark models) grey, as `[data-mono-map] main
// image` in index.css asks. An SVG filter rather than CSS `grayscale()`, which not every
// browser applies to SVG elements; sRGB, as CSS's own greyscale is, so the greys match the
// rest of the page's. The id is the one index.css names.
function MonoPictureFilter() {
  return (
    <svg aria-hidden='true' focusable='false' className='pointer-events-none absolute h-0 w-0'>
      <filter id='mpv-mono-pictures' colorInterpolationFilters='sRGB'>
        <feColorMatrix type='saturate' values='0' />
      </filter>
    </svg>
  );
}

export default MonoPictureFilter;
