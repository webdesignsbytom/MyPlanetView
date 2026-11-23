import { describe, it, expect } from 'vitest';
import {
  BADGES,
  BADGE_KEYS,
  TRAVELLER_BADGE_GROUPS,
  badgeProgress,
  collectionKey,
  collectionProgress,
  collectionTiers,
  parseCollectionKey,
  travellerBadges,
} from '../src/utils/badges.js';
import { REGIONS } from '../src/utils/constants/regions.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';

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

  it('award "All countries" for every country the map shows: the UK, or its four nations on a split map', () => {
    const table = new Map([
      ['FR', 'EUROPE'], ['GB', 'EUROPE'], ['XE', 'EUROPE'], ['XC', 'EUROPE'], ['XW', 'EUROPE'], ['XI', 'EUROPE'],
      ['AQ', 'ANTARCTICA'], ['XS', 'ANTARCTICA'], ['XN', null],
    ]);
    const all = (visited, splitUk = false) => of(badgeProgress({ visited: new Set(visited), continentByCode: table, splitUk }), 'countries-all');
    expect(all(['FR'])).toMatchObject({ group: 'countries', have: 1, need: 2, earned: false });
    // Antarctica and the poles count apart
    expect(all(['FR', 'GB', 'AQ', 'XS', 'XN'])).toMatchObject({ have: 2, need: 2, earned: true });
    // On a split map, the nations instead of the UK (an old UK mark isn't a nation yet)
    expect(all(['FR', 'GB'], true)).toMatchObject({ have: 1, need: 5, earned: false });
    expect(all(['FR', 'XE', 'XC', 'XW'], true)).toMatchObject({ have: 4, need: 5, earned: false });
    expect(all(['FR', 'XE', 'XC', 'XW', 'XI'], true)).toMatchObject({ have: 5, need: 5, earned: true });
    // With no country table to count from, nothing is earned
    expect(of(badgeProgress({}), 'countries-all')).toMatchObject({ have: 0, need: 1, earned: false });
  });

  it('need all 226 countries of the seeded list for "All countries", or 229 with the UK split (never a region)', () => {
    const table = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
    expect(of(badgeProgress({ continentByCode: table }), 'countries-all').need).toBe(226);
    expect(of(badgeProgress({ continentByCode: table, splitUk: true }), 'countries-all').need).toBe(229);
    // Every country and region visited: the regions add nothing
    const everywhere = new Set(COUNTRIES.filter((c) => c.kind !== 'NATION').map((c) => c.code));
    expect(of(badgeProgress({ visited: everywhere, continentByCode: table }), 'countries-all')).toMatchObject({ have: 226, earned: true });
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

// The country collections (24 Nov 2026, the user's wish): bronze, silver and gold for a
// quarter, half and all of a place's landmarks stamped in the passport
describe('country collections', () => {
  it('need a quarter, half and all of a place’s landmarks, rounded up', () => {
    expect(collectionTiers(60)).toEqual([
      { tier: 'bronze', need: 15 },
      { tier: 'silver', need: 30 },
      { tier: 'gold', need: 60 },
    ]);
    expect(collectionTiers(7)).toEqual([
      { tier: 'bronze', need: 2 },
      { tier: 'silver', need: 4 },
      { tier: 'gold', need: 7 },
    ]);
  });

  it('never let one stamp earn two tiers: a small place has fewer', () => {
    expect(collectionTiers(1)).toEqual([{ tier: 'gold', need: 1 }]);
    expect(collectionTiers(2)).toEqual([
      { tier: 'silver', need: 1 },
      { tier: 'gold', need: 2 },
    ]);
    expect(collectionTiers(3)).toEqual([
      { tier: 'bronze', need: 1 },
      { tier: 'silver', need: 2 },
      { tier: 'gold', need: 3 },
    ]);
    expect(collectionTiers(0)).toEqual([]);
    expect(collectionTiers(undefined)).toEqual([]);
  });

  it('have keys that read back, and no other key reads as one', () => {
    expect(collectionKey('FR', 'gold')).toBe('collect-FR-gold');
    expect(parseCollectionKey('collect-XE-bronze')).toEqual({ place: 'XE', tier: 'bronze' });
    expect(parseCollectionKey('collect-FR-platinum')).toBeNull();
    expect(parseCollectionKey('countries-5')).toBeNull();
    expect(parseCollectionKey(undefined)).toBeNull();
  });

  it('list only the places started, or with a tier awarded, by code, each tier with its progress', () => {
    const stamps = [{ countryCode: 'IT' }, { countryCode: 'IT' }, { countryCode: 'FR' }, { countryCode: 'VA' }];
    const totals = new Map([['IT', 8], ['FR', 4], ['VA', 1], ['ES', 6], ['JP', 3]]);
    const progress = collectionProgress({ stamps, totals, keep: ['JP'] });
    expect(progress.map((b) => b.key)).toEqual([
      'collect-FR-bronze', 'collect-FR-silver', 'collect-FR-gold',
      'collect-IT-bronze', 'collect-IT-silver', 'collect-IT-gold',
      'collect-JP-bronze', 'collect-JP-silver', 'collect-JP-gold',
      'collect-VA-gold',
    ]);
    expect(progress.find((b) => b.key === 'collect-IT-bronze')).toEqual({
      key: 'collect-IT-bronze', group: 'collections', place: 'IT', tier: 'bronze', have: 2, need: 2, earned: true,
    });
    expect(progress.find((b) => b.key === 'collect-IT-gold')).toMatchObject({ have: 2, need: 8, earned: false });
    expect(progress.find((b) => b.key === 'collect-JP-bronze')).toMatchObject({ have: 0, earned: false });
    expect(progress.find((b) => b.key === 'collect-VA-gold')).toMatchObject({ have: 1, need: 1, earned: true });
  });

  it('leave out a place with no landmarks counted', () => {
    expect(collectionProgress({ stamps: [{ countryCode: 'XN' }], totals: new Map() })).toEqual([]);
  });

  it('come after the fixed badges, with the World Heritage tiers up to 250', () => {
    const progress = badgeProgress({
      continentByCode,
      stamps: [{ countryCode: 'FR', isUnesco: true }],
      landmarkTotals: new Map([['FR', 2]]),
    });
    expect(progress.slice(-2).map((b) => b.key)).toEqual(['collect-FR-silver', 'collect-FR-gold']);
    expect(progress.filter((b) => b.key.startsWith('unesco-')).map((b) => b.need)).toEqual([5, 25, 50, 100, 250]);
    // Travellers have none: their badges come from trips, not stamps
    expect(TRAVELLER_BADGE_GROUPS).not.toContain('collections');
  });
});

// Life's One Shots (24 Nov 2026): each list's ticks, and the Big Five
describe('Life’s One Shots badges', () => {
  it('count each list’s ticks and the Big Five', () => {
    const progress = badgeProgress({ continentByCode, oneShots: ['lion', 'leopard', 'african-elephant', 'african-buffalo', 'rhino', 'northern-lights', 'equator'] });
    expect(of(progress, 'oneshots-wildlife-1')).toMatchObject({ group: 'oneShots', have: 1, need: 1, earned: true });
    expect(of(progress, 'oneshots-wildlife-10')).toMatchObject({ have: 5, need: 10, earned: false });
    expect(of(progress, 'oneshots-wonders-1').earned).toBe(true);
    expect(of(progress, 'oneshots-journeys-5')).toMatchObject({ have: 1, need: 5 });
    expect(of(progress, 'big-five')).toMatchObject({ have: 5, need: 5, earned: true });
    expect(BADGES.filter((b) => b.group === 'oneShots').map((b) => b.key)).toEqual([
      'oneshots-wildlife-1', 'oneshots-wildlife-10', 'oneshots-wildlife-25', 'oneshots-wildlife-50',
      'oneshots-wonders-1', 'oneshots-wonders-5', 'oneshots-wonders-15',
      'oneshots-journeys-1', 'oneshots-journeys-5', 'oneshots-journeys-15',
      'big-five',
    ]);
  });

  it('never go to one traveller', () => {
    expect(TRAVELLER_BADGE_GROUPS).not.toContain('oneShots');
  });
});
