// A map's own design (docs/API.md "Map designs"; 21 Nov 2026, the user's wish): the colour
// rules (a copy of the server's utils/mapDesigns.js) and how the map wears a design. The
// design is the map's, shown to everyone who opens it in place of their own map style, on
// the World map's look: its own picture for the sea, its colours for countries, the names
// and the grid.
import { REGION_PARENT } from './regionPlaces';
import { REGION_PLACES, SPECIAL_PLACES, countriesOnMap } from './countries';
import { isPole } from './specialPlaces';
import { pastelNumberFor } from './visitStatus';

const MB = 1024 * 1024;

/** A colour as the server keeps it: "#rrggbb", lower case. */
export const DESIGN_COLOUR = /^#[0-9a-f]{6}$/;
const PLACE_CODE = /^[A-Z]{2}$/;

// The sea's picture: made in the browser from the chosen file, at most this wide or tall
// (the map fills the screen), as WebP (JPEG where the browser can't write WebP)
export const DESIGN_PICTURE_EDGE = 2560;
export const DESIGN_PICTURE_QUALITY = 0.85;
export const DESIGN_PICTURE_MAX_BYTES = 8 * MB;
// Any picture the browser can read: it's drawn again as WebP or JPEG before it's sent
export const DESIGN_PICTURE_ACCEPT = 'image/*';

// A colour is saved this long after the last change (a colour picker sends one per move)
export const DESIGN_SAVE_DELAY_MS = 500;

// The map style a design is drawn on: the World map's
export const DESIGN_BASE_STYLE = 'animated';

/** The design the map shows: its own when switched on, else null (the viewer's style). */
export const shownDesign = (design) => (design?.shown ? design : null);

/** A design with nothing in it yet, as the editor starts one. */
export const EMPTY_DESIGN = Object.freeze({ shown: true, countries: {}, names: null, grid: null, picture: null });

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
 * A design's style sheet, for the map inside [data-map-design]: the names' and the grid's
 * colours as the tokens they read (--map-names, --map-grid), and one rule per coloured
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

/** The CSS token of the colour a place wears on the World map (Antarctica is ice). */
export const usualColourToken = (code) => (code === 'AQ' ? '--map-ice' : `--map-visit-${pastelNumberFor(code)}`);

/** "#rrggbb" from three channel values (0 to 255). */
const toHex = (channels) => `#${channels.map((n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')).join('')}`;

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
