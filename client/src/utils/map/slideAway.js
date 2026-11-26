// The map's menus slid out of the way (25 Nov 2026, the user's wish: a tab on the toolbar hides
// every menu on the screen, each moving off by its closest exit; components/map/chrome/).

/**
 * How far a box (`rect`, as getBoundingClientRect gives it) must move to leave a view of
 * `view.width` × `view.height` by its nearest side, then `margin` past it (room for its
 * shadow): `{ side, distance, x, y }`, `x` and `y` the move in pixels. `toward` forces a side
 * ('left', 'right', 'top' or 'bottom'). On a tie the first of left, right, top, bottom wins.
 */
export function exitOffset(rect, view, { margin = 24, toward = null } = {}) {
  const exits = {
    left: { side: 'left', distance: rect.right, x: -(rect.right + margin), y: 0 },
    right: { side: 'right', distance: view.width - rect.left, x: view.width - rect.left + margin, y: 0 },
    top: { side: 'top', distance: rect.bottom, x: 0, y: -(rect.bottom + margin) },
    bottom: { side: 'bottom', distance: view.height - rect.top, x: 0, y: view.height - rect.top + margin },
  };
  if (toward && exits[toward]) return exits[toward];
  return Object.values(exits).reduce((best, exit) => (exit.distance < best.distance ? exit : best));
}
