// The order of photos in a gallery (Photo.countryPosition, Photo.tripPosition): smallest
// first. Positions are numbers with gaps, so moving a photo writes only its own row: it
// takes the halfway point between its new neighbours. When two neighbours are too close
// for a halfway point (after many moves into the same gap, or two photos saved at the
// same moment with the same position), the gallery is renumbered first.

// The gap between neighbours after a renumbering, and between a new first photo and the
// one it goes in front of
export const POSITION_STEP = 1024;

// The galleries a photo can be rearranged in: its country's on the map (the unplaced
// photos are the gallery with no country), and its trip's
export const PHOTO_GALLERIES = ['country', 'trip'];
export const POSITION_FIELD = { country: 'countryPosition', trip: 'tripPosition' };

/** A new first photo's position, given the gallery's current first (null when empty). */
export const positionFirst = (first) => (Number.isFinite(first) ? first - POSITION_STEP : 0);

/**
 * The position between two neighbours: `before` is the photo it now follows (null:
 * it goes first), `after` the one it now precedes (null: it goes last). Null when
 * there's no number strictly between them, so the gallery must be renumbered.
 */
export function positionBetween(before, after) {
  const hasBefore = Number.isFinite(before);
  const hasAfter = Number.isFinite(after);
  if (!hasBefore && !hasAfter) return 0;
  if (!hasBefore) return after - POSITION_STEP;
  if (!hasAfter) return before + POSITION_STEP;
  const middle = before + (after - before) / 2;
  return middle > before && middle < after ? middle : null;
}
