// The celebration screen (components/map/celebration/CelebrationDialog.jsx; 24 Nov 2026, the
// user's wish): stars, the place's little 3D model and its passport stamp, when a landmark is
// newly stamped in the map's passport (ticked "been here", or a photo's match confirmed) or a
// country is newly marked visited or lived in from its ticket. The viewer's setting
// `showCelebrations` (on unless turned off; the screen's box turns it off) says whether it shows.
import { countsAsVisited } from './visitStatus';

/** A country's status change worth celebrating: into visited or lived in, from neither. */
export const celebratesVisit = (before, after) => countsAsVisited(after) && !countsAsVisited(before);

/** A landmark worth celebrating: one the passport hadn't stamped yet (by a photo or a tick). */
export const celebratesStamp = (landmarkId, stamped) => Boolean(landmarkId) && !stamped?.has(landmarkId);

/** Today as YYYY-MM-DD in the viewer's own time zone: the day a tick stamps. */
export const todayDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// The words over the name
export const CELEBRATION_KICKERS = { landmark: 'Been here!', VISITED: 'Visited!', LIVED: 'Lived here!', seen: 'Seen it!', done: 'Done it!' };

// A small string hash (FNV-1a): the stars are the same each time for the same place
function hashOf(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// The stars' inks, in turn (the poster's gold, cream, red and orange)
export const STAR_INKS = ['text-poster-gold-light', 'text-poster-cream', 'text-poster-red', 'text-poster-orange'];

/**
 * The stars that burst out from behind the picture: `count` of them evenly round the circle,
 * each nudged off its line, flying `distance` (rem) out with its own size (rem), spin, delay
 * (ms) and ink, worked out from `seed` (never Math.random, so the same place bursts the same
 * way). `x` and `y` are where each one ends up from the middle.
 */
export function burstStars(seed, count = 18) {
  let state = hashOf(seed) || 1;
  // A little generator (xorshift), so each star's numbers differ
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, (_, index) => {
    const angle = ((index + next() * 0.6 - 0.3) / count) * Math.PI * 2;
    const distance = 7 + next() * 7;
    return {
      id: index,
      x: Math.round(Math.cos(angle) * distance * 100) / 100,
      y: Math.round(Math.sin(angle) * distance * 100) / 100,
      size: Math.round((0.7 + next() * 1.1) * 100) / 100,
      spin: Math.round(next() * 360 - 180),
      delay: Math.round(next() * 260),
      ink: STAR_INKS[index % STAR_INKS.length],
    };
  });
}
