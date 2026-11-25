import { describe, it, expect } from 'vitest';
import { cleanMapSettings, mapStyleOf } from '../src/utils/mapSettings.js';

describe('mapStyleOf', () => {
  it('is the map’s own style, else the owner’s, else none', () => {
    expect(mapStyleOf('starry', { style: 'old-map' })).toBe('starry');
    expect(mapStyleOf(null, { style: 'old-map' })).toBe('old-map');
    expect(mapStyleOf(null, { showGrid: true })).toBeNull();
    expect(mapStyleOf(null, null)).toBeNull();
  });

  it('skips a style taken out since it was saved', () => {
    expect(mapStyleOf('galaxy', { style: 'mono' })).toBe('mono');
    expect(mapStyleOf(null, { style: 'jupiter' })).toBeNull();
    expect(mapStyleOf(null, 'starry')).toBeNull();
  });
});

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
      showTips: false,
      showCelebrations: false,
    };
    expect(cleanMapSettings(input)).toEqual({ ok: true, value: input });
  });

  // The celebration screen's switch (24 Nov 2026): true or false, nothing else
  it('keeps the celebrations switch, refusing a value that isn’t true or false', () => {
    expect(cleanMapSettings({ showCelebrations: true })).toEqual({ ok: true, value: { showCelebrations: true } });
    expect(cleanMapSettings({ showCelebrations: 'off' }).ok).toBe(false);
  });

  // The next trip's countdown and the map key (25 Nov 2026, the user's wish): true or false
  it('keeps the countdown and map key switches, refusing a value that isn’t true or false', () => {
    expect(cleanMapSettings({ showTripCountdown: false, showMapKey: false })).toEqual({
      ok: true,
      value: { showTripCountdown: false, showMapKey: false },
    });
    expect(cleanMapSettings({ showTripCountdown: 'off' }).ok).toBe(false);
    expect(cleanMapSettings({ showMapKey: 0 }).ok).toBe(false);
  });

  // The owner's supporter badge switch (24 Nov 2026): true or false, nothing else
  it('keeps the supporter badge switch, refusing a value that isn’t true or false', () => {
    expect(cleanMapSettings({ showSupporterBadge: false })).toEqual({ ok: true, value: { showSupporterBadge: false } });
    expect(cleanMapSettings({ showSupporterBadge: 'no' }).ok).toBe(false);
  });

  // The planned strings shown or hidden apart from the visited ones (25 Nov 2026)
  it('keeps the planned strings’ switch beside the strings’ own', () => {
    expect(cleanMapSettings({ showStrings: true, showPlannedStrings: false })).toEqual({ ok: true, value: { showStrings: true, showPlannedStrings: false } });
    expect(cleanMapSettings({ showPlannedStrings: 'yes' }).ok).toBe(false);
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

  // 24 Nov 2026, the user's wish: "Americans in miles always", and a choice
  it('accepts the three distance units and refuses any other', () => {
    for (const unit of ['auto', 'km', 'miles']) {
      expect(cleanMapSettings({ distanceUnit: unit })).toEqual({ ok: true, value: { distanceUnit: unit } });
    }
    expect(cleanMapSettings({ distanceUnit: 'nautical' }).ok).toBe(false);
    expect(cleanMapSettings({ distanceUnit: true }).ok).toBe(false);
    expect(cleanMapSettings({ distanceUnit: 'miles', showGrid: false })).toEqual({ ok: true, value: { distanceUnit: 'miles', showGrid: false } });
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

  it('accepts every style, Black and white among them, and drops the old switch for it', () => {
    for (const style of ['animated', 'mono', 'old-map', 'starry', 'engraved']) {
      expect(cleanMapSettings({ style })).toEqual({ ok: true, value: { style } });
    }
    expect(cleanMapSettings({ style: 'animated', blackAndWhite: true })).toEqual({ ok: true, value: { style: 'animated' } });
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
