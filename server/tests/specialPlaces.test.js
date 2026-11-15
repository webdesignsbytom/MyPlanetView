import { describe, it, expect } from 'vitest';
import { isPole, isSpecialPlace, poleAt, withParentPlaces } from '../src/utils/specialPlaces.js';

describe('special places', () => {
  it('knows Antarctica and the four poles, and which are points', () => {
    expect(['AQ', 'XN', 'QN', 'XS', 'QS'].every(isSpecialPlace)).toBe(true);
    expect(isSpecialPlace('FR')).toBe(false);
    expect(isPole('AQ')).toBe(false);
    expect(isPole('QS')).toBe(true);
  });

  it('adds Antarctica to a South Pole visit, once, and nothing to the others', () => {
    expect(withParentPlaces(['XS'])).toEqual(['XS', 'AQ']);
    expect(withParentPlaces(['XS', 'AQ', 'FR'])).toEqual(['XS', 'AQ', 'FR']);
    expect(withParentPlaces(['QS', 'XN', 'QN'])).toEqual(['QS', 'XN', 'QN']);
    expect(withParentPlaces([])).toEqual([]);
  });

  it('places a position at a geographic pole within 0.1° of latitude', () => {
    expect(poleAt(90)).toBe('XN');
    expect(poleAt(89.9)).toBe('XN');
    expect(poleAt(89.89)).toBe(null);
    expect(poleAt(-89.9)).toBe('XS');
    expect(poleAt(0)).toBe(null);
    expect(poleAt(Number.NaN)).toBe(null);
  });
});
