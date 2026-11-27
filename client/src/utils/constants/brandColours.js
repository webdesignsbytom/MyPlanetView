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

// The map poster's looks (utils/poster/drawMapPoster.js), fixed for print as the share card's
// are: one per map style (27 Nov 2026, the user's wish: "all the map types as the look
// options"), keyed by its id, each the style's own map colours (index.css's [data-map-style]
// blocks and Black and white's grey tokens) on its own paperwork (the style's paper, frame and
// lettering), and "Old paper" (22 Nov 2026: an atlas in sepia, a parchment sea, pale land,
// brown edges). The pictured seas (Old map, Starry night, Engraved ocean) are the style's own
// picture over `sea`. Visited places wear `visits` (the pastels; Black and white's greys; on
// the starry night, where the site shows visits by their badges alone, its "visited" purple),
// or the map design's colours.
const POSTER_PASTELS = SHARE_CARD_COLOURS.visits;
export const POSTER_COLOURS = Object.freeze({
  animated: Object.freeze({
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
    visits: POSTER_PASTELS,
  }),
  mono: Object.freeze({
    paper: '#ffffff',
    frame: '#000000',
    title: '#000000',
    ink: '#000000',
    brown: '#404040',
    sea: '#262626',
    land: '#f7f7f7',
    landEdge: '#000000',
    ice: '#ffffff',
    iceEdge: '#000000',
    visits: Object.freeze(['#dcdcdc', '#cdcdcd', '#bebebe', '#afafaf', '#a0a0a0', '#919191', '#c6c6c6']),
  }),
  'old-map': Object.freeze({
    paper: '#f4e8cc',
    frame: '#6b4423',
    title: '#6e2318',
    ink: '#2a1a0c',
    brown: '#6b4423',
    sea: '#c9a86a',
    land: '#ecd9b4',
    landEdge: '#7c2d12',
    ice: '#eef1ea',
    iceEdge: '#8c9a96',
    visits: POSTER_PASTELS,
  }),
  starry: Object.freeze({
    paper: '#0c1c40',
    frame: '#6fa8d8',
    title: '#9fd0f2',
    ink: '#e3f0fb',
    brown: '#9fbad6',
    sea: '#06102b',
    land: '#8ec3e6',
    landEdge: '#34689e',
    ice: '#8ec3e6',
    iceEdge: '#34689e',
    visits: Object.freeze(Array(7).fill('#c084fc')),
  }),
  engraved: Object.freeze({
    paper: '#fdf8ee',
    frame: '#991b1b',
    title: '#991b1b',
    ink: '#3b2a1a',
    brown: '#97572b',
    sea: '#164a6b',
    land: '#f4f1e8',
    landEdge: '#b91c1c',
    ice: '#f4f9ff',
    iceEdge: '#8fb3d1',
    visits: POSTER_PASTELS,
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
    visits: POSTER_PASTELS,
  }),
});

// A postcard's four styles (utils/postcards/drawPostcard.js; 26 Nov 2026), drawn on a canvas so
// fixed here, as the share card's are: the card's paper and edge, the message's ink, the
// lettering, the rules and address lines, the stamp's paper, the postmark's ink, the sky behind
// a little 3D model, and the front's ribbon and big letters. Airmail's edge is red and blue
// stripes; vintage's paper a faint linen weave and its photo a brown wash, night's a navy one.
export const POSTCARD_COLOURS = Object.freeze({
  classic: Object.freeze({
    paper: '#fdf8ee',
    edge: '#ffffff',
    ink: '#2b2118',
    lettering: '#991b1b',
    shadow: '#3b2a1a',
    rule: '#97572b',
    stamp: '#ffffff',
    postmark: '#33416b',
    sky: '#dcecf7',
    // The front's lettering (27 Nov 2026): the "Greetings from" ribbon and its words, the big
    // letters' outline and their 3D side
    ribbon: '#1f1a17',
    ribbonInk: '#f6c445',
    outline: '#fdf8ee',
    extrude: '#991b1b',
  }),
  vintage: Object.freeze({
    paper: '#efe0bf',
    edge: '#e2cc9f',
    ink: '#4a3320',
    lettering: '#7a2e1a',
    shadow: '#3b2a1a',
    rule: '#8a5a33',
    weave: '#d9c193',
    stamp: '#f8efd9',
    postmark: '#5a3a22',
    sky: '#e9dcc0',
    ribbon: '#5a3a22',
    ribbonInk: '#f8efd9',
    outline: '#f8efd9',
    extrude: '#7a2e1a',
    // The photo washed with old brown
    tint: '#8a6236',
  }),
  airmail: Object.freeze({
    paper: '#ffffff',
    edge: '#ffffff',
    ink: '#1d2a4d',
    lettering: '#c8102e',
    shadow: '#1d2a4d',
    rule: '#1d3f8f',
    stripes: Object.freeze(['#c8102e', '#1d3f8f']),
    stamp: '#ffffff',
    postmark: '#1d2a4d',
    sky: '#dcecf7',
    ribbon: '#1d3f8f',
    ribbonInk: '#ffffff',
    outline: '#ffffff',
    extrude: '#c8102e',
  }),
  night: Object.freeze({
    paper: '#14213d',
    edge: '#0b1630',
    ink: '#f3ead2',
    lettering: '#e3b53d',
    shadow: '#05091a',
    rule: '#8fb3d1',
    stamp: '#f3ead2',
    postmark: '#e3b53d',
    sky: '#22345c',
    ribbon: '#0b1630',
    ribbonInk: '#e3b53d',
    outline: '#e3b53d',
    extrude: '#0b1630',
    // The photo washed with the night's navy
    tint: '#14213d',
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
