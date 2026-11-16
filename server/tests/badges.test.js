import { describe, it, expect } from 'vitest';
import { BADGES, BADGE_KEYS, TRAVELLER_BADGE_GROUPS, badgeProgress, travellerBadges } from '../src/utils/badges.js';
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

  it('count the monthly themes entered: 3, 6 and 12', () => {
    const progress = badgeProgress({ themes: 6 });
    expect(of(progress, 'themes-3').earned).toBe(true);
    expect(of(progress, 'themes-6')).toMatchObject({ have: 6, need: 6, earned: true });
    expect(of(progress, 'themes-12')).toMatchObject({ have: 6, need: 12, earned: false });
    expect(of(badgeProgress({}), 'themes-3').have).toBe(0);
  });
});

describe('a traveller’s badges', () => {
  const trips = [
    { travellerIds: ['ann', 'bo'], countryCodes: ['FR'], startDate: '2024-05-01', endDate: '2024-05-08' },
    { travellerIds: ['ann'], countryCodes: ['JP', 'XS'], startDate: '2025-01-02', endDate: '2025-01-20' },
    { travellerIds: ['ann'], countryCodes: ['KE'], startDate: null, endDate: null },
    { travellerIds: ['bo'], countryCodes: ['DK', 'NO', 'SE'], startDate: '2023-06-01', endDate: null },
  ];

  it('counts only that person’s completed trips, and only the travel badges', () => {
    const ann = travellerBadges({ trips, travellerId: 'ann', continentByCode });
    expect(new Set(ann.map((b) => b.group))).toEqual(new Set(TRAVELLER_BADGE_GROUPS));
    // France, Japan, Kenya: three countries (the South Pole and Antarctica count apart)
    expect(of(ann, 'countries-1')).toMatchObject({ have: 1, earned: true, earnedOn: '2024-05-08' });
    expect(of(ann, 'countries-5')).toMatchObject({ have: 3, earned: false, earnedOn: null });
    expect(of(ann, 'south-pole')).toMatchObject({ earned: true, earnedOn: '2025-01-20' });
    expect(of(ann, 'antarctica')).toMatchObject({ earned: true, earnedOn: '2025-01-20' });
    // Earned on a trip with no dates: earned, undated
    expect(of(ann, 'continent-africa')).toMatchObject({ earned: true, earnedOn: null });
    expect(of(ann, 'region-scandinavia').earned).toBe(false);
  });

  it('dates a badge from the trip that earned it, in date order', () => {
    const bo = travellerBadges({ trips, travellerId: 'bo', continentByCode });
    // The Scandinavian trip came first (dated by its first day), then France
    expect(of(bo, 'countries-1').earnedOn).toBe('2023-06-01');
    expect(of(bo, 'region-scandinavia')).toMatchObject({ earned: true, earnedOn: '2023-06-01' });
    expect(of(bo, 'countries-1').have).toBe(1);
    expect(travellerBadges({ trips, travellerId: 'nobody', continentByCode }).every((b) => !b.earned)).toBe(true);
  });
});

describe('badges on a map that splits the UK', () => {
  const uk = new Map([['XE', 'EUROPE'], ['XC', 'EUROPE'], ['XW', 'EUROPE'], ['XI', 'EUROPE'], ['IE', 'EUROPE'], ['GB', 'EUROPE']]);

  it('counts each nation as a country', () => {
    const progress = badgeProgress({ visited: new Set(['XE', 'XC', 'XW', 'XI', 'IE']), continentByCode: uk, splitUk: true });
    expect(of(progress, 'countries-5')).toMatchObject({ have: 5, earned: true });
  });

  it('asks the British Isles badge for all four nations and Ireland', () => {
    const some = badgeProgress({ visited: new Set(['XE', 'IE']), continentByCode: uk, splitUk: true });
    expect(of(some, 'region-british-isles')).toMatchObject({ have: 2, need: 5, earned: false });
    const all = badgeProgress({ visited: new Set(['XE', 'XC', 'XW', 'XI', 'IE']), continentByCode: uk, splitUk: true });
    expect(of(all, 'region-british-isles')).toMatchObject({ have: 5, need: 5, earned: true });
    // Without the split it's the UK and Ireland, as before
    expect(of(badgeProgress({ visited: new Set(['GB', 'IE']), continentByCode: uk }), 'region-british-isles')).toMatchObject({ need: 2, earned: true });
  });

  it('counts a traveller’s nations the same way', () => {
    const trips = [{ travellerIds: ['t1'], countryCodes: ['XE', 'XC'], endDate: '2025-06-01' }];
    const countries = travellerBadges({ trips, travellerId: 't1', continentByCode: uk, splitUk: true }).find((b) => b.key === 'countries-1');
    expect(countries).toMatchObject({ have: 1, earned: true });
  });
});
