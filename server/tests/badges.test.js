import { describe, it, expect } from 'vitest';
import { BADGES, BADGE_KEYS, badgeProgress } from '../src/utils/badges.js';
import { REGIONS } from '../src/utils/constants/regions.js';

const continentByCode = new Map([
  ['FR', 'EUROPE'], ['DK', 'EUROPE'], ['NO', 'EUROPE'], ['SE', 'EUROPE'], ['JP', 'ASIA'], ['KE', 'AFRICA'],
  ['US', 'NORTH_AMERICA'], ['BR', 'SOUTH_AMERICA'], ['AU', 'OCEANIA'], ['AQ', 'ANTARCTICA'], ['XS', 'ANTARCTICA'],
]);
const of = (progress, key) => progress.find((b) => b.key === key);

describe('site badges', () => {
  it('have unique keys, each with what it needs', () => {
    expect(new Set(BADGE_KEYS).size).toBe(BADGES.length);
    for (const badge of BADGES) expect(badge.need, badge.key).toBeGreaterThan(0);
    // One per region, each needing every country in it
    for (const [region, { codes }] of Object.entries(REGIONS)) {
      expect(BADGES.find((b) => b.key === `region-${region}`)?.need).toBe(codes.length);
    }
  });

  it('count countries without the special places, and award at the step', () => {
    const progress = badgeProgress({ visited: new Set(['FR', 'JP', 'AQ', 'XN', 'KE', 'US']), continentByCode });
    expect(of(progress, 'countries-1')).toMatchObject({ have: 1, need: 1, earned: true });
    expect(of(progress, 'countries-5')).toMatchObject({ have: 4, need: 5, earned: false });
    expect(of(progress, 'antarctica').earned).toBe(true);
    expect(of(progress, 'north-pole').earned).toBe(true);
    expect(of(progress, 'south-pole').earned).toBe(false);
  });

  it('open a continent with its first country; Antarctica opens none of the six', () => {
    const progress = badgeProgress({ visited: new Set(['FR', 'AQ']), continentByCode });
    expect(of(progress, 'continent-europe').earned).toBe(true);
    expect(of(progress, 'continent-north-america').earned).toBe(false);
    expect(of(progress, 'continents-all')).toMatchObject({ have: 1, need: 6 });
    const all = badgeProgress({ visited: new Set(['FR', 'JP', 'KE', 'US', 'BR', 'AU']), continentByCode });
    expect(of(all, 'continents-all').earned).toBe(true);
  });

  it('need every country in a region', () => {
    const two = badgeProgress({ visited: new Set(['DK', 'NO']), continentByCode });
    expect(of(two, 'region-scandinavia')).toMatchObject({ have: 2, need: 3, earned: false });
    const three = badgeProgress({ visited: new Set(['DK', 'NO', 'SE']), continentByCode });
    expect(of(three, 'region-scandinavia').earned).toBe(true);
  });

  it('count stamps, UNESCO stamps and photos, never above what is needed', () => {
    const stamps = [...Array(12)].map((_, i) => ({ isUnesco: i < 6 }));
    const progress = badgeProgress({ stamps, photos: 150 });
    expect(of(progress, 'landmarks-10')).toMatchObject({ have: 10, earned: true });
    expect(of(progress, 'landmarks-50')).toMatchObject({ have: 12, earned: false });
    expect(of(progress, 'unesco-5').earned).toBe(true);
    expect(of(progress, 'photos-100').earned).toBe(true);
    expect(of(progress, 'photos-1000')).toMatchObject({ have: 150, need: 1000 });
  });
});
