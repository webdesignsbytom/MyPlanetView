// controllers/helpers/landmarks.js: how many landmarks each place has (the country
// collections' totals), read once per instance, with the UK's counted in their nations on a
// map that splits the UK.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ findLandmarkPlaces: vi.fn() }));
vi.mock('../src/domain/places.js', () => ({ findLandmarkPlaces: fake.findLandmarkPlaces }));

const ROWS = [
  { countryCode: 'FR', latitude: 48.8584, longitude: 2.2945 }, // Eiffel Tower
  { countryCode: 'FR', latitude: 43.6047, longitude: 1.4442 },
  { countryCode: 'GB', latitude: 51.5007, longitude: -0.1246 }, // Westminster, England
  { countryCode: 'GB', latitude: 55.9486, longitude: -3.1999 }, // Edinburgh Castle, Scotland
  { countryCode: 'GB', latitude: 51.1789, longitude: -1.8262 }, // Stonehenge, England
];

// A fresh module each test, so its cache starts empty
const load = async () => {
  vi.resetModules();
  return import('../src/controllers/helpers/landmarks.js');
};

beforeEach(() => fake.findLandmarkPlaces.mockReset());

describe('landmarkTotals', () => {
  it('counts each country’s landmarks', async () => {
    fake.findLandmarkPlaces.mockResolvedValue(ROWS);
    const { landmarkTotals } = await load();
    expect(Object.fromEntries(await landmarkTotals(false))).toEqual({ FR: 2, GB: 3 });
  });

  it('counts the UK’s in their nations on a split map, keeping the whole UK for a collection from before the split', async () => {
    fake.findLandmarkPlaces.mockResolvedValue(ROWS);
    const { landmarkTotals } = await load();
    expect(Object.fromEntries(await landmarkTotals(true))).toEqual({ FR: 2, XE: 2, XC: 1, GB: 3 });
  });

  it('reads the landmarks once, and again only after a failure', async () => {
    fake.findLandmarkPlaces.mockRejectedValueOnce(new Error('down')).mockResolvedValue(ROWS);
    const { landmarkTotals } = await load();
    await expect(landmarkTotals(false)).rejects.toThrow('down');
    await landmarkTotals(false);
    await landmarkTotals(true);
    expect(fake.findLandmarkPlaces).toHaveBeenCalledTimes(2);
  });
});
