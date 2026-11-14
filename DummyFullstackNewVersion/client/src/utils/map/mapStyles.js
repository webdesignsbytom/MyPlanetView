// The map's four looks, from the old site. Each sets data-map-style on the map page,
// which switches the --map-* tokens in styles/index.css. `background` is an image set
// in src/assets/images/map-styles/ (null: the animated sea).
export const MAP_STYLES = [
  { id: 'animated', label: 'Animated sea', background: null },
  { id: 'old-map', label: 'Old map', background: 'old-map' },
  { id: 'jupiter', label: 'Jupiter clouds', background: 'jupiter' },
  { id: 'galaxy', label: 'Galaxy', background: 'galaxy' },
];

export const MAP_STYLE_IDS = MAP_STYLES.map((style) => style.id);

export const mapStyleById = (id) => MAP_STYLES.find((style) => style.id === id) || MAP_STYLES[0];
