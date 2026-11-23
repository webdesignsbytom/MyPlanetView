// @vitest-environment node
// How big a landmark model is drawn on a country's map, and the room it takes
// (src/utils/map/landmarkModelSize.js): its picture's box, and the opening view grown to take
// every model's picture in (CountryMapView's fit).
import { describe, expect, it } from 'vitest';
import LU from '@/utils/map/countryMaps/LU.js';
import MH from '@/utils/map/countryMaps/MH.js';
import { modelBox, modelPx, modelsOnMap, viewWithModels } from '@/utils/map/landmarkModelSize';
import { placeOnCountryMap, positionOnCountryMap } from '@/utils/map/countryMapGeo';
import { REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';
import { LANDMARK_MODELS } from '@/utils/map/landmarkModels';

const MODEL = { latitude: 49.61, longitude: 6.13, size: 1.2, aspect: 0.5, anchor: [0.5, 0.9] };

describe('modelsOnMap', () => {
  const models = [
    { id: 'big-ben', maps: ['GB', 'XE'] },
    { id: 'tower-of-london', maps: ['GB', 'XE'], onMap: false },
    { id: 'edinburgh-castle', maps: ['GB', 'XC'], onMap: true },
    { id: 'eiffel-tower', maps: ['FR'] },
  ];

  it('gives the models whose maps have the country', () => {
    expect(modelsOnMap(models, 'FR').map((m) => m.id)).toEqual(['eiffel-tower']);
    expect(modelsOnMap(models, 'XC').map((m) => m.id)).toEqual(['edinburgh-castle']);
    expect(modelsOnMap(models, 'DE')).toEqual([]);
  });

  it('leaves out a model marked onMap: false, a more famous one standing where it would', () => {
    expect(modelsOnMap(models, 'GB').map((m) => m.id)).toEqual(['big-ben', 'edinburgh-castle']);
    expect(modelsOnMap(models, 'XE').map((m) => m.id)).toEqual(['big-ben']);
  });

  it('draws every model in the list on at least one map unless it’s marked off the map', () => {
    for (const model of LANDMARK_MODELS) {
      const shown = model.maps.some((code) => modelsOnMap(LANDMARK_MODELS, code).includes(model));
      expect(shown, model.id).toBe(model.onMap !== false);
    }
  });
});

describe('modelPx', () => {
  it('is 64 px times the size at zoom 1, growing with the square root of the zoom, between 40 and 150 px', () => {
    expect(modelPx(MODEL, 1)).toBeCloseTo(64 * 1.2, 9);
    expect(modelPx(MODEL, 4)).toBeCloseTo(128 * 1.2, 9);
    expect(modelPx(MODEL, 0.25)).toBeCloseTo(40 * 1.2, 9);
    expect(modelPx(MODEL, 16)).toBeCloseTo(150 * 1.2, 9);
  });
});

describe('modelBox', () => {
  it('puts the tile’s middle (the anchor) on the spot, in map units at the zoom', () => {
    const box = modelBox(MODEL, { x: 100, y: 200 }, 2);
    const height = modelPx(MODEL, 2) / (2 * REFERENCE_PX_PER_UNIT);
    expect(box.height).toBeCloseTo(height, 9);
    expect(box.width).toBeCloseTo(height * 0.5, 9);
    expect(box.x + box.width * 0.5).toBeCloseTo(100, 9);
    expect(box.y + box.height * 0.9).toBeCloseTo(200, 9);
  });
});

describe('viewWithModels', () => {
  it('leaves the view as it is when every picture is inside it already', () => {
    expect(viewWithModels(LU, LU.view, [{ ...MODEL, size: 0.7 }], 1)).toEqual(LU.view);
    expect(viewWithModels(LU, LU.view, [], 1, 10)).toEqual(LU.view);
  });

  it('grows the view to take a picture in whole, with the room asked for round it', () => {
    // A spot on the view's left edge: the picture's left half was out of it
    const [x, y, w, h] = LU.view;
    const edge = { ...MODEL, ...positionOnCountryMap(LU, x, y + h / 2) };
    const view = viewWithModels(LU, LU.view, [edge], 1, 5);
    const box = modelBox(edge, placeOnCountryMap(LU, edge.latitude, edge.longitude), 1);
    expect(view[0]).toBeCloseTo(box.x - 5, 6);
    expect(view[0] + view[2]).toBeCloseTo(x + w, 6);
    expect(view[1]).toBe(y);
    expect(view[1] + view[3]).toBe(y + h);
  });

  it('takes in Bikini Atoll, which stands west of the Marshall Islands’ drawn atolls', () => {
    const bikini = LANDMARK_MODELS.find((model) => model.id === 'bikini-atoll');
    const at = placeOnCountryMap(MH, bikini.latitude, bikini.longitude);
    // Outside the map's own view: Natural Earth doesn't draw it
    expect(at.x).toBeLessThan(MH.view[0]);
    const [x, y, w, h] = viewWithModels(MH, MH.view, [bikini], 1);
    const box = modelBox(bikini, at, 1);
    expect(x <= box.x && y <= box.y && x + w >= box.x + box.width && y + h >= box.y + box.height).toBe(true);
    // and still the whole of the drawn islands
    expect(x + w).toBeGreaterThanOrEqual(MH.view[0] + MH.view[2]);
    expect(y + h).toBeGreaterThanOrEqual(MH.view[1] + MH.view[3]);
  });
});
