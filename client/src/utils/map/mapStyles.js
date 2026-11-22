// The map's looks, from the old site. Each sets data-map-style on the map page, which
// switches the --map-* tokens in styles/index.css. `background` is an image set in
// src/assets/images/map-styles/ (null: the animated sea). Jupiter clouds and Galaxy were
// taken out on 16 Nov 2026 (the user's wish); a saved one opens as the animated sea
// (cleanMapSettings falls back to the first). The starry night (19 Nov 2026, the user's
// wish, after a travel brand's world map on deep space): every country the same pale blue,
// a little see-through, on a night sky that stays still while the map pans. The first is
// the standard world map (its sea animated when the viewer's setting says so: 'World map',
// 19 Nov 2026, the user's wish, was 'Animated sea'), and Black and white is that map in
// greys, every feature the same (19 Nov 2026, the user's wish: a style, not a switch).
// `preview` is the picture on a style's card in Settings when it isn't its background: the
// World map's is the Regular map type's screenshot, and Black and white's the same in greys
// (`previewGrey`; 22 Nov 2026, the user's wish: they were plain blocks of sea).
export const MAP_STYLES = [
  { id: 'animated', label: 'World map', background: null, preview: 'regular' },
  { id: 'mono', label: 'Black and white', background: null, preview: 'regular', previewGrey: true },
  { id: 'old-map', label: 'Old map', background: 'old-map' },
  { id: 'starry', label: 'Starry night', background: 'starry-night' },
];

export const MAP_STYLE_IDS = MAP_STYLES.map((style) => style.id);

export const mapStyleById = (id) => MAP_STYLES.find((style) => style.id === id) || MAP_STYLES[0];

/**
 * The style a map is drawn in (docs/API.md "Map styles"; 22 Nov 2026, the user's wish: the
 * owner's choice is what everyone sees, share links too): the map's own (`map.style`, which
 * the server fills with the owner's own style when the map has none), else the viewer's.
 * A map's design is drawn on it too.
 */
export const shownStyle = (map, viewerStyle) => (MAP_STYLE_IDS.includes(map?.style) ? map.style : viewerStyle);

// Black and white: the world map in greys (MapExperience's greyscale filter, the grey
// tokens on <html>: useMapTheme)
export const MONO_STYLE = 'mono';
export const isMonoStyle = (id) => mapStyleById(id).id === MONO_STYLE;
