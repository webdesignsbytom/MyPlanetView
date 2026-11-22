import { describe, expect, it } from 'vitest';
import {
  POSITION_FIELD,
  byPosition,
  byShotAt,
  fillPhotoPositions,
  fillShotAt,
  firstPosition,
  movePhotoAfter,
  setShotAt,
  shotAtOf,
} from '@/dev/mock/photoOrder';
import * as server from '../../../../../server/src/utils/photoOrder.js';

const photo = (id, fields = {}) => ({ id, mapId: 'map-a', countryCode: 'FR', tripId: null, createdAt: '2026-01-01T00:00:00.000Z', ...fields });
const order = (photos, field = 'countryPosition') => [...photos].sort(byPosition(field)).map((p) => p.id);

describe('the gallery fields', () => {
  it('names the same fields as the server', () => {
    expect(POSITION_FIELD).toEqual(server.POSITION_FIELD);
  });
});

describe('firstPosition', () => {
  it('is 0 in an empty gallery, as the server’s positionFirst', () => {
    const p = photo('a');
    expect(firstPosition([p], 'country', p)).toBe(0);
    expect(server.positionFirst(null)).toBe(0);
  });

  it('goes one step before the current first, as the server', () => {
    const photos = [photo('a', { countryPosition: 2048 }), photo('b', { countryPosition: 1024 })];
    const added = photo('c');
    expect(firstPosition([...photos, added], 'country', added)).toBe(1024 - server.POSITION_STEP);
    expect(firstPosition([...photos, added], 'country', added)).toBe(server.positionFirst(1024));
  });

  it('looks only at the photo’s own gallery: same map and country, or the same trip', () => {
    const photos = [
      photo('other-country', { countryCode: 'IT', countryPosition: -5000 }),
      photo('other-map', { mapId: 'map-b', countryPosition: -9000 }),
      photo('same', { countryPosition: 3000, tripId: 't1', tripPosition: 100 }),
      photo('trip-other', { tripId: 't2', tripPosition: -100 }),
    ];
    const added = photo('new', { tripId: 't1' });
    expect(firstPosition([...photos, added], 'country', added)).toBe(3000 - 1024);
    expect(firstPosition([...photos, added], 'trip', added)).toBe(100 - 1024);
  });

  it('treats the photos with no country as one gallery', () => {
    const photos = [photo('a', { countryCode: null, countryPosition: 10 }), photo('b', { countryCode: undefined, countryPosition: 5 })];
    const added = photo('c', { countryCode: null });
    expect(firstPosition([...photos, added], 'country', added)).toBe(5 - 1024);
  });

  it('has no trip gallery for a photo on no trip', () => {
    const photos = [photo('a', { tripId: null, tripPosition: 50 })];
    const added = photo('b', { tripId: null });
    expect(firstPosition([...photos, added], 'trip', added)).toBe(0);
  });
});

