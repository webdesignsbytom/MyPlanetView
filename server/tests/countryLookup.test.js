import { describe, it, expect } from 'vitest';
import { countryAtPosition } from '../src/utils/countryLookup.js';

describe('countryAtPosition (map shapes, no external service)', () => {
  it.each([
    ['London', 51.5074, -0.1278, 'GB'],
    ['Paris', 48.8566, 2.3522, 'FR'],
    ['Tokyo', 35.6762, 139.6503, 'JP'],
    ['Sydney', -33.8688, 151.2093, 'AU'],
    ['Rio de Janeiro', -22.9068, -43.1729, 'BR'],
    ['Nairobi', -1.2921, 36.8219, 'KE'],
    ['Denver', 39.7392, -104.9903, 'US'],
  ])('%s -> %s', (_name, lat, lng, code) => {
    expect(countryAtPosition(lat, lng)).toBe(code);
  });

  it('finds an enclave rather than the country around it (Maseru -> Lesotho)', () => {
    expect(countryAtPosition(-29.31, 27.48)).toBe('LS');
  });

  it('knows an island the map leaves out (Malabo, on Bioko -> Equatorial Guinea, not Cameroon)', () => {
    expect(countryAtPosition(3.7533, 8.7836)).toBe('GQ');
    // ...without taking the Cameroon coast across the water
    expect(countryAtPosition(4.0167, 9.2)).toBe('CM'); // Limbe
  });

  it('finds Antarctica from its shape, and the geographic poles by latitude', () => {
    expect(countryAtPosition(-77.846, 166.676)).toBe('AQ'); // McMurdo Station
    expect(countryAtPosition(-64.774, -64.053)).toBe('AQ'); // Palmer Station, Antarctic Peninsula
    expect(countryAtPosition(-81.5, -175)).toBe('AQ'); // on the Ross Ice Shelf
    expect(countryAtPosition(-90, 0)).toBe('XS');
    expect(countryAtPosition(-89.95, 120)).toBe('XS');
    expect(countryAtPosition(89.95, -30)).toBe('XN');
    expect(countryAtPosition(90, 0)).toBe('XN');
  });

  it('never places a photo at a magnetic pole (they drift), and stops short of the North Pole', () => {
    const atMagneticNorth = countryAtPosition(85.762, 139.298);
    expect(atMagneticNorth).not.toBe('QN');
    expect(countryAtPosition(-63.851, 135.078)).not.toBe('QS');
    expect(countryAtPosition(89.8, 0)).toBe(null);
  });

  it('returns null in open sea', () => {
    expect(countryAtPosition(30, -40)).toBeNull();
    expect(countryAtPosition(-40, -120)).toBeNull();
  });

  it('returns null for an invalid position', () => {
    expect(countryAtPosition(200, 0)).toBeNull();
  });
});
