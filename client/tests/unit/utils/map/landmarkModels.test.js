// @vitest-environment node
// The little 3D landmark models (src/utils/map/landmarkModels.js, generated): each well
// formed, and each standing on the canvas of every country map it's drawn on.
import fs from 'node:fs';
import path from 'node:path';
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

  it('are well formed: a name, a Wikidata item, a size no smaller than its look’s floor, an anchor in the picture', () => {
    for (const model of LANDMARK_MODELS) {
      expect(model.name, model.id).toBeTruthy();
      expect(model.landmark, model.id).toMatch(/^Q\d+$/);
      expect(model.aspect > 0, model.id).toBe(true);
      // A toon model is never under 0.7 of Big Ben's height; a diorama's base is always as wide,
      // so the lowest is about half the map's model height
      expect(model.size >= (model.hq ? 0.4 : 0.7), model.id).toBe(true);
      const [ax, ay] = model.anchor;
      expect(ax >= 0 && ax <= 1 && ay >= 0 && ay <= 1, model.id).toBe(true);
      expect(isValidLatLng(model.latitude, model.longitude), model.id).toBe(true);
      expect(model.maps.length, model.id).toBeGreaterThan(0);
    }
  });

  // The models remade in the high-quality look (images/src/models-hq/, 26 Nov 2026): the list is
  // made again after each render there, so every one is drawn from its diorama
  it('are drawn from their high-quality render wherever one has been made', () => {
    const hqDir = path.resolve(process.cwd(), '../images/src/models-hq');
    const rendered = fs
      .readdirSync(hqDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(hqDir, entry.name, `${entry.name}-1024.png`)))
      .map((entry) => entry.name)
      .sort();
    expect(rendered.length).toBeGreaterThan(0);
    const hq = LANDMARK_MODELS.filter((model) => model.hq)
      .map((model) => model.id)
      .sort();
    expect(hq).toEqual(rendered);
  });

  it('draw every diorama at one scale: each base the same width on the map, a taller one standing taller', () => {
    const dioramas = LANDMARK_MODELS.filter((model) => model.hq);
    // The picture's width on the map is its base's (and the shadow under it)
    const widths = dioramas.map((model) => model.size * model.aspect);
    expect(Math.max(...widths) / Math.min(...widths)).toBeLessThan(1.05);
    const byId = new Map(dioramas.map((model) => [model.id, model]));
    expect(byId.get('big-ben').size).toBeGreaterThan(byId.get('colosseum').size);
    expect(byId.get('eiffel-tower').size).toBeGreaterThan(1);
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
