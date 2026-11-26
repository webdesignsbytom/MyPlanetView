// Where a share card's map looks (24 Nov 2026, the user's wish: "a trip to one country should
// just show the country's outline and regions, not the whole world where you can hardly see
// Italy"). The world map is 2000 map units wide (utils/map/projection.js); these are its
// edges as the cards draw it (drawShareCard.js, the poster and the compare picture too).
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { DETAIL_SHAPE_BOUNDS } from '@/utils/map/detailShapeBounds';
import { countryMapCodeFor } from '@/utils/map/countryMapGeo';
import { regionParent } from '@/utils/map/regionPlaces';
import { isAntarctic, isPole } from '@/utils/map/specialPlaces';

export const MAP_WIDTH = 2000; // the projection's width (utils/map/projection.js)
export const MAP_TOP = -5; // just above the northernmost land
export const MAP_BOTTOM_NO_ANTARCTICA = 860;
export const MAP_BOTTOM_WITH_ANTARCTICA = 1022;

// Half the box round a micro-state's dot (Monaco, Singapore), in map units
const DOT_HALF = 6;
// Room round the places, a share of their span on each side
const PAD = 0.15;
// A crop never closer than this, in map units (about the Benelux and its neighbours)
const MIN_SPAN = [140, 90];
// Places spread wider than this get the whole world: a crop would barely zoom in
const MAX_SPAN = [MAP_WIDTH * 0.55, (MAP_BOTTOM_NO_ANTARCTICA - MAP_TOP) * 0.6];

export const WORLD_VIEW = Object.freeze({ kind: 'world' });

const area = ([x0, y0, x1, y1]) => (x1 - x0) * (y1 - y0);

/**
 * Where a place's land is on the world map, `[minX, minY, maxX, maxY]`: its biggest stretch
 * (so France is France, not its overseas islands; the US's takes in Alaska), else a small box
 * round its pin (a micro-state's dot), else null.
 */
export function placeBox(code) {
  const boxes = DETAIL_SHAPE_BOUNDS[code];
  if (boxes?.length) return boxes.reduce((best, box) => (area(box) > area(best) ? box : best));
  const place = COUNTRY_BY_CODE[code];
  if (place && Number.isFinite(place.pinX) && Number.isFinite(place.pinY)) {
    return [place.pinX - DOT_HALF, place.pinY - DOT_HALF, place.pinX + DOT_HALF, place.pinY + DOT_HALF];
  }
  return null;
}

/**
 * The map a card with these places coloured in shows, close up:
 *   - `{ kind: 'country', code }`: one place (a region counts as its country: Bali is
 *     Indonesia's) with a map of its own, drawn with its states or provinces;
 *   - `{ kind: 'crop', view: [x, y, width, height] }`: places near each other (Spain and
 *     Portugal), the world map cropped round them, in map units;
 *   - `WORLD_VIEW`: places spread over the world, or Antarctica or a pole among them.
 */
export function cardMapView(highlight = []) {
  const codes = [...new Set(highlight)].filter((code) => COUNTRY_BY_CODE[code]);
  if (!codes.length || codes.some((code) => isAntarctic(code) || isPole(code))) return WORLD_VIEW;

  const places = new Set(codes.map((code) => regionParent(code) ?? code));
  if (places.size === 1) {
    const code = countryMapCodeFor([...places][0]);
    if (code) return { kind: 'country', code };
  }

  let bounds = null;
  for (const code of codes) {
    const box = placeBox(code);
    if (!box) continue;
    bounds = bounds
      ? [Math.min(bounds[0], box[0]), Math.min(bounds[1], box[1]), Math.max(bounds[2], box[2]), Math.max(bounds[3], box[3])]
      : [...box];
  }
  if (!bounds) return WORLD_VIEW;
  const [x0, y0, x1, y1] = bounds;
  if (x1 - x0 > MAX_SPAN[0] || y1 - y0 > MAX_SPAN[1]) return WORLD_VIEW;
  const width = Math.max(MIN_SPAN[0], (x1 - x0) * (1 + 2 * PAD));
  const height = Math.max(MIN_SPAN[1], (y1 - y0) * (1 + 2 * PAD));
  return { kind: 'crop', view: [(x0 + x1) / 2 - width / 2, (y0 + y1) / 2 - height / 2, width, height] };
}

/** The kind of map a card shows: its own close-up's when it asks for one (`mapView: 'fit'`), else the world. */
export const cardMapKind = (card) => (card?.mapView === 'fit' && !card.medal ? cardMapView(card.highlight).kind : 'world');
