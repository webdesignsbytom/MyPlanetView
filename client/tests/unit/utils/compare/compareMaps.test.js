import { describe, expect, it } from 'vitest';
import { compareMaps, shareCodeFrom } from '@/utils/compare/compareMaps';

const visit = (countryCode, status = 'VISITED') => ({ countryCode, status });

describe('compareMaps', () => {
  it('splits the visited places into both, only A and only B, A to Z by name', () => {
    const a = [visit('JP'), visit('FR'), visit('ES', 'LIVED')];
    const b = [visit('FR'), visit('BR'), visit('AU')];
    expect(compareMaps(a, b)).toEqual({ both: ['FR'], onlyA: ['JP', 'ES'], onlyB: ['AU', 'BR'], bothWant: [] });
  });

  it('counts a UK nation as the UK and a region as its country', () => {
    const split = [visit('XE'), visit('XC'), visit('XH')];
    const plain = [visit('GB'), visit('US')];
    const result = compareMaps(split, plain);
    expect(result.both).toEqual(['GB', 'US']);
    expect(result.onlyB).toEqual([]);
  });

  it('lists the places both want to go to that neither has been to', () => {
    const a = [visit('PE', 'WANT_TO_GO'), visit('IS', 'WANT_TO_GO'), visit('NZ', 'WANT_TO_GO')];
    const b = [visit('PE', 'WANT_TO_GO'), visit('IS', 'WANT_TO_GO'), visit('NZ')];
    expect(compareMaps(a, b).bothWant).toEqual(['IS', 'PE']);
  });

  it('takes missing lists as empty', () => {
    expect(compareMaps(undefined, null)).toEqual({ both: [], onlyA: [], onlyB: [], bothWant: [] });
  });
});

describe('shareCodeFrom', () => {
  it('takes the code out of a share link', () => {
    expect(shareCodeFrom('https://myplanetview.com/shared/K7QX-M2PA-9RTW?x=1')).toBe('K7QX-M2PA-9RTW');
  });

  it('keeps a typed code without its spaces', () => {
    expect(shareCodeFrom('  k7qx m2pa 9rtw ')).toBe('k7qxm2pa9rtw');
  });

  it('gives an empty string for nothing', () => {
    expect(shareCodeFrom(undefined)).toBe('');
  });
});
