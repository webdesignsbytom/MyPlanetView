// @vitest-environment node
// The little 3D landmark models (src/utils/map/landmarkModels.js, generated): each well
// formed, and each standing on the canvas of every country map it's drawn on.
import { describe, expect, it } from 'vitest';
import { LANDMARK_MODELS, LANDMARK_MODEL_HEIGHTS } from '@/utils/map/landmarkModels';
import { countryMapCodeFor, loadCountryMap, placeOnCountryMap } from '@/utils/map/countryMapGeo';
import { isValidLatLng } from '@/utils/map/projection';

describe('the landmark models', () => {
  it('have unique ids, and the pictures at every height', () => {
    expect(new Set(LANDMARK_MODELS.map((m) => m.id)).size).toBe(LANDMARK_MODELS.length);
    for (const model of LANDMARK_MODELS) {
      for (const height of LANDMARK_MODEL_HEIGHTS) expect(model.images[height], `${model.id} ${height}`).toBeTruthy();
    }
  });

  it('are well formed: a name, a Wikidata item, a size no smaller than the floor, an anchor in the picture', () => {
    for (const model of LANDMARK_MODELS) {
      expect(model.name, model.id).toBeTruthy();
      expect(model.landmark, model.id).toMatch(/^Q\d+$/);
      expect(model.aspect > 0, model.id).toBe(true);
      expect(model.size >= 0.7, model.id).toBe(true);
      const [ax, ay] = model.anchor;
      expect(ax >= 0 && ax <= 1 && ay >= 0 && ay <= 1, model.id).toBe(true);
      expect(isValidLatLng(model.latitude, model.longitude), model.id).toBe(true);
      expect(model.maps.length, model.id).toBeGreaterThan(0);
    }
  });

  it('stand on the canvas of every country map they’re drawn on', { timeout: 60000 }, async () => {
    for (const model of LANDMARK_MODELS) {
      for (const code of model.maps) {
        expect(countryMapCodeFor(code), `${model.id} on ${code}`).toBe(code);
        const geo = await loadCountryMap(code);
        const { x, y } = placeOnCountryMap(geo, model.latitude, model.longitude);
        expect(x >= 0 && x <= 2000 && y >= 0 && y <= geo.height, `${model.id} on ${code}: ${x}, ${y}`).toBe(true);
      }
    }
  });
});
