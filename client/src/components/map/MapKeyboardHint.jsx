import React from 'react';

/**
 * How to move a map from the keyboard: the map SVG's description (its `aria-describedby`,
 * this `id`), and shown as a tag at the foot of the map while the map has the keyboard's
 * focus, reached by Tab: the map's focus indicator, as it has no ring (utils/map/
 * pointerFocus.js). Put it straight after the SVG, which carries `peer`, inside a
 * positioned box.
 */
function MapKeyboardHint({ id, children }) {
  return (
    <p
      id={id}
      className='pointer-events-none absolute bottom-6 left-1/2 z-10 w-max max-w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 paper-aged ticket-edge px-3 py-2 text-center text-sm text-poster-ink opacity-0 peer-[:focus-visible:not([data-pointer-focus])]:opacity-100'
    >
      {children}
    </p>
  );
}

export default MapKeyboardHint;
