// Where a finger is holding a country down (a long press on a touch screen: CountryLayer),
// for the hover postcard (HoverPreview), which a mouse moves with its own pointer events but
// a finger held still never does. Taken once: a later mouse hover starts from its own pointer.
let point = null;

/** `{ x, y }` in screen pixels, where the finger is. */
export function setHoverPoint(at) {
  point = at;
}

/** The finger's point, if one is waiting, then forgotten. */
export function takeHoverPoint() {
  const at = point;
  point = null;
  return at;
}
