import { describe, expect, it } from 'vitest';
import { parseMomentSpot, spotFitsPlace, spotView } from '@/dev/mock/momentSpots';
import * as server from '../../../../../server/src/utils/momentSpots.js';

describe('parseMomentSpot', () => {
  const inputs = [
    undefined,
    null,
    { latitude: 48.8584, longitude: 2.2945 },
    { latitude: 48.85841234567, longitude: 2.29451234567, shared: true },
    { latitude: -90, longitude: 180, shared: false },
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: -181 },
    { latitude: '48', longitude: 2 },
    { latitude: 48, longitude: 2, shared: 'yes' },
    { latitude: Number.NaN, longitude: 2 },
    [48, 2],
    'here',
    42,
  ];

  it.each(inputs.map((input) => [JSON.stringify(input) ?? String(input), input]))('answers %s as the server does', (_, input) => {
    expect(parseMomentSpot(input)).toEqual(server.parseMomentSpot(input));
  });

  it('leaves a missing spot alone and takes a null one off', () => {
    expect(parseMomentSpot(undefined)).toEqual({ ok: true, value: undefined });
    expect(parseMomentSpot(null)).toEqual({ ok: true, value: { latitude: null, longitude: null, spotShared: false } });
  });

  it('rounds to six decimals and keeps the pin private unless shared', () => {
    expect(parseMomentSpot({ latitude: 48.85841234567, longitude: 2.29451234567 })).toEqual({
      ok: true,
      value: { latitude: 48.858412, longitude: 2.294512, spotShared: false },
    });
    expect(parseMomentSpot({ latitude: 1, longitude: 2, shared: true }).value.spotShared).toBe(true);
  });

  it('refuses a position off the Earth or a shared flag that isn’t true or false', () => {
    expect(parseMomentSpot({ latitude: 91, longitude: 0 }).ok).toBe(false);
    expect(parseMomentSpot({ latitude: 1, longitude: 2, shared: 1 }).ok).toBe(false);
    expect(parseMomentSpot([1, 2]).ok).toBe(false);
  });
});

describe('spotFitsPlace', () => {
  const cases = [
    ['the Eiffel Tower in France', { latitude: 48.8584, longitude: 2.2945 }, 'FR', true],
    ['the Eiffel Tower in Italy', { latitude: 48.8584, longitude: 2.2945 }, 'IT', false],
    // A pier just off the coast is within the leeway
    ['a pier at Brighton in the UK', { latitude: 50.8169, longitude: -0.1367 }, 'GB', true],
    ['the open Atlantic in Portugal', { latitude: 38, longitude: -20 }, 'PT', false],
    // The South Pole is in Antarctica
    ['the South Pole in Antarctica', { latitude: -90, longitude: 0 }, 'AQ', true],
    ['the South Pole itself', { latitude: -90, longitude: 0 }, 'XS', true],
    // A region's land is its country's (a moment's place is never a region: placeOnMap makes
    // it the country), so Waikiki fits the US, and the region's own code finds no shape
    ['Waikiki in the US', { latitude: 21.2793, longitude: -157.8292 }, 'US', true],
    ['Waikiki in Hawaii (no shape of its own)', { latitude: 21.2793, longitude: -157.8292 }, 'XH', false],
    // A nation by the nations' real outlines, and in the UK
    ['Edinburgh in Scotland', { latitude: 55.9533, longitude: -3.1883 }, 'XC', true],
    ['Edinburgh in England', { latitude: 55.9533, longitude: -3.1883 }, 'XE', false],
    ['London in England', { latitude: 51.5074, longitude: -0.1278 }, 'XE', true],
    ['Paris in England', { latitude: 48.8566, longitude: 2.3522 }, 'XE', false],
    ['Cardiff in Wales', { latitude: 51.4816, longitude: -3.1791 }, 'XW', true],
    ['Belfast in Northern Ireland', { latitude: 54.5973, longitude: -5.9301 }, 'XI', true],
  ];

  it.each(cases)('%s', { timeout: 20000 }, async (_, spot, code, fits) => {
    expect(await spotFitsPlace(spot, code)).toBe(fits);
  });

  it('gives the server’s answer for each', { timeout: 20000 }, async () => {
    for (const [, spot, code] of cases) expect(await spotFitsPlace(spot, code)).toBe(server.spotFitsPlace(spot, code));
  });
});

describe('spotView', () => {
  const pinned = { latitude: 48.8584, longitude: 2.2945, spotShared: false };

  it('has no pin for a moment without one', () => {
    expect(spotView({ latitude: null, longitude: null }, { canEdit: true })).toBeNull();
    expect(spotView({}, { canEdit: true })).toBeNull();
  });

  it('shows editors every pin, saying whether it’s shared', () => {
    expect(spotView(pinned, { canEdit: true })).toEqual({ latitude: 48.8584, longitude: 2.2945, shared: false });
    expect(spotView({ ...pinned, spotShared: true }, { canEdit: true }).shared).toBe(true);
  });

  it('shows anyone else only a shared pin, without the flag', () => {
    expect(spotView(pinned, { canEdit: false })).toBeNull();
    expect(spotView({ ...pinned, spotShared: true }, { canEdit: false })).toEqual({ latitude: 48.8584, longitude: 2.2945 });
  });

  it('gives the server’s answers', () => {
    for (const moment of [pinned, { ...pinned, spotShared: true }, { latitude: null }]) {
      for (const canEdit of [true, false]) expect(spotView(moment, { canEdit })).toEqual(server.spotView(moment, { canEdit }));
    }
  });
});
