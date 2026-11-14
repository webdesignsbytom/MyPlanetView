import { describe, it, expect } from 'vitest';
import { haversineMeters, matchLandmarks, boundingBox } from '../src/utils/landmarkMatch.js';

const eiffel = { id: 'eiffel', latitude: 48.8584, longitude: 2.2945, matchRadiusM: 500 };
const louvre = { id: 'louvre', latitude: 48.8606, longitude: 2.3376, matchRadiusM: 600 };

describe('haversineMeters', () => {
  it('measures a known distance (Eiffel Tower to the Louvre, ~3.2 km)', () => {
    const d = haversineMeters(eiffel.latitude, eiffel.longitude, louvre.latitude, louvre.longitude);
    expect(d).toBeGreaterThan(3100);
    expect(d).toBeLessThan(3300);
  });

  it('is zero for the same point', () => {
    expect(haversineMeters(10, 20, 10, 20)).toBe(0);
  });
});

describe('matchLandmarks', () => {
  it('suggests a landmark within its radius', () => {
    // Champ de Mars, ~300 m from the tower
    expect(matchLandmarks({ latitude: 48.8556, longitude: 2.2986 }, [eiffel, louvre])).toEqual([
      { landmarkId: 'eiffel', distanceM: expect.any(Number) },
    ]);
  });

  it('suggests nothing outside every radius', () => {
    expect(matchLandmarks({ latitude: 48.87, longitude: 2.25 }, [eiffel, louvre])).toEqual([]);
  });

  it('orders several matches nearest first', () => {
    const big = { id: 'paris', latitude: 48.8566, longitude: 2.3522, matchRadiusM: 10000 };
    const matches = matchLandmarks({ latitude: 48.8584, longitude: 2.2945 }, [big, eiffel]);
    expect(matches.map((m) => m.landmarkId)).toEqual(['eiffel', 'paris']);
  });

  it('ignores an invalid position', () => {
    expect(matchLandmarks({ latitude: null, longitude: 2 }, [eiffel])).toEqual([]);
  });
});

describe('boundingBox', () => {
  it('contains the centre and widens in longitude away from the equator', () => {
    const box = boundingBox(60, 10, 10000);
    expect(box.minLat).toBeLessThan(60);
    expect(box.maxLat).toBeGreaterThan(60);
    expect(box.maxLng - box.minLng).toBeGreaterThan(box.maxLat - box.minLat);
  });
});
