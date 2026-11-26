import { describe, expect, it } from 'vitest';
import { VS_CATEGORIES } from '@/utils/vs/vsRules';
import { VS_CATEGORY_LABELS, categoryLabel, medalsWords, placeWords, valueWords, vsJoinLink } from '@/utils/vs/vsWords';

describe('Vs mode’s words', () => {
  it('names every category, and a new one by its key', () => {
    for (const category of VS_CATEGORIES) expect(VS_CATEGORY_LABELS[category]).toBeTruthy();
    expect(categoryLabel('worldHeritage')).toBe('World Heritage Sites');
    expect(categoryLabel('moonLandings')).toBe('moonLandings');
  });

  it('reads numbers with separators, distances in km, and a dash for no map', () => {
    expect(valueWords('countries', 1234)).toBe('1,234');
    expect(valueWords('distanceKm', 101211)).toBe('101,211 km');
    expect(valueWords('flights', null)).toBe('–');
    expect(valueWords('flights', 0)).toBe('0');
  });

  it('says places as ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 103].map(placeWords)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '103rd']);
    expect(placeWords(null)).toBe('');
  });

  it('counts the medals', () => {
    expect(medalsWords({ gold: 2, silver: 1, bronze: 0 })).toBe('2 gold, 1 silver');
    expect(medalsWords({ gold: 0, silver: 0, bronze: 3 })).toBe('3 bronze');
    expect(medalsWords({})).toBe('No medals yet');
  });

  it('builds the join link on this site', () => {
    expect(vsJoinLink('https://example.test', 'VS22-FRND-8MAX')).toBe('https://example.test/vs/join/VS22-FRND-8MAX');
  });
});
