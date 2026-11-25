// The places the world map draws (CountryLayer), as shapes, dots and poles: one list for each
// way the map can be (the UK whole or split into its nations, Antarctica shown or hidden). Shared
// with what follows the same places, such as a metallic finish's sheet of metal under the places
// been to (VisitedFoil), so the two never disagree.
import { COUNTRIES, POLE_PLACES } from './countries';
import { COUNTRY_SHAPES } from './countryShapes';
import { UK_NATION_SHAPES } from './ukNationShapes';
import { isAntarctic, isPole } from './specialPlaces';

/** A place's outline paths: a country's, or one of the UK's nations'. */
export const shapesOf = (code) => COUNTRY_SHAPES[code] ?? UK_NATION_SHAPES[code];

// The shapes (countries and Antarctica), the micro-states' dots, and the poles' markers; each
// list also without Antarctica's places, for when that's hidden, and with the UK's four nations
// drawn in its place, for a map that splits the UK (ukNationShapes.js). Regions
// (regionPlaces.js) are shapes and a dot like any place.
const SHAPED = COUNTRIES.filter((c) => COUNTRY_SHAPES[c.code]);
const SHAPED_SPLIT_UK = [...SHAPED.filter((c) => c.code !== 'GB'), ...COUNTRIES.filter((c) => c.kind === 'NATION')];
const DOTTED = COUNTRIES.filter((c) => !COUNTRY_SHAPES[c.code] && !isPole(c.code) && c.kind !== 'NATION');
const notAntarctic = (c) => !isAntarctic(c.code);
const layerOf = (shaped) => ({
  withAntarctica: { shaped, dotted: DOTTED, poles: POLE_PLACES },
  withoutAntarctica: {
    shaped: shaped.filter(notAntarctic),
    dotted: DOTTED.filter(notAntarctic),
    poles: POLE_PLACES.filter(notAntarctic),
  },
});
const LAYERS = { whole: layerOf(SHAPED), splitUk: layerOf(SHAPED_SPLIT_UK) };

/** The places drawn: `{ shaped, dotted, poles }`, the same lists for the same map each time. */
export const drawnPlaces = ({ splitUk = false, showAntarctica = true } = {}) => {
  const layers = splitUk ? LAYERS.splitUk : LAYERS.whole;
  return showAntarctica ? layers.withAntarctica : layers.withoutAntarctica;
};

/**
 * A micro-state's dot's radius in map units at a zoom: sized so it stays clickable at any zoom,
 * never under 0.6 units.
 */
export const microStateDotRadius = (zoom) => Math.max(3.2 / Math.sqrt(zoom), 0.6);
