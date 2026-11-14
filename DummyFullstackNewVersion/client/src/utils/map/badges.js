// The visited star badges (components/map/StarBadge.jsx, VisitBadges.jsx).

// <symbol> ids inside the map's <svg>
export const BADGE_IDS = { VISITED: 'mpv-badge-visited', LIVED: 'mpv-badge-lived' };

// The badge's radius in map units: a little bigger on screen as you zoom in, but never
// so big that Europe disappears under stars at world view.
export const badgeRadius = (zoom) => 9 / Math.sqrt(zoom);
