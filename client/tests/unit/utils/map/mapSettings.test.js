// @vitest-environment node
// A person's map settings (src/utils/map/mapSettings.js): the defaults, the switches as
// Settings groups them, and cleanMapSettings, which keeps only known keys of the right type.
// The server keeps the same keys (server/src/utils/mapSettings.js): compared below.
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAP_SETTINGS,
  LANDMARK_PIN_MODES,
  LANDMARK_PIN_MODE_IDS,
  MAP_SETTINGS_STORAGE_KEY,
  MAP_SETTING_GROUPS,
  MAP_SETTING_TOGGLES,
  cleanMapSettings,
} from '@/utils/map/mapSettings';
import { MAP_STYLE_IDS } from '@/utils/map/mapStyles';
import { MAP_TYPE_IDS } from '@/utils/map/mapTypes';
import * as server from '../../../../../server/src/utils/mapSettings.js';

describe('the defaults', () => {
  it('open the World map, Regular, with only the passport’s landmark pins', () => {
    expect(DEFAULT_MAP_SETTINGS.style).toBe('animated');
    expect(DEFAULT_MAP_SETTINGS.mapType).toBe('regular');
    expect(DEFAULT_MAP_SETTINGS.landmarkPins).toBe('stamped');
  });

  it('switch every feature on but the grid’s labels and the country names, and haven’t asked about countries yet', () => {
    const off = Object.entries(DEFAULT_MAP_SETTINGS)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    expect(off.sort()).toEqual(['countriesAsked', 'showCountryNames', 'showGridLabels']);
  });

  it('keep the browser’s copy under one key', () => {
    expect(MAP_SETTINGS_STORAGE_KEY).toBe('myPlanetViewMapSettings');
  });
});

describe('the switches', () => {
  it('each have a default and a group Settings shows', () => {
    const groups = new Set(MAP_SETTING_GROUPS.map((group) => group.id));
    for (const toggle of MAP_SETTING_TOGGLES) {
      expect(typeof DEFAULT_MAP_SETTINGS[toggle.key], toggle.key).toBe('boolean');
      expect(groups.has(toggle.group), toggle.key).toBe(true);
      expect(toggle.label, toggle.key).toBeTruthy();
    }
  });

  it('are every true-or-false setting but countriesAsked, which isn’t a switch', () => {
    const booleans = Object.keys(DEFAULT_MAP_SETTINGS).filter((key) => typeof DEFAULT_MAP_SETTINGS[key] === 'boolean');
    const toggles = MAP_SETTING_TOGGLES.map((toggle) => toggle.key);
    expect(booleans.filter((key) => !toggles.includes(key))).toEqual(['countriesAsked']);
    expect(new Set(toggles).size).toBe(toggles.length);
  });

  it('every group has a switch', () => {
    for (const group of MAP_SETTING_GROUPS) expect(MAP_SETTING_TOGGLES.some((toggle) => toggle.group === group.id), group.id).toBe(true);
  });

  it('lock the grid and names on for the Detailed type, and the banner shows on wide screens only', () => {
    const detailed = MAP_SETTING_TOGGLES.filter((toggle) => toggle.detailed).map((toggle) => toggle.key);
    expect(detailed).toEqual(['showGrid', 'showGridLabels', 'showCountryNames']);
    expect(MAP_SETTING_TOGGLES.filter((toggle) => toggle.wideOnly).map((toggle) => toggle.key)).toEqual(['showUserBanner']);
  });

  it('offer four landmark pin modes', () => {
    expect(LANDMARK_PIN_MODE_IDS).toEqual(['zoomed', 'always', 'stamped', 'off']);
    expect(LANDMARK_PIN_MODES.every((mode) => mode.label)).toBe(true);
  });
});

describe('the server keeps the same keys', () => {
  it('has the same styles, map types and landmark pin modes', () => {
    expect(MAP_STYLE_IDS).toEqual([...server.MAP_STYLES]);
    expect(MAP_TYPE_IDS).toEqual([...server.MAP_TYPES]);
    expect(LANDMARK_PIN_MODE_IDS).toEqual([...server.LANDMARK_PIN_MODES]);
  });

  it('has the same true-or-false settings', () => {
    const booleans = Object.keys(DEFAULT_MAP_SETTINGS).filter((key) => typeof DEFAULT_MAP_SETTINGS[key] === 'boolean');
    expect(booleans.sort()).toEqual([...server.MAP_SETTING_FLAGS].sort());
  });
});

