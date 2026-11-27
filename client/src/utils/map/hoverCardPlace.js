// Where a long press's postcard goes (HoverPreview, on a touch screen). Kept clear of the
// screen's top and bottom edges by MARGIN, and of the fingertip by FINGER.
export const MARGIN = 8;
export const FINGER = 36;
// The smallest the card is drawn when it fits neither above nor below the finger
export const MIN_SCALE = 0.5;

/**
 * A finger's card (27 Nov 2026, the user's report: on phones it ran off the bottom of the
 * screen): above the finger, or below it when there's no room above; when it fits on neither
 * side (a poster card is about 430 px tall, and a phone's screen 700 to 900), drawn smaller on
 * the side with more room, down to MIN_SCALE, and always on the screen. `y` is the finger's,
 * `height` the card's own and `screenHeight` the window's, in CSS pixels.
 * -> `{ top, scale }`: the card's top, and how much it's shrunk (from its top's middle).
 */
export function fingerPlace(y, height, screenHeight) {
  const above = y - FINGER - MARGIN;
  const below = screenHeight - MARGIN - (y + FINGER);
  if (height <= above) return { top: y - FINGER - height, scale: 1 };
  if (height <= below) return { top: y + FINGER, scale: 1 };
  const room = Math.max(above, below);
  const scale = Math.min(1, Math.max(MIN_SCALE, room / height));
  const shown = height * scale;
  const top = above >= below ? y - FINGER - shown : y + FINGER;
  return { top: Math.max(MARGIN, Math.min(top, screenHeight - MARGIN - shown)), scale };
}
