import { describe, expect, it } from 'vitest';
import { COASTLINE_TOLERANCE, countryAtPosition, distanceToCountry } from '@/dev/mock/countryLookup';
// The server's own lookup, which the mock's copies (from the same shapes)
import * as server from '../../../../../server/src/utils/countryLookup.js';

// Known places: [name, latitude, longitude, the place they're in]
const PLACES = [
  ['Paris', 48.8566, 2.3522, 'FR'],
  ['Lyon', 45.764, 4.8357, 'FR'],
  ['Rome', 41.9028, 12.4964, 'IT'],
  ['Milan', 45.4642, 9.19, 'IT'],
  ['Madrid', 40.4168, -3.7038, 'ES'],
  ['Seville', 37.3891, -5.9845, 'ES'],
  ['New York', 40.7484, -73.9857, 'US'],
  ['Denver', 39.7392, -104.9903, 'US'],
  // Hawaii is a region whose shapes are the US's, so a photo there is in the US
  ['Honolulu', 21.3069, -157.8583, 'US'],
  ['Tokyo', 35.6762, 139.6503, 'JP'],
  ['Osaka', 34.6937, 135.5023, 'JP'],
  ['Sydney', -33.8688, 151.2093, 'AU'],
  ['Alice Springs', -23.698, 133.8807, 'AU'],
  // Lesotho inside South Africa: the smallest containing shape wins
  ['Maseru', -29.3151, 27.4869, 'LS'],
  ['Johannesburg', -26.2041, 28.0473, 'ZA'],
  ['Denpasar, Bali', -8.6705, 115.2126, 'ID'],
  ['Tenerife (the Canaries, cut out of Spain)', 28.2916, -16.6291, 'IC'],
  ['London', 51.5074, -0.1278, 'GB'],
  ['Edinburgh', 55.9533, -3.1883, 'GB'],
  // The micro-states and islands the map draws no shape for are circles
  ['the Vatican', 41.9029, 12.4534, 'VA'],
  ['Monaco', 43.7384, 7.4246, 'MC'],
  ['Singapore', 1.3521, 103.8198, 'SG'],
  ['Andorra la Vella', 42.5063, 1.5218, 'AD'],
  ['Bioko', 3.53, 8.7, 'GQ'],
  ['Kastellorizo', 36.145, 29.585, 'GR'],
  // The Old City of Jerusalem is Palestine's (DECIDED_PLACES)
  ['the Old City of Jerusalem', 31.7767, 35.2345, 'PS'],
  ['Antarctica inland', -80, 30, 'AQ'],
];

describe('countryAtPosition', () => {
  it.each(PLACES)('finds %s', { timeout: 20000 }, async (name, latitude, longitude, code) => {
    expect(await countryAtPosition(latitude, longitude)).toBe(code);
  });

  it('takes a geographic pole from the latitude alone, before any shape', async () => {
    expect(await countryAtPosition(90, 0)).toBe('XN');
    expect(await countryAtPosition(89.95, 120)).toBe('XN');
    expect(await countryAtPosition(-90, 0)).toBe('XS');
    expect(await countryAtPosition(-89.92, -45)).toBe('XS');
  });

  it('never finds a magnetic pole from GPS', async () => {
    // The Magnetic North Pole's 2025 position is open Arctic sea on the map
    const found = await countryAtPosition(85.76, 139.3);
    expect(['QN', 'QS']).not.toContain(found);
  });

  it('answers null at sea, far from any coast', async () => {
    expect(await countryAtPosition(30, -40)).toBeNull();
    expect(await countryAtPosition(0, -140)).toBeNull();
    expect(await countryAtPosition(-40, 80)).toBeNull();
  });

  it('answers null for a position that is not on the Earth', async () => {
    expect(await countryAtPosition(91, 0)).toBeNull();
    expect(await countryAtPosition(0, 181)).toBeNull();
    expect(await countryAtPosition(Number.NaN, 0)).toBeNull();
  });
});

describe('distanceToCountry', () => {
  it('is 0 inside the country and grows away from it', async () => {
    expect(await distanceToCountry('FR', 48.8566, 2.3522)).toBe(0);
    const offshore = await distanceToCountry('FR', 49.5, -3);
    expect(offshore).toBeGreaterThan(0);
    expect(await distanceToCountry('FR', 40, -30)).toBeGreaterThan(offshore);
  });

  it('is null for a code with no shape, or a position off the Earth', async () => {
    expect(await distanceToCountry('ZZ', 48.8566, 2.3522)).toBeNull();
    expect(await distanceToCountry('VA', 41.9029, 12.4534)).toBeNull();
    expect(await distanceToCountry('FR', 95, 0)).toBeNull();
  });

  it('keeps the server’s coastline tolerance', () => {
    expect(COASTLINE_TOLERANCE).toBe(server.COASTLINE_TOLERANCE);
  });
});

describe('the same answers as the server', () => {
  // The places above, the poles, the sea, and a grid of points across Europe and beyond
  const grid = [];
  for (let lat = -50; lat <= 70; lat += 10) for (let lng = -170; lng <= 170; lng += 20) grid.push([lat, lng]);
  const points = [...PLACES.map(([, lat, lng]) => [lat, lng]), [90, 0], [-90, 0], [30, -40], [0, -140], ...grid];

  it('finds the same place for every point', { timeout: 30000 }, async () => {
    const differ = [];
    for (const [lat, lng] of points) {
      const mock = await countryAtPosition(lat, lng);
      const real = server.countryAtPosition(lat, lng);
      if (mock !== real) differ.push({ lat, lng, mock, real });
    }
    expect(differ).toEqual([]);
  });

  it('measures the same distances to a country', { timeout: 30000 }, async () => {
    for (const [code, lat, lng] of [
      ['FR', 49.5, -3],
      ['GB', 52, 3],
      ['JP', 30, 130],
      ['AU', -45, 150],
      ['ES', 40.4168, -3.7038],
    ]) {
      const mock = await distanceToCountry(code, lat, lng);
      const real = server.distanceToCountry(code, lat, lng);
      expect(mock).toBeCloseTo(real, 3);
    }
  });
});
