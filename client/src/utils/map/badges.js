// The visit badges (components/map/StarBadge.jsx, VisitBadges.jsx): the star sticker on
// countries, the gold expedition stamp on special places (Antarctica and the poles).
import { isSpecialPlace } from './specialPlaces.js';

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

// A pole's compass rose (components/map/PoleMarker.jsx): its points are thin, so it's
// drawn a little bigger than a badge to read as clearly
export const poleMarkerRadius = (zoom) => 11 / Math.sqrt(zoom);
