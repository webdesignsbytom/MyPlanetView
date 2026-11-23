// How big the little 3D landmark models are drawn on a country's map (CountryMapView's
// LandmarkModels), and the room they take: 64 px tall times the model's `size` at zoom 1 (Big
// Ben's height; the Eiffel Tower is a little taller), growing with the square root of the zoom,
// between 40 and 150 px (times its size).
import { placeOnCountryMap } from './countryMapGeo';
import { REFERENCE_PX_PER_UNIT } from './projection';

export const MODEL_PX = 64;
export const MODEL_MIN_PX = 40;
export const MODEL_MAX_PX = 150;

/**
 * The models a country's map draws: those whose `maps` has it, but never one marked `onMap: false`
 * (23 Nov 2026, the user's decision: every landmark gets its model, but where two pictures would
 * overlap in a map's opening view only the more famous is drawn; the other is kept for other uses).
 */
export const modelsOnMap = (models, code) => models.filter((model) => model.onMap !== false && model.maps.includes(code));

/** The model's height on screen, in CSS pixels, at a zoom. */
export const modelPx = (model, zoom) => Math.min(MODEL_MAX_PX, Math.max(MODEL_MIN_PX, MODEL_PX * Math.sqrt(zoom))) * model.size;

/**
 * The model's picture on the canvas at a zoom, standing with its tile's middle (`anchor`) on
 * `at`: `{ x, y, width, height }` in map units.
 */
export function modelBox(model, at, zoom) {
  const height = modelPx(model, zoom) / (zoom * REFERENCE_PX_PER_UNIT);
  const width = height * model.aspect;
  return { x: at.x - width * model.anchor[0], y: at.y - height * model.anchor[1], width, height };
}

/**
 * The view `[x, y, width, height]` grown to take in every model's picture at `zoom`, with `pad`
 * map units round each (unchanged when they're all inside it already): a model standing off the
 * land the map draws (Bikini Atoll, too small for Natural Earth's outlines) or by the country's
 * edge (Gorée, off Africa's westernmost point) would otherwise open out of view, or half out.
 */
export function viewWithModels(geo, view, models, zoom, pad = 0) {
  const [vx0, vy0, vx1, vy1] = [view[0], view[1], view[0] + view[2], view[1] + view[3]];
  let [x0, y0, x1, y1] = [vx0, vy0, vx1, vy1];
  for (const model of models) {
    const box = modelBox(model, placeOnCountryMap(geo, model.latitude, model.longitude), zoom);
    x0 = Math.min(x0, box.x - pad);
    y0 = Math.min(y0, box.y - pad);
    x1 = Math.max(x1, box.x + box.width + pad);
    y1 = Math.max(y1, box.y + box.height + pad);
  }
  return x0 === vx0 && y0 === vy0 && x1 === vx1 && y1 === vy1 ? view : [x0, y0, x1 - x0, y1 - y0];
}
