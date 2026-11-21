// Mock mode only: a map's own design (docs/API.md "Map designs"), as the server's
// utils/mapDesigns.js and controllers/mapDesigns.js. Kept on the map row (`map.design`:
// { shown, countries, names, grid, pictureKey }); the picture is the session's blob of the
// upload (a reload loses it, as every mock upload: the design then shows without it).
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { isPole } from '@/utils/map/specialPlaces';
import { DESIGN_COLOUR } from '@/utils/map/mapDesign';
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
};

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
  for (const field of ['names', 'grid']) {
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
export const newDesign = () => ({ shown: true, countries: {}, names: null, grid: null, pictureKey: null });

/** The design as the replies give it, or null for a map without one. */
export function designView(map) {
  const design = map?.design;
  if (!design) return null;
  const url = design.pictureKey ? session.blobs.get(design.pictureKey) : null;
  return {
    shown: Boolean(design.shown),
    countries: { ...design.countries },
    names: design.names ?? null,
    grid: design.grid ?? null,
    picture: url ? { url } : null,
  };
}
