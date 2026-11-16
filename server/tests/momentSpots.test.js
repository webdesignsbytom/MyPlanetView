import { describe, it, expect } from 'vitest';
import { parseMomentSpot, spotFitsPlace, spotView } from '../src/utils/momentSpots.js';

const EIFFEL = { latitude: 48.8584, longitude: 2.2945 };
const EDINBURGH = { latitude: 55.9533, longitude: -3.1883 };

describe('a moment’s pin', () => {
  it('reads a spot, a take-off (null) or nothing', () => {
    expect(parseMomentSpot(undefined)).toEqual({ ok: true, value: undefined });
    expect(parseMomentSpot(null)).toEqual({ ok: true, value: { latitude: null, longitude: null, spotShared: false } });
    // Not shared unless asked; six decimals kept
    expect(parseMomentSpot({ latitude: 48.85841234567, longitude: 2.29451234567 })).toEqual({
      ok: true,
      value: { latitude: 48.858412, longitude: 2.294512, spotShared: false },
    });
    expect(parseMomentSpot({ ...EIFFEL, shared: true }).value.spotShared).toBe(true);
  });

  it('refuses a spot out of range, half a spot, or a "shared" that isn’t true or false', () => {
    for (const bad of [{ latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: 10 }, { latitude: '48', longitude: '2' }, [], 'here', { ...EIFFEL, shared: 'yes' }]) {
      expect(parseMomentSpot(bad).ok, JSON.stringify(bad)).toBe(false);
    }
  });

  it('must be in the moment’s place, with the map’s leeway at borders, and the South Pole in Antarctica', () => {
    expect(spotFitsPlace(EIFFEL, 'FR')).toBe(true);
    expect(spotFitsPlace(EIFFEL, 'ES')).toBe(false);
    // Geneva is in Switzerland, a few km from France: close enough for a French moment
    expect(spotFitsPlace({ latitude: 46.2044, longitude: 6.1432 }, 'FR')).toBe(true);
    // The middle of the Atlantic isn't
    expect(spotFitsPlace({ latitude: 40, longitude: -30 }, 'FR')).toBe(false);
    expect(spotFitsPlace({ latitude: -89.95, longitude: 0 }, 'AQ')).toBe(true);
  });

  it('on a map that splits the UK, must be in that nation', () => {
    expect(spotFitsPlace(EDINBURGH, 'GB')).toBe(true);
    expect(spotFitsPlace(EDINBURGH, 'XC')).toBe(true);
    expect(spotFitsPlace(EDINBURGH, 'XE')).toBe(false);
  });

  it('shows editors every pin, with whether it’s shared; anyone else only a shared one', () => {
    const pinned = { ...EIFFEL, spotShared: false };
    expect(spotView(pinned, { canEdit: true })).toEqual({ ...EIFFEL, shared: false });
    expect(spotView(pinned, { canEdit: false })).toBeNull();
    expect(spotView({ ...EIFFEL, spotShared: true }, { canEdit: false })).toEqual(EIFFEL);
    expect(spotView({ latitude: null, longitude: null, spotShared: false }, { canEdit: true })).toBeNull();
  });
});
