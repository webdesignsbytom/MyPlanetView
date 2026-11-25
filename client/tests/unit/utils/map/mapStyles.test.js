// @vitest-environment node
// The map's styles and types (src/utils/map/mapStyles.js, mapTypes.js): which there are,
// the fallback for one taken out, the style a map is shown in, and Black and white.
import { describe, expect, it } from 'vitest';
import { MAP_STYLES, MAP_STYLE_IDS, MONO_STYLE, isMonoStyle, mapStyleById, shownStyle } from '@/utils/map/mapStyles';
import { MAP_TYPES, MAP_TYPE_IDS } from '@/utils/map/mapTypes';

describe('MAP_STYLES', () => {
  it('are the World map first, then Black and white, Old map, Starry night and the Engraved ocean', () => {
    expect(MAP_STYLE_IDS).toEqual(['animated', 'mono', 'old-map', 'starry', 'engraved']);
    expect(MAP_STYLES[0].label).toBe('World map');
  });

  it('draw the plain sea for the World map and Black and white, a picture for the others', () => {
    expect(mapStyleById('animated').background).toBeNull();
    expect(mapStyleById('mono').background).toBeNull();
    expect(mapStyleById('old-map').background).toBe('old-map');
    expect(mapStyleById('starry').background).toBe('starry-night');
    // 25 Nov 2026, the user's wish and artwork
    expect(mapStyleById('engraved')).toMatchObject({ label: 'Engraved ocean', background: 'engraved-ocean' });
  });
});

describe('mapStyleById', () => {
  it('finds a style by its id', () => {
    expect(mapStyleById('starry').label).toBe('Starry night');
  });

  it('opens a style taken out since, or none, as the World map', () => {
    expect(mapStyleById('jupiter').id).toBe('animated');
    expect(mapStyleById(undefined).id).toBe('animated');
  });
});

describe('shownStyle', () => {
  it('is the map’s own style, which everyone sees', () => {
    expect(shownStyle({ style: 'starry' }, 'old-map')).toBe('starry');
    expect(shownStyle({ style: 'mono' }, 'animated')).toBe('mono');
  });

  it('is the viewer’s own when the map has none, or one that’s gone', () => {
    expect(shownStyle({ style: null }, 'old-map')).toBe('old-map');
    expect(shownStyle({}, 'starry')).toBe('starry');
    expect(shownStyle({ style: 'galaxy' }, 'mono')).toBe('mono');
    expect(shownStyle(null, 'animated')).toBe('animated');
    expect(shownStyle(undefined, 'starry')).toBe('starry');
  });
});

describe('Black and white', () => {
  it('is the mono style', () => {
    expect(MONO_STYLE).toBe('mono');
    expect(isMonoStyle('mono')).toBe(true);
  });

  it('is no other style, nor a style taken out (which opens as the World map)', () => {
    expect(isMonoStyle('animated')).toBe(false);
    expect(isMonoStyle('starry')).toBe(false);
    expect(isMonoStyle('galaxy')).toBe(false);
    expect(isMonoStyle(undefined)).toBe(false);
  });
});

describe('MAP_TYPES', () => {
  it('are Regular and Detailed, each with its preview picture', () => {
    expect(MAP_TYPE_IDS).toEqual(['regular', 'detailed']);
    expect(MAP_TYPES).toEqual([
      { id: 'regular', label: 'Regular', preview: 'regular' },
      { id: 'detailed', label: 'Detailed', preview: 'detailed' },
    ]);
  });
});
