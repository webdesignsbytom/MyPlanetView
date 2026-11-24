import React from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

// The tab's outline, 20 × 64, as a browser's tab turned on its side (25 Nov 2026, the user's
// wish: "a tab design with rounded edges but symmetrical"): it flares out of the toolbar's edge
// (the right-hand side), its sides slope in to a rounded, flat outer edge, the same top and
// bottom. EDGE is the outline in the toolbar's edge colour; PAPER, 1.5px inside it, the paper.
const TAB_EDGE = 'M20 0C20 4 17 6 15 7L4 14C1.5 15.5 0 18 0 21L0 43C0 46 1.5 48.5 4 50L15 57C17 58 20 60 20 64Z';
const TAB_PAPER =
  'M20 1.5C20 5 17 7.2 15.6 8.3L4.8 15.2C2.6 16.6 1.5 18.8 1.5 21.6L1.5 42.4C1.5 45.2 2.6 47.4 4.8 48.8L15.6 55.7C17 56.8 20 59 20 62.5Z';

/**
 * The tab on the toolbar's left edge, half way down (25 Nov 2026, the user's wish): it hides
 * every menu on the map page, each sliding off by its closest side, and brings them back. It's
 * placed in the toolbar's wrapper, which slides right by the toolbar's own width, so the tab
 * stays on the screen's right edge, its arrow turned round. Wide screens only (phones have the
 * Menu stamp instead of the column). `hidden`: whether the menus are away; `onToggle()`.
 * Drawn in the toolbar's own paper and edge, so it always matches the map's style (25 Nov 2026,
 * the user's report): the shape is cut with clip-path, never an SVG, as the map's styles give
 * every SVG the poster's colours back (index.css, `:root[data-map-theme] svg`).
 */
function MenusTab({ hidden, onToggle }) {
  const label = hidden ? 'Show the menus' : 'Hide the menus';
  return (
    <button
      type='button'
      onClick={onToggle}
      aria-label={label}
      title={label}
      aria-pressed={hidden}
      data-menus-tab={hidden ? 'hidden' : 'shown'}
      // Over the toolbar's edge by a hair, so it reads as part of it
      className='group pointer-events-auto absolute right-[calc(100%-2px)] top-1/2 hidden h-16 w-5 -translate-y-1/2 place-items-center text-poster-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-colour6 nophone:grid'
    >
      <span aria-hidden='true' data-tab-edge='' className='absolute inset-0 bg-poster-brown' style={{ clipPath: `path('${TAB_EDGE}')` }} />
      <span
        aria-hidden='true'
        data-tab-paper=''
        className='paper-aged-side absolute inset-0 transition group-hover:brightness-105'
        style={{ clipPath: `path('${TAB_PAPER}')` }}
      />
      {hidden ? (
        <IoChevronBack aria-hidden='true' className='relative h-3 w-3' />
      ) : (
        <IoChevronForward aria-hidden='true' className='relative h-3 w-3' />
      )}
    </button>
  );
}

export default MenusTab;
