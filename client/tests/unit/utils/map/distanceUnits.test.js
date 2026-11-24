// @vitest-environment node
// Kilometres or miles (24 Nov 2026, the user's wish: "we need americans in miles always", and a choice)
import { describe, expect, it } from 'vitest';
import { DISTANCE_UNIT_IDS, MILES_PLACES, distanceUnitFor } from '@/utils/map/distanceUnits';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { DEFAULT_MAP_SETTINGS, cleanMapSettings } from '@/utils/map/mapSettings';
import { aboutDistance, aboutDistanceWords } from '@/utils/map/travelStatWords';

describe('distanceUnitFor', () => {
  it('is miles for a map whose home is in the United States, else kilometres', () => {
    expect(distanceUnitFor('auto', 'US')).toBe('miles');
    expect(distanceUnitFor('auto', 'XH')).toBe('miles');
    expect(distanceUnitFor('auto', 'PR')).toBe('miles');
    expect(distanceUnitFor('auto', 'GB')).toBe('km');
    expect(distanceUnitFor('auto', 'CA')).toBe('km');
    expect(distanceUnitFor('auto', null)).toBe('km');
    expect(distanceUnitFor(undefined, 'US')).toBe('miles');
  });

  it('follows a unit chosen, whatever the home', () => {
    expect(distanceUnitFor('km', 'US')).toBe('km');
    expect(distanceUnitFor('miles', 'FR')).toBe('miles');
    expect(distanceUnitFor('miles', null)).toBe('miles');
  });

  it('names only places on the map', () => {
    for (const code of MILES_PLACES) expect(COUNTRY_BY_CODE[code]).toBeTruthy();
  });
});

describe('the distanceUnit setting', () => {
  it('is automatic to start with, and keeps one of the three', () => {
    expect(DEFAULT_MAP_SETTINGS.distanceUnit).toBe('auto');
    expect(DISTANCE_UNIT_IDS).toEqual(['auto', 'km', 'miles']);
    expect(cleanMapSettings({ distanceUnit: 'miles' }).distanceUnit).toBe('miles');
    expect(cleanMapSettings({ distanceUnit: 'furlongs' }).distanceUnit).toBe('auto');
  });
});

describe('aboutDistance', () => {
  it('rounds the distance in its unit, the other for a note', () => {
    expect(aboutDistance(27281, 'km')).toEqual({ value: '27,300', unit: 'km', other: '17,000 miles' });
    expect(aboutDistance(27281, 'miles')).toEqual({ value: '17,000', unit: 'miles', other: '27,300 km' });
    expect(aboutDistance(27281)).toEqual({ value: '27,300', unit: 'km', other: '17,000 miles' });
    expect(aboutDistanceWords(9512, 'miles')).toBe('5,900 miles');
    expect(aboutDistanceWords(9512)).toBe('9,500 km');
    expect(aboutDistance(0, 'miles')).toEqual({ value: '0', unit: 'miles', other: '0 km' });
  });
});