describe('movePhotoAfter', () => {
  const gallery = () => [
    photo('a', { countryPosition: 1024 }),
    photo('b', { countryPosition: 2048 }),
    photo('c', { countryPosition: 3072 }),
    photo('d', { countryPosition: 4096 }),
  ];

  it('moves a photo between two neighbours, at the halfway point the server gives', () => {
    const photos = gallery();
    const d = photos[3];
    expect(movePhotoAfter(photos, 'country', d, 'a')).toBe(true);
    expect(d.countryPosition).toBe(server.positionBetween(1024, 2048));
    expect(order(photos)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('moves a photo first, one step before the first, as the server', () => {
    const photos = gallery();
    const c = photos[2];
    expect(movePhotoAfter(photos, 'country', c, null)).toBe(true);
    expect(c.countryPosition).toBe(server.positionBetween(null, 1024));
    expect(order(photos)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('moves a photo last, one step after the last, as the server', () => {
    const photos = gallery();
    const a = photos[0];
    expect(movePhotoAfter(photos, 'country', a, 'd')).toBe(true);
    expect(a.countryPosition).toBe(server.positionBetween(4096, null));
    expect(order(photos)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('refuses a neighbour that isn’t in the gallery', () => {
    const photos = [...gallery(), photo('elsewhere', { countryCode: 'IT', countryPosition: 1500 })];
    const a = photos[0];
    expect(movePhotoAfter(photos, 'country', a, 'elsewhere')).toBe(false);
    expect(movePhotoAfter(photos, 'country', a, 'a')).toBe(false);
    expect(a.countryPosition).toBe(1024);
  });

  it('renumbers the gallery when there’s no number between the neighbours, keeping its order', () => {
    // Two neighbours with no room between them (a halfway point the server also refuses)
    const photos = [photo('a', { countryPosition: 1 }), photo('b', { countryPosition: 1 + Number.EPSILON }), photo('c', { countryPosition: 900 })];
    expect(server.positionBetween(1, 1 + Number.EPSILON)).toBeNull();
    const c = photos[2];
    expect(movePhotoAfter(photos, 'country', c, 'a')).toBe(true);
    expect(order(photos)).toEqual(['a', 'c', 'b']);
    // Renumbered in steps of 1,024, then the halfway point
    expect(photos[0].countryPosition).toBe(1024);
    expect(c.countryPosition).toBe(1024 + 512);
  });

  it('renumbers two photos saved with the same position', () => {
    const photos = [photo('a', { countryPosition: 0 }), photo('b', { countryPosition: 0 }), photo('c', { countryPosition: 10 })];
    const c = photos[2];
    expect(movePhotoAfter(photos, 'country', c, 'a')).toBe(true);
    expect(order(photos)).toEqual(['a', 'c', 'b']);
  });

  it('orders a trip’s gallery by its own field', () => {
    const photos = [
      photo('a', { tripId: 't', tripPosition: 1024, countryCode: 'FR' }),
      photo('b', { tripId: 't', tripPosition: 2048, countryCode: 'IT' }),
      photo('c', { tripId: 't', tripPosition: 3072, countryCode: 'ES' }),
    ];
    expect(movePhotoAfter(photos, 'trip', photos[2], null)).toBe(true);
    expect(order(photos, 'tripPosition')).toEqual(['c', 'a', 'b']);
  });
});

describe('byPosition', () => {
  it('sorts by the field, then by id', () => {
    const photos = [photo('b', { countryPosition: 1 }), photo('a', { countryPosition: 1 }), photo('c', { countryPosition: 0 })];
    expect(order(photos)).toEqual(['c', 'a', 'b']);
  });
});

describe('fillPhotoPositions', () => {
  it('numbers each gallery newest upload first, for stores saved before positions', () => {
    const photos = [
      photo('old', { createdAt: '2026-01-01T00:00:00.000Z', tripId: 't' }),
      photo('new', { createdAt: '2026-03-01T00:00:00.000Z', tripId: 't' }),
      photo('mid', { createdAt: '2026-02-01T00:00:00.000Z' }),
      photo('italy', { countryCode: 'IT', createdAt: '2026-01-05T00:00:00.000Z' }),
    ];
    fillPhotoPositions(photos);
    expect(order(photos.filter((p) => p.countryCode === 'FR'))).toEqual(['new', 'mid', 'old']);
    expect(photos.find((p) => p.id === 'new').countryPosition).toBe(1024);
    expect(photos.find((p) => p.id === 'italy').countryPosition).toBe(1024);
    expect(order(photos.filter((p) => p.tripId === 't'), 'tripPosition')).toEqual(['new', 'old']);
  });

  it('leaves a gallery field alone once every photo has it', () => {
    const photos = [photo('a', { countryPosition: 7, tripPosition: 9 }), photo('b', { countryPosition: 3, tripPosition: 1 })];
    fillPhotoPositions(photos);
    expect(photos.map((p) => [p.countryPosition, p.tripPosition])).toEqual([
      [7, 9],
      [3, 1],
    ]);
  });
});

describe('shotAt', () => {
  it('is when the photo was taken, else when it was uploaded', () => {
    expect(shotAtOf({ takenAt: '2019-04-12T19:40:00Z', createdAt: '2026-01-01T00:00:00Z' })).toBe('2019-04-12T19:40:00Z');
    expect(shotAtOf({ takenAt: null, createdAt: '2026-01-01T00:00:00Z' })).toBe('2026-01-01T00:00:00Z');
  });

  it('is set again when asked, and filled only where missing', () => {
    const a = { takenAt: '2020-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z' };
    setShotAt(a);
    expect(a.shotAt).toBe('2020-01-01T00:00:00Z');
    a.takenAt = null;
    setShotAt(a);
    expect(a.shotAt).toBe('2026-01-01T00:00:00Z');
    const kept = { shotAt: '2000-01-01T00:00:00Z', takenAt: '2020-01-01T00:00:00Z' };
    const missing = { takenAt: '2021-01-01T00:00:00Z' };
    fillShotAt([kept, missing]);
    expect(kept.shotAt).toBe('2000-01-01T00:00:00Z');
    expect(missing.shotAt).toBe('2021-01-01T00:00:00Z');
  });

  it('orders oldest taken first, then by id, an unreadable date first', () => {
    const photos = [
      { id: 'b', shotAt: '2020-01-01T00:00:00Z' },
      { id: 'a', shotAt: '2020-01-01T00:00:00Z' },
      { id: 'c', takenAt: '2010-06-01T00:00:00Z' },
      { id: 'd', shotAt: 'not a date' },
    ];
    expect(photos.sort(byShotAt).map((p) => p.id)).toEqual(['d', 'c', 'a', 'b']);
  });
});
