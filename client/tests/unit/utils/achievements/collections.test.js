// @vitest-environment node
// The country collections' words and grouping (src/utils/achievements/collections.js).
import { describe, expect, it } from 'vitest';
import { collectionPlaces, collectionWords, parseCollectionKey } from '@/utils/achievements/collections';

const tier = (place, name, have, need, earnedAt = null) => ({ key: `collect-${place}-${name}`, group: 'collections', place, tier: name, have, need, earnedAt });

describe('parseCollectionKey', () => {
  it('reads a collection’s key, as the server makes it, and nothing else', () => {
    expect(parseCollectionKey('collect-IT-gold')).toEqual({ place: 'IT', tier: 'gold' });
    expect(parseCollectionKey('collect-XE-bronze')).toEqual({ place: 'XE', tier: 'bronze' });
    expect(parseCollectionKey('collect-IT-platinum')).toBeNull();
    expect(parseCollectionKey('unesco-50')).toBeNull();
  });
});

describe('collectionWords', () => {
  it('names a tier by its metal and place, and says what it took', () => {
    expect(collectionWords('collect-IT-gold')).toEqual({
      name: 'Gold for Italy',
      description: 'Every one of Italy’s landmarks stamped in the passport, by a photo or a “been here” tick.',
    });
    expect(collectionWords('collect-XC-bronze').name).toBe('Bronze for Scotland');
    expect(collectionWords('collect-FR-silver').description).toMatch(/^Half of France’s landmarks/);
    expect(collectionWords('countries-5')).toBeNull();
  });
});

describe('collectionPlaces', () => {
  it('gathers each place’s tiers, lowest first, with how many of its landmarks are stamped', () => {
    const badges = [
      { key: 'countries-1', group: 'countries', have: 1, need: 1, earnedAt: '2026-01-01' },
      tier('IT', 'gold', 20, 58),
      tier('IT', 'bronze', 15, 15, '2026-11-20'),
      tier('IT', 'silver', 20, 29),
    ];
    expect(collectionPlaces(badges)).toEqual([
      {
        place: 'IT',
        name: 'Italy',
        tiers: [badges[2], badges[3], badges[1]].map((b) => ({ ...b })),
        have: 20,
        total: 58,
        best: 'bronze',
      },
    ]);
  });

  it('puts the best medals first, then the furthest along, then A to Z', () => {
    const places = collectionPlaces([
      tier('FR', 'bronze', 1, 12),
      tier('FR', 'silver', 1, 24),
      tier('FR', 'gold', 1, 48),
      tier('VA', 'gold', 1, 1, '2026-11-21'),
      tier('MT', 'bronze', 2, 1, '2026-11-20'),
      tier('MT', 'silver', 2, 2, '2026-11-22'),
      tier('MT', 'gold', 2, 3),
      tier('DE', 'bronze', 1, 13),
      tier('DE', 'silver', 1, 26),
      tier('DE', 'gold', 1, 51),
    ]);
    // France's 1 of 48 is further along than Germany's 1 of 51
    expect(places.map((p) => [p.place, p.best])).toEqual([
      ['VA', 'gold'],
      ['MT', 'silver'],
      ['FR', null],
      ['DE', null],
    ]);
  });

  it('reads a tier’s place from its key when the reply leaves it out (an older server)', () => {
    const [place] = collectionPlaces([{ key: 'collect-JP-gold', group: 'collections', have: 1, need: 3, earnedAt: null }]);
    expect(place).toMatchObject({ place: 'JP', name: 'Japan', total: 3, best: null });
  });

  it('gives none for badges with no collections', () => {
    expect(collectionPlaces([{ key: 'photos-100', group: 'photos', have: 3, need: 100 }])).toEqual([]);
    expect(collectionPlaces(undefined)).toEqual([]);
  });
});
