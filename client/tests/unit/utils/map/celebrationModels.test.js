// @vitest-environment node
// The celebration screen's models (src/utils/map/celebrationModels.js): a landmark's by its
// Wikidata item, a country's from the maps that draw them.
import { describe, expect, it } from 'vitest';
import { modelForLandmark, modelsForPlace } from '@/utils/map/celebrationModels';
import { LANDMARK_MODELS } from '@/utils/map/landmarkModels';
import { LANDMARKS } from '@/dev/mock/data/landmarks';

describe('modelForLandmark', () => {
  it('finds a landmark’s model by its Wikidata item', () => {
    expect(modelForLandmark({ wikidataId: 'Q243' }).id).toBe('eiffel-tower');
    expect(modelForLandmark({ wikidataId: 'Q10344038' })?.id).toBeTruthy();
  });

  it('finds none for a landmark with no model yet, or no item', () => {
    expect(modelForLandmark({ wikidataId: 'Q1' })).toBeNull();
    expect(modelForLandmark({ name: 'Somewhere' })).toBeNull();
    expect(modelForLandmark(null)).toBeNull();
  });

  it('finds every model’s landmark in the landmark data', () => {
    const items = new Set(LANDMARKS.map((landmark) => landmark.wikidataId));
    const missing = LANDMARK_MODELS.filter((model) => !items.has(model.landmark)).map((model) => model.id);
    expect(missing).toEqual([]);
  });
});

describe('modelsForPlace', () => {
  it('gives a country’s models its map draws, the tallest first, at most three', () => {
    const models = modelsForPlace('FR');
    expect(models).toHaveLength(3);
    expect(models[0].id).toBe('eiffel-tower');
    expect(models.every((model) => model.maps.includes('FR') && model.onMap !== false)).toBe(true);
    for (let i = 1; i < models.length; i++) expect(models[i - 1].size).toBeGreaterThanOrEqual(models[i].size);
  });

  it('leaves out a model the map doesn’t draw', () => {
    expect(modelsForPlace('FR', 10).map((model) => model.id)).not.toContain('versailles');
  });

  it('gives a UK nation its own, and a place with no map of its own none', () => {
    expect(modelsForPlace('XE', 10).map((model) => model.id)).toContain('big-ben');
    expect(modelsForPlace('XB')).toEqual([]);
    expect(modelsForPlace('XN')).toEqual([]);
  });
});
