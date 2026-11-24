// A map's own design (docs/API.md "Map designs"; 21 Nov 2026, the user's wish): the colour
// rules (a copy of the server's utils/mapDesigns.js) and how the map wears a design. A map
// has one design per map style (22 Nov 2026, the user's wish: colours chosen on Black and
// white showed on the World map), shown to everyone who opens the map while it's in that
// style (mapStyles.js shownStyle): its own picture for the sea, its colours for countries,
// the names, the grid and the country under the pointer.
import { REGION_PARENT } from './regionPlaces';
import { REGION_PLACES, SPECIAL_PLACES, countriesOnMap } from './countries';
import { isPole } from './specialPlaces';
import { pastelNumberFor } from './visitStatus';

const MB = 1024 * 1024;

/** A colour as the server keeps it: "#rrggbb", lower case. */
export const DESIGN_COLOUR = /^#[0-9a-f]{6}$/;
/** The strings' colour may be see-through (25 Nov 2026, the user's wish): "#rrggbbaa" too. */
export const DESIGN_COLOUR_ALPHA = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;
const PLACE_CODE = /^[A-Z]{2}$/;

/** "#rrggbb" from three channel values (0 to 255). */
const toHex = (channels) => `#${channels.map((n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')).join('')}`;

/**
 * A colour as a picker shows it: `{ hex: "#rrggbb", opacity }`, the opacity a whole percent
 * (100 when the colour has none). A browser's colour picker takes no opacity, so a slider
 * beside it sets that (DesignColourField).
 */
export function splitOpacity(colour) {
  // Never met (the usual colour is read from the tokens), but a picker needs a colour
  if (typeof colour !== 'string' || !DESIGN_COLOUR_ALPHA.test(colour)) return { hex: toHex([0, 0, 0]), opacity: 100 };
  const hex = colour.slice(0, 7);
  return { hex, opacity: colour.length === 9 ? Math.round((parseInt(colour.slice(7), 16) * 100) / 255) : 100 };
}

/** "#rrggbb" with an opacity (a percent): "#rrggbbaa", or "#rrggbb" when it's fully opaque. */
export function withOpacity(hex, opacity) {
  const percent = Math.min(100, Math.max(0, Math.round(opacity)));
  if (percent === 100) return hex;
  return `${hex}${Math.round((percent * 255) / 100).toString(16).padStart(2, '0')}`;
}

// The sea's picture: made in the browser from the chosen file, at most this wide or tall
// (the map fills the screen), as WebP (JPEG where the browser can't write WebP)
export const DESIGN_PICTURE_EDGE = 2560;
export const DESIGN_PICTURE_QUALITY = 0.85;
export const DESIGN_PICTURE_MAX_BYTES = 8 * MB;
// Any picture the browser can read: it's drawn again as WebP or JPEG before it's sent
export const DESIGN_PICTURE_ACCEPT = 'image/*';

// A colour is saved this long after the last change (a colour picker sends one per move)
export const DESIGN_SAVE_DELAY_MS = 500;

/** A map's design for a map style (the reply's `designs`, style -> design), or null. */
export const designFor = (map, styleId) => map?.designs?.[styleId] ?? null;

/** The design the map shows: its own when switched on, else null (the plain style). */
export const shownDesign = (design) => (design?.shown ? design : null);

/** A design with nothing in it yet, as the editor starts one. */
export const EMPTY_DESIGN = Object.freeze({ shown: true, countries: {}, names: null, grid: null, hover: null, string: null, stringTwist: null, picture: null });

// A twined string's width on screen (MapStrings): wide enough for the twist to show; a
// string of one colour is 1.8px (4 and 2 until 25 Nov 2026, the user's wish: 10% thinner)
export const TWINED_STRING_PX = 3.6;

/**
 * The strings' tokens for a design: `--map-string` (one colour, see-through or not); with a
 * second colour twisted in (`stringTwist`, 25 Nov 2026, the user's wish), the twine's: its
 * first colour opaque, its opacity apart (`--map-string-alpha`, on each string as a whole, so
 * the two colours never show through each other), the second colour, its width, and the
 * twist's strands shown (`--map-string-twist`; MapStrings draws them always, hidden unless
 * this says so, so ticking the box shows the twine at once).
 */