describe('cleanMapSettings', () => {
  it('gives the defaults for nothing, or for anything that isn’t an object', () => {
    for (const value of [undefined, null, 'starry', 42, true]) expect(cleanMapSettings(value)).toEqual(DEFAULT_MAP_SETTINGS);
  });

  it('gives a new object each time, never the defaults themselves', () => {
    const clean = cleanMapSettings({});
    clean.style = 'starry';
    expect(DEFAULT_MAP_SETTINGS.style).toBe('animated');
  });

  it('keeps the known settings', () => {
    const input = {
      style: 'old-map',
      mapType: 'detailed',
      landmarkPins: 'off',
      showGrid: false,
      showGridLabels: true,
      animatedSea: false,
      sunAndMoon: false,
      showCountryNames: true,
      hoverPreview: false,
      showVisited: false,
      showUnvisited: false,
      showUserBanner: false,
      showAntarctica: false,
      showMoments: false,
      showGoalTag: false,
      showStrings: false,
      showTips: false,
      countriesAsked: true,
    };
    expect(cleanMapSettings(input)).toEqual(input);
  });

  it('fills in what’s missing from the defaults', () => {
    expect(cleanMapSettings({ showGrid: false })).toEqual({ ...DEFAULT_MAP_SETTINGS, showGrid: false });
  });

  it('drops unknown keys', () => {
    const clean = cleanMapSettings(JSON.parse('{"showGrid":false,"theme":"dark","__proto__":{"style":"starry"}}'));
    expect(clean).not.toHaveProperty('theme');
    expect(clean.style).toBe('animated');
    expect(clean.showGrid).toBe(false);
  });

  it('falls back to the default for a value of the wrong kind', () => {
    const clean = cleanMapSettings({ showGrid: 'yes', showTips: 0, countriesAsked: 'true', mapType: 'satellite', landmarkPins: true });
    expect(clean.showGrid).toBe(true);
    expect(clean.showTips).toBe(true);
    expect(clean.countriesAsked).toBe(false);
    expect(clean.mapType).toBe('regular');
    expect(clean.landmarkPins).toBe('stamped');
  });

  it('opens a style taken out since as the World map', () => {
    expect(cleanMapSettings({ style: 'jupiter' }).style).toBe('animated');
    expect(cleanMapSettings({ style: 'galaxy' }).style).toBe('animated');
  });

  it('keeps every style, map type and pin mode there is', () => {
    for (const style of MAP_STYLE_IDS) expect(cleanMapSettings({ style }).style).toBe(style);
    for (const mapType of MAP_TYPE_IDS) expect(cleanMapSettings({ mapType }).mapType).toBe(mapType);
    for (const landmarkPins of LANDMARK_PIN_MODE_IDS) expect(cleanMapSettings({ landmarkPins }).landmarkPins).toBe(landmarkPins);
  });

  describe('the old Black and white switch', () => {
    it('opens as the Black and white style over the World map', () => {
      expect(cleanMapSettings({ blackAndWhite: true }).style).toBe('mono');
      expect(cleanMapSettings({ blackAndWhite: true, style: 'animated' }).style).toBe('mono');
      // A style taken out since is the World map, so the switch still turns it grey
      expect(cleanMapSettings({ blackAndWhite: true, style: 'galaxy' }).style).toBe('mono');
    });

    it('leaves any other style as it was', () => {
      expect(cleanMapSettings({ blackAndWhite: true, style: 'old-map' }).style).toBe('old-map');
      expect(cleanMapSettings({ blackAndWhite: true, style: 'starry' }).style).toBe('starry');
    });

    it('does nothing when off, or when it isn’t true', () => {
      expect(cleanMapSettings({ blackAndWhite: false }).style).toBe('animated');
      expect(cleanMapSettings({ blackAndWhite: 'true' }).style).toBe('animated');
    });

    it('is dropped from the settings', () => {
      expect(cleanMapSettings({ blackAndWhite: true })).not.toHaveProperty('blackAndWhite');
    });
  });

  it('keeps whether “Where have you been?” has been asked', () => {
    expect(cleanMapSettings({ countriesAsked: true }).countriesAsked).toBe(true);
    expect(cleanMapSettings({ countriesAsked: false }).countriesAsked).toBe(false);
    expect(cleanMapSettings({}).countriesAsked).toBe(false);
  });
});
