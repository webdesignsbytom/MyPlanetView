import { describe, it, expect } from 'vitest';
import { cleanMapSettings } from '../src/utils/mapSettings.js';

describe('cleanMapSettings', () => {
  it('keeps the known settings', () => {
    const input = {
      style: 'old-map',
      showGrid: true,
      showGridLabels: false,
      animatedSea: true,
      sunAndMoon: false,
      showCountryNames: true,
      hoverPreview: true,
      mapType: 'detailed',
      showVisited: true,
      showUnvisited: false,
      showUserBanner: true,
      blackAndWhite: true,
    };
    expect(cleanMapSettings(input)).toEqual({ ok: true, value: input });
  });

  it('accepts both map types and refuses any other', () => {
    expect(cleanMapSettings({ mapType: 'regular' })).toEqual({ ok: true, value: { mapType: 'regular' } });
    expect(cleanMapSettings({ mapType: 'satellite' }).ok).toBe(false);
  });

  it('accepts the four landmark pin modes and refuses any other', () => {
    for (const mode of ['zoomed', 'always', 'stamped', 'off']) {
      expect(cleanMapSettings({ landmarkPins: mode })).toEqual({ ok: true, value: { landmarkPins: mode } });
    }
    expect(cleanMapSettings({ landmarkPins: 'some' }).ok).toBe(false);
    expect(cleanMapSettings({ landmarkPins: true }).ok).toBe(false);
  });

  it('refuses the my_planet flags with a non-boolean value', () => {
    expect(cleanMapSettings({ showVisited: 'no' }).ok).toBe(false);
    expect(cleanMapSettings({ showUserBanner: 1 }).ok).toBe(false);
  });

  it('drops unknown keys', () => {
    expect(cleanMapSettings({ style: 'old-map', isAdmin: true, __proto__x: 1 })).toEqual({
      ok: true,
      value: { style: 'old-map' },
    });
  });

  it('accepts an empty object (nothing saved yet)', () => {
    expect(cleanMapSettings({})).toEqual({ ok: true, value: {} });
  });

  it('refuses a known key with a wrong value', () => {
    expect(cleanMapSettings({ style: 'neon' }).ok).toBe(false);
    expect(cleanMapSettings({ showGrid: 'yes' }).ok).toBe(false);
  });

  it('refuses the styles taken out (Jupiter clouds and Galaxy, 16 Nov 2026)', () => {
    expect(cleanMapSettings({ style: 'jupiter' }).ok).toBe(false);
    expect(cleanMapSettings({ style: 'galaxy' }).ok).toBe(false);
    expect(cleanMapSettings({ style: 'animated' })).toEqual({ ok: true, value: { style: 'animated' } });
  });

  it('refuses anything that is not a plain object', () => {
    expect(cleanMapSettings(null).ok).toBe(false);
    expect(cleanMapSettings(['animated']).ok).toBe(false);
    expect(cleanMapSettings('animated').ok).toBe(false);
  });
});