function stringVars(design) {
  const string = typeof design.string === 'string' && DESIGN_COLOUR_ALPHA.test(design.string) ? design.string : null;
  const twist = typeof design.stringTwist === 'string' && DESIGN_COLOUR.test(design.stringTwist) ? design.stringTwist : null;
  if (!twist) return string ? [`--map-string:${string}`] : [];
  const vars = [];
  if (string) {
    vars.push(`--map-string:${string.slice(0, 7)}`);
    if (string.length === 9) vars.push(`--map-string-alpha:${Math.round((parseInt(string.slice(7), 16) / 255) * 1000) / 1000}`);
  }
  vars.push(`--map-string-2:${twist}`, `--map-string-width:${TWINED_STRING_PX}px`, '--map-string-twist:inline');
  return vars;
}

/** Only well-formed colours: they go into a style sheet, so nothing else is let through. */
export function cleanCountryColours(countries) {
  const colours = {};
  if (!countries || typeof countries !== 'object') return colours;
  for (const [code, colour] of Object.entries(countries)) {
    if (PLACE_CODE.test(code) && typeof colour === 'string' && DESIGN_COLOUR.test(colour)) colours[code] = colour;
  }
  return colours;
}

/**
 * A design's style sheet, for the map inside [data-map-design]: the names', the grid's and
 * the hovered country's colours as the tokens they read (--map-names, --map-grid,
 * --map-hover: the hover colour shows on countries, dots, states and poles alike), and one rule per coloured
 * place on the map's own shapes (CountryShape and MicroStateDot carry data-code). A region
 * (Bali, Tasmania) wears its country's colour unless it has its own, as it wears its
 * country's pastel. The country under the pointer still shows the hover colour.
 * A style sheet, not React props, so a colour picker's every move restyles the map without
 * re-rendering it (MapDesignStyle).
 */
export function designCss(design) {
  if (!design) return '';
  const vars = [];
  if (typeof design.names === 'string' && DESIGN_COLOUR.test(design.names)) vars.push(`--map-names:${design.names}`);
  if (typeof design.grid === 'string' && DESIGN_COLOUR.test(design.grid)) vars.push(`--map-grid:${design.grid}`);
  if (typeof design.hover === 'string' && DESIGN_COLOUR.test(design.hover)) vars.push(`--map-hover:${design.hover}`);
  vars.push(...stringVars(design));
  const colours = cleanCountryColours(design.countries);
  for (const [region, parent] of Object.entries(REGION_PARENT)) {
    if (!colours[region] && colours[parent]) colours[region] = colours[parent];
  }
  return [
    vars.length ? `[data-map-design]{${vars.join(';')}}` : '',
    ...Object.entries(colours).map(([code, colour]) => `[data-map-design] svg g[data-code="${code}"]:not(:hover){fill:${colour}}`),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The places a colour can go on, as the map draws them: the countries (the UK's nations
 * on a map that splits it), Antarctica, then the regions. Never a pole: they're compass roses.
 */
export const colourablePlaces = (splitUk) => [
  ...countriesOnMap(splitUk),
  ...SPECIAL_PLACES.filter((place) => !isPole(place.code)),
  ...REGION_PLACES,
];

/** The CSS token of the colour a place wears on the map (Antarctica is ice). */
export const usualColourToken = (code) => (code === 'AQ' ? '--map-ice' : `--map-visit-${pastelNumberFor(code)}`);

/**
 * A colour token's value as "#rrggbb" (a colour picker takes nothing else), read where
 * `element` sits: the token as written when it's already that, else as the browser resolves it.
 */
export function readColourToken(name, element = document.documentElement) {
  const written = getComputedStyle(element).getPropertyValue(name).trim().toLowerCase();
  if (DESIGN_COLOUR.test(written)) return written;
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  element.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const [r = 0, g = 0, b = 0] = (resolved.match(/[\d.]+/g) || []).map(Number);
  return toHex([r, g, b]);
}

/**
 * Colour tokens as a map style draws them (`{ token: "#rrggbb" }`): read inside a hidden
 * element carrying that style's data-map-style, so it's the style's own colours, never a
 * design's (which sit on [data-map-design]). Black and white's greys are on <html> while
 * it's the map's style (useMapTheme), so they come through too.
 */
export function readStyleColours(styleId, tokens) {
  const probe = document.createElement('div');
  probe.hidden = true;
  probe.dataset.mapStyle = styleId;
  document.body.appendChild(probe);
  try {
    return Object.fromEntries(tokens.map((token) => [token, readColourToken(token, probe)]));
  } finally {
    probe.remove();
  }
}
