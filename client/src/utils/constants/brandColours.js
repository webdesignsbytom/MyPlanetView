// The palette as literals, for the few places that render without CSS: the
// theme-color meta tag and the web manifest (built in vite.config.js). Keep these in
// step with the light-mode tokens in src/styles/index.css. This is the only file
// allowed hex values (scripts/check-house-rules.mjs).

// colour6, light mode: the poster red
export const BRAND_RED = '#b91c1c';
// colour1, light mode: the page ground
export const BRAND_GROUND = '#ffffff';
// colour1, dark mode: the page ground (dark browser bar)
export const BRAND_GROUND_DARK = '#101215';

// The share card (utils/shareCard/drawShareCard.js) is drawn on a canvas, which can't read
// CSS: the poster's and the World map's colours, as the light-mode tokens in index.css
// (--poster-red-deep, --paper-cream, --poster-paper, --poster-brown, --poster-ink,
// --map-sea, --map-land, --map-land-edge, --map-ice, --map-ice-edge, --map-visit-1…7).
// Fixed here so a card always has the poster look, whatever map style the person uses.
export const SHARE_CARD_COLOURS = Object.freeze({
  frame: '#991b1b',
  paper: '#fdf8ee',
  strip: '#dcbc90',
  brown: '#97572b',
  ink: '#000000',
  title: '#991b1b',
  sea: '#1d9dda',
  land: '#f4f1e8',
  landEdge: '#b91c1c',
  ice: '#f4f9ff',
  iceEdge: '#8fb3d1',
  visits: Object.freeze(['#f0f038', '#0eb4a6', '#d8845a', '#ff6d6a', '#73b76a', '#b1a2ca', '#da92be']),
  // A country collection's medal (24 Nov 2026): each metal's face and rim, as the tokens'
  // --medal-* (index.css), and the ribbon's two straps
  medals: Object.freeze({
    bronze: Object.freeze({ face: '#c8874f', rim: '#7a4520' }),
    silver: Object.freeze({ face: '#c3c8cf', rim: '#646b74' }),
    gold: Object.freeze({ face: '#e3b53d', rim: '#8a6a12' }),
  }),
  ribbon: Object.freeze(['#991b1b', '#ef4444']),
  // A badge's luggage sticker (25 Nov 2026; BadgeSticker's look): the double ring in poster
  // red on parchment, the icon and number in the deep red, the tick's disc and its mark
  sticker: Object.freeze({ ring: '#ef4444', face: '#dcbc90', ink: '#991b1b', tick: '#ef4444', tickInk: '#ffffff' }),
});

// The map poster's two looks (utils/poster/drawMapPoster.js; 22 Nov 2026), fixed for print
// as the share card's are: "Blue sea" (the share card's map on cream paper) and "Old paper"
// (an atlas in sepia: a parchment sea, pale land, brown edges). Visited places wear the
// share card's pastels (or the map design's colours) in both.
export const POSTER_COLOURS = Object.freeze({
  atlas: Object.freeze({
    paper: '#fdf8ee',
    frame: '#991b1b',
    title: '#991b1b',
    ink: '#3b2a1a',
    brown: '#97572b',
    sea: '#1d9dda',
    land: '#f4f1e8',
    landEdge: '#b91c1c',
    ice: '#f4f9ff',
    iceEdge: '#8fb3d1',
  }),
  paper: Object.freeze({
    paper: '#f6ecd6',
    frame: '#7a4a24',
    title: '#7a2e1a',
    ink: '#3b2a1a',
    brown: '#7a4a24',
    sea: '#e9d9b8',
    land: '#fbf4e4',
    landEdge: '#8a5a33',
    ice: '#fdf9f0',
    iceEdge: '#b89a74',
  }),
});

// Comparing two maps (utils/compare/drawCompareMap.js; 22 Nov 2026): the countries on both,
// only on the first, only on the second, on the share card's sea and land. Three hues told
// apart without colour vision too (purple, amber, teal), and the page lists each group in words.
export const COMPARE_COLOURS = Object.freeze({
  both: '#7b2d8b',
  onlyA: '#f0a830',
  onlyB: '#2a9d8f',
});
