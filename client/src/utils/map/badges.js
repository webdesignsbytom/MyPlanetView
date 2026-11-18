// The visit badges (components/map/StarBadge.jsx, VisitBadges.jsx): the star sticker on
// countries, the gold expedition stamp on special places (Antarctica and the poles).
import { isSpecialPlace } from './specialPlaces.js';
import { isRegion } from './regionPlaces.js';

// <symbol> ids inside the map's <svg>
export const BADGE_IDS = {
  VISITED: 'mpv-badge-visited',
  LIVED: 'mpv-badge-lived',
  EXPEDITION_VISITED: 'mpv-badge-expedition',
  EXPEDITION_LIVED: 'mpv-badge-expedition-lived',
};

/** The badge's symbol id for a place and its status, or null (not visited or lived). */
export function badgeIdFor(code, status) {
  if (status !== 'VISITED' && status !== 'LIVED') return null;
  if (isSpecialPlace(code)) return status === 'LIVED' ? BADGE_IDS.EXPEDITION_LIVED : BADGE_IDS.EXPEDITION_VISITED;
  return status === 'LIVED' ? BADGE_IDS.LIVED : BADGE_IDS.VISITED;
}

// The badge's radius in map units: a little bigger on screen as you zoom in, but never
// so big that Europe disappears under stars at world view.
export const badgeRadius = (zoom) => 9 / Math.sqrt(zoom);
// A region's (Bali, Tasmania) is smaller: it's a place inside a country, often beside its star
export const badgeRadiusFor = (code, zoom) => badgeRadius(zoom) * (isRegion(code) ? 0.75 : 1);

// A pole's compass rose (components/map/PoleMarker.jsx): its points are thin, so it's
// drawn a little bigger than a badge to read as clearly
export const poleMarkerRadius = (zoom) => 11 / Math.sqrt(zoom);

// The mark beside a country with moments (components/map/MomentMark.jsx, MomentMarks.jsx):
// its <symbol> id, and where it sits: up and to the right of the badge's centre, a little
// over its edge, a little smaller than the badge
export const MOMENT_MARK_ID = 'mpv-moment-mark';
export const momentMarkPlace = (pinX, pinY, zoom) => {
  const r = badgeRadius(zoom);
  const height = r * 1.35;
  return { x: pinX + r * 0.45, y: pinY - r * 1.25, width: height * (16 / 18), height };
};
