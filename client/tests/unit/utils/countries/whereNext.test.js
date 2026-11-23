import { describe, expect, it } from 'vitest';
import { whereNext } from '@/utils/countries/whereNext';

// A guide's twelve ratings, January first, from a map of month index -> rating ('avoid' elsewhere)
const ratings = (rated) => Array.from({ length: 12 }, (_, i) => rated[i] ?? 'avoid');
const guide = (code, rated) => ({ code, slug: code.toLowerCase(), months: ratings(rated) });
const codes = (places) => places.map((place) => place.code);

describe('whereNext', () => {
  it('puts the places good this month first, best before good, then by name', () => {
    const guides = [guide('JP', { 3: 'good' }), guide('PE', { 3: 'best' }), guide('FR', { 3: 'good' }), guide('IS', { 3: 'best' })];
    const result = whereNext({ codes: ['JP', 'PE', 'FR', 'IS'], guides, month: 3 });
    expect(codes(result.now)).toEqual(['IS', 'PE', 'FR', 'JP']);
    expect(result.now[0]).toMatchObject({ rating: 'best', guide: guides[3] });
    expect(result.upcoming).toEqual([]);
  });

  it('groups the rest by their next best month, soonest first, wrapping over the new year', () => {
    const guides = [guide('JP', { 5: 'best' }), guide('PE', { 1: 'best', 4: 'good' }), guide('FR', { 5: 'best' })];
    const result = whereNext({ codes: ['JP', 'PE', 'FR'], guides, month: 10 });
    expect(result.upcoming.map((group) => [group.month, group.ahead, codes(group.places)])).toEqual([
      [1, 3, ['PE']],
      [5, 7, ['FR', 'JP']],
    ]);
  });

  it('waits for a best month even when a good one comes sooner', () => {
    const result = whereNext({ codes: ['PE'], guides: [guide('PE', { 2: 'good', 6: 'best' })], month: 0 });
    expect(result.upcoming).toEqual([{ month: 6, ahead: 6, places: [expect.objectContaining({ code: 'PE', rating: 'best' })] }]);
  });

  it('takes the next good month when no month is best', () => {
    const result = whereNext({ codes: ['PE'], guides: [guide('PE', { 2: 'good' })], month: 5 });
    expect(result.upcoming[0]).toMatchObject({ month: 2, ahead: 9, places: [{ code: 'PE', rating: 'good' }] });
  });

  it('lists a guide that rates no month apart, and places with no guide yet, each by name', () => {
    const guides = [guide('JP', {}), guide('FR', { 0: 'best' })];
    const result = whereNext({ codes: ['ZW', 'JP', 'AL', 'BR'], guides, month: 0 });
    expect(result.never).toEqual([{ code: 'JP', rating: null, guide: guides[0] }]);
    expect(result.noGuide).toEqual(['AL', 'BR', 'ZW']);
  });

  it('reads a UK nation and a region from their country’s guide', () => {
    const guides = [guide('GB', { 6: 'best' }), guide('US', { 6: 'good' })];
    const result = whereNext({ codes: ['XE', 'XH'], guides, month: 6 });
    expect(result.now.map((place) => [place.code, place.guide.code])).toEqual([
      ['XE', 'GB'],
      ['XH', 'US'],
    ]);
  });

  it('counts a place once, and ignores a guide without twelve months', () => {
    const result = whereNext({ codes: ['JP', 'JP'], guides: [{ code: 'JP', months: ['best'] }], month: 0 });
    expect(result.noGuide).toEqual(['JP']);
    expect(whereNext({ month: 0 })).toEqual({ now: [], upcoming: [], never: [], noGuide: [] });
  });
});
