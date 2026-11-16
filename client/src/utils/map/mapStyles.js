// The map's looks, from the old site. Each sets data-map-style on the map page, which
// switches the --map-* tokens in styles/index.css. `background` is an image set in
// src/assets/images/map-styles/ (null: the animated sea). Jupiter clouds and Galaxy were
// taken out on 16 Nov 2026 (the user's wish); a saved one opens as the animated sea
// (cleanMapSettings falls back to the first).
export const MAP_STYLES = [
  { id: 'animated', label: 'Animated sea', background: null },
  { id: 'old-map', label: 'Old map', background: 'old-map' },
];

export const MAP_STYLE_IDS = MAP_STYLES.map((style) => style.id);

export const mapStyleById = (id) => MAP_STYLES.find((style) => style.id === id) || MAP_STYLES[0];
