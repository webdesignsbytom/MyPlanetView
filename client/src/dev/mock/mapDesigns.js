// Mock mode only: a map's own designs, one per map style (docs/API.md "Map designs"), as the
// server's utils/mapDesigns.js and controllers/mapDesigns.js. Kept on the map row
// (`map.designs`: style -> { shown, countries, names, grid, hover, string, pictureKey }); the picture is the
// session's blob of the upload (a reload loses it, as every mock upload: the design then
// shows without it).
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { isPole } from '@/utils/map/specialPlaces';
import { DESIGN_COLOUR } from '@/utils/map/mapDesign';
import { MAP_STYLE_IDS } from '@/utils/map/mapStyles';
import { session } from './store';

const MB = 1024 * 1024;
export const DESIGN_MAX_COLOURS = 400;
export const DESIGN_PICTURE_TYPES = ['image/jpeg', 'image/webp', 'image/png'];
export const DESIGN_PICTURE_MAX_BYTES = 8 * MB;

// The server's responses.js wording
export const DESIGN_MESSAGES = {
  invalidDesign: 'That design can’t be saved.',
  invalidDesignColour: 'Colours must be six-digit colour codes, as a colour picker gives them.',
  invalidDesignPlace: 'That place isn’t on the map, so it can’t take a colour.',
  designPictureType: 'The picture must be a JPEG, PNG or WebP image.',
  designPictureInvalid: 'That picture upload isn’t valid. Please try again.',
  designPictureTooLarge: 'That picture is too big. Please choose a smaller one.',
  invalidMapStyle: 'Choose one of the map styles.',
};

/** The map style a design request names, or null. */
export const designStyleOf = (value) => (MAP_STYLE_IDS.includes(value) ? value : null);

/**
 * A map's designs (style -> design). A store from before designs were per style kept one as
 * `map.design`: it was drawn on the World map, so it becomes that style's, as the server's
 * migration does.
 */
export function designsOf(map) {
  if (!map) return {};
  if (map.design) {
    map.designs = { animated: map.design, ...map.designs };
    delete map.design;
  }
  map.designs ??= {};
  return map.designs;
}

function cleanColour(value) {
  if (value === null) return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const colour = value.trim().toLowerCase();
  return DESIGN_COLOUR.test(colour) ? { ok: true, value: colour } : { ok: false };
}

// The drawn places: countries, Antarctica, the UK's nations and regions; never a pole
const isColourable = (code) => Boolean(COUNTRY_BY_CODE[code]) && !isPole(code);

/** A PATCH body -> `{ change }` (fields as the map row keeps them) or `{ error }` (a DESIGN_MESSAGES key). */
export function parseDesignChange(body) {
  const input = body && typeof body === 'object' ? body : {};
  const change = {};
  if (input.shown !== undefined) {
    if (typeof input.shown !== 'boolean') return { error: 'invalidDesign' };
    change.shown = input.shown;
  }
  for (const field of ['names', 'grid', 'hover', 'string']) {
    if (input[field] === undefined) continue;
    const colour = cleanColour(input[field]);
    if (!colour.ok) return { error: 'invalidDesignColour' };
    change[field] = colour.value;
  }
  if (input.countries !== undefined) {
    const raw = input.countries;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'invalidDesign' };
    const entries = Object.entries(raw);
    if (entries.length > DESIGN_MAX_COLOURS) return { error: 'invalidDesign' };
    const countries = {};
    for (const [code, value] of entries) {
      if (!/^[A-Z]{2}$/.test(code)) return { error: 'invalidDesignPlace' };
      if (value === null) continue;
      const colour = cleanColour(value);
      if (!colour.ok) return { error: 'invalidDesignColour' };
      if (!isColourable(code)) return { error: 'invalidDesignPlace' };
      countries[code] = colour.value;
    }
    change.countries = countries;
  }
  if (!Object.keys(change).length) return { error: 'invalidDesign' };
  return { change };
}

/** A picture's declared type and size: null when fine, else a DESIGN_MESSAGES key. */
export function checkDesignPicture({ contentType, bytes }) {
  if (!DESIGN_PICTURE_TYPES.includes(contentType)) return 'designPictureType';
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return 'designPictureInvalid';
  if (bytes > DESIGN_PICTURE_MAX_BYTES) return 'designPictureTooLarge';
  return null;
}

/** A new design, as the server makes one. */
export const newDesign = () => ({ shown: true, countries: {}, names: null, grid: null, hover: null, string: null, pictureKey: null });

/** A map's design for a style as the replies give it, or null when it has none. */
export function designView(map, style) {
  const design = designsOf(map)[style];
  if (!design) return null;
  const url = design.pictureKey ? session.blobs.get(design.pictureKey) : null;
  return {
    style,
    shown: Boolean(design.shown),
    countries: { ...design.countries },
    names: design.names ?? null,
    grid: design.grid ?? null,
    hover: design.hover ?? null,
    string: design.string ?? null,
    picture: url ? { url } : null,
  };
}

/** A map's designs as its reply gives them: style -> design. */
export const designsView = (map) => Object.fromEntries(Object.keys(designsOf(map)).map((style) => [style, designView(map, style)]));
